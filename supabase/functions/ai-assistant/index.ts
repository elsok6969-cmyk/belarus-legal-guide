import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Ты — профессиональный AI-помощник по законодательству Республики Беларусь в сервисе Бабиджон.

ПРАВИЛА:
1. Отвечай ТОЛЬКО на основе предоставленных документов. Не выдумывай статьи и нормы.
2. ВСЕГДА указывай конкретные ссылки: "Согласно ст. 242 ТК РБ..."
3. Если информации недостаточно — честно скажи и предложи уточнить запрос.
4. Отвечай на русском языке.
5. Формат ответа: кратко суть, затем детали со ссылками на статьи.
6. В конце всегда добавляй дисклеймер: "⚠️ Это информационная справка, не юридическая консультация. Для принятия решений обратитесь к специалисту."
7. Если спрашивают о калькуляторах/расчётах — направляй в раздел калькуляторов.
8. Ты НЕ связан с государственными органами Республики Беларусь.
9. Структурируй ответы: используй заголовки, списки, выделение жирным.
10. ВАЖНО: Когда упоминаешь конкретный документ или статью — ОБЯЗАТЕЛЬНО вставляй ссылку в формате markdown. Используй URL из контекста [НАЙДЕННЫЕ ДОКУМЕНТЫ]. Формат: [Название документа или "Ст. X"](/documents/UUID) или [Ст. X](/documents/UUID#section-SECTION_ID). Пользователь сможет кликнуть и сразу перейти к нужному месту.
11. Если пользователь просит найти статью, закон или норму — давай прямые ссылки на документы в ответе.`;

const FREE_PLAN_DAILY_LIMIT = 5;
const GUEST_DAILY_LIMIT = 3;
const MAX_QUESTION_LENGTH = 2000;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// --- Rate limiter (in-memory, per-instance) ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_MAX_REQUESTS = 15; // max per window

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_MAX_REQUESTS;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateLimitMap) {
    if (now > v.resetAt) rateLimitMap.delete(k);
  }
}, 300_000);

function errorResponse(msg: string, status: number, extra?: Record<string, unknown>) {
  return new Response(JSON.stringify({ error: msg, ...extra }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only POST allowed
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    // --- Parse & validate body ---
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    const { question, session_id, context_document_id, guest } = body as {
      question?: unknown;
      session_id?: unknown;
      context_document_id?: unknown;
      guest?: unknown;
    };

    // Validate question
    if (!question || typeof question !== "string") {
      return errorResponse("question is required and must be a string", 400);
    }
    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length === 0) {
      return errorResponse("question must not be empty", 400);
    }
    if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
      return errorResponse(`question exceeds maximum length of ${MAX_QUESTION_LENGTH} characters`, 400);
    }

    // Validate optional UUIDs
    if (session_id !== undefined && session_id !== null) {
      if (typeof session_id !== "string" || !UUID_REGEX.test(session_id)) {
        return errorResponse("session_id must be a valid UUID", 400);
      }
    }
    if (context_document_id !== undefined && context_document_id !== null) {
      if (typeof context_document_id !== "string" || !UUID_REGEX.test(context_document_id)) {
        return errorResponse("context_document_id must be a valid UUID", 400);
      }
    }

    // --- Rate limiting ---
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let user: { id: string } | null = null;
    let profile: any = null;
    let requestsToday = 0;
    let isFree = true;

    // Auth — optional for guest mode
    if (token) {
      // Validate JWT via getClaims first (fast, no DB call)
      const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
      if (claimsErr || !claimsData?.claims?.sub) {
        return errorResponse("unauthorized", 401);
      }

      const userId = claimsData.claims.sub as string;
      user = { id: userId };

      // Rate limit by user ID
      if (isRateLimited(`user:${userId}`)) {
        return errorResponse("Слишком много запросов. Подождите минуту.", 429);
      }

      // Load profile & check limits
      const { data: prof } = await supabase
        .from("profiles")
        .select("plan, ai_requests_today, ai_requests_reset_at")
        .eq("user_id", userId)
        .single();
      profile = prof;

      const today = new Date().toISOString().split("T")[0];
      requestsToday = profile?.ai_requests_today || 0;

      if (profile?.ai_requests_reset_at !== today) {
        requestsToday = 0;
        await supabase
          .from("profiles")
          .update({ ai_requests_today: 0, ai_requests_reset_at: today })
          .eq("user_id", userId);
      }

      isFree = !profile?.plan || profile.plan === "free";
      if (isFree && requestsToday >= FREE_PLAN_DAILY_LIMIT) {
        return errorResponse(
          "limit_exceeded",
          429,
          {
            message: `Достигнут дневной лимит ${FREE_PLAN_DAILY_LIMIT} запросов. Обновите тариф для неограниченного доступа.`,
            requests_used: requestsToday,
            requests_limit: FREE_PLAN_DAILY_LIMIT,
          }
        );
      }
    } else if (guest === true) {
      // Rate limit guests by IP (stricter)
      if (isRateLimited(`guest:${clientIP}`)) {
        return errorResponse("Слишком много запросов. Подождите минуту.", 429);
      }
    } else {
      return errorResponse("unauthorized", 401);
    }

    console.log("RAG: Starting search for:", trimmedQuestion.substring(0, 100));

    // Step 1: Search documents using search_documents RPC
    const { data: searchResults, error: searchErr } = await supabase.rpc("search_documents", {
      search_query: trimmedQuestion,
      result_limit: 5,
    });

    if (searchErr) {
      console.error("search_documents error:", searchErr);
    }

    const sources: Array<{ document_id: string; title: string; short_title: string | null; section?: string; url: string }> = [];
    let contextBlock = "";

    if (searchResults && searchResults.length > 0) {
      for (const result of searchResults.slice(0, 5)) {
        sources.push({
          document_id: result.id,
          title: result.title,
          short_title: result.short_title,
          url: `/documents/${result.id}`,
        });
      }

      contextBlock = "\n\n[НАЙДЕННЫЕ ДОКУМЕНТЫ:\n" +
        searchResults.slice(0, 5).map((r: any, i: number) =>
          `--- Документ ${i + 1}: ${r.title} (${r.document_type_name || ""}, № ${r.doc_number || "б/н"}) ---\n` +
          `URL: /documents/${r.id}\n` +
          `Статус: ${r.status}\n` +
          (r.snippet ? `Фрагмент: ${r.snippet.replace(/<\/?mark>/g, "**")}` : "Текст недоступен")
        ).join("\n\n") +
        "\n]";
    }

    // Step 2: If context_document_id, search within that document
    if (context_document_id && typeof context_document_id === "string") {
      const { data: docSections } = await supabase.rpc("search_within_document", {
        p_document_id: context_document_id,
        search_query: trimmedQuestion,
      });

      if (docSections && docSections.length > 0) {
        const { data: ctxDoc } = await supabase
          .from("documents")
          .select("title, short_title")
          .eq("id", context_document_id)
          .single();

        contextBlock += "\n\n[КОНТЕКСТНЫЙ ДОКУМЕНТ: " + (ctxDoc?.title || "") + "\n" +
          docSections.slice(0, 10).map((s: any) =>
            `${s.section_type} ${s.number || ""} ${s.title || ""}\nURL: /documents/${context_document_id}#section-${s.section_id}\n${s.snippet?.replace(/<\/?mark>/g, "**") || ""}`
          ).join("\n---\n") +
          "\n]";

        for (const s of docSections.slice(0, 5)) {
          sources.push({
            document_id: context_document_id,
            title: ctxDoc?.short_title || ctxDoc?.title || "",
            short_title: null,
            section: `${s.number || ""} ${s.title || ""}`.trim(),
            url: `/documents/${context_document_id}#section-${s.section_id}`,
          });
        }
      }
    }

    // Step 3: Load conversation history (only for authenticated users with valid session)
    let historyMessages: Array<{ role: string; content: string }> = [];
    if (session_id && user && typeof session_id === "string") {
      const { data: history } = await supabase
        .from("assistant_messages")
        .select("role, content")
        .eq("conversation_id", session_id)
        .order("created_at", { ascending: true })
        .limit(20);
      if (history) historyMessages = history;
    }

    // Step 4: Build messages and call AI
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...historyMessages.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: trimmedQuestion + contextBlock },
    ];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages,
          stream: true,
          temperature: 0.3,
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return errorResponse("Слишком много запросов. Подождите немного.", 429);
      }
      if (aiResponse.status === 402) {
        return errorResponse("Исчерпан лимит AI-запросов.", 402);
      }
      const t = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, t);
      return errorResponse("Ошибка AI-сервиса", 500);
    }

    // Step 5: Stream response with metadata
    const encoder = new TextEncoder();
    let fullAnswer = "";

    const transform = new TransformStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            sources,
            requests_used: requestsToday + 1,
            requests_limit: isFree ? FREE_PLAN_DAILY_LIMIT : null,
          })}\n\n`)
        );
      },
      transform(chunk, controller) {
        controller.enqueue(chunk);

        const text = new TextDecoder().decode(chunk);
        for (const line of text.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content;
            if (c) fullAnswer += c;
          } catch {}
        }
      },
      async flush() {
        if (user && session_id && fullAnswer) {
          await supabase.from("assistant_messages").insert([
            { conversation_id: session_id, role: "user", content: trimmedQuestion },
            {
              conversation_id: session_id,
              role: "assistant",
              content: fullAnswer,
              sources: sources,
            },
          ]);
          await supabase
            .from("assistant_conversations")
            .update({ last_message_at: new Date().toISOString() })
            .eq("id", session_id);
        }
        if (user) {
          await supabase
            .from("profiles")
            .update({ ai_requests_today: requestsToday + 1 })
            .eq("user_id", user.id);
        }
      },
    });

    const stream = aiResponse.body!.pipeThrough(transform);

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return errorResponse("Internal server error", 500);
  }
});
