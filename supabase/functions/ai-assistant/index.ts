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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();
    const { question, session_id, context_document_id, guest } = body;

    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "question is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let user: any = null;
    let profile: any = null;
    let requestsToday = 0;
    let isFree = true;

    // Auth — optional for guest mode
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (token) {
      const { data: { user: u }, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !u) {
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      user = u;

      // Load profile & check limits
      const { data: prof } = await supabase
        .from("profiles")
        .select("plan, ai_requests_today, ai_requests_reset_at")
        .eq("user_id", user.id)
        .single();
      profile = prof;

      const today = new Date().toISOString().split("T")[0];
      requestsToday = profile?.ai_requests_today || 0;

      if (profile?.ai_requests_reset_at !== today) {
        requestsToday = 0;
        await supabase
          .from("profiles")
          .update({ ai_requests_today: 0, ai_requests_reset_at: today })
          .eq("user_id", user.id);
      }

      isFree = !profile?.plan || profile.plan === "free";
      if (isFree && requestsToday >= FREE_PLAN_DAILY_LIMIT) {
        return new Response(
          JSON.stringify({
            error: "limit_exceeded",
            message: `Достигнут дневной лимит ${FREE_PLAN_DAILY_LIMIT} запросов. Обновите тариф для неограниченного доступа.`,
            requests_used: requestsToday,
            requests_limit: FREE_PLAN_DAILY_LIMIT,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (!guest) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("RAG: Starting search for:", question);

    // Step 1: Search documents using search_documents RPC
    const { data: searchResults, error: searchErr } = await supabase.rpc("search_documents", {
      search_query: question,
      result_limit: 5,
    });

    if (searchErr) {
      console.error("search_documents error:", searchErr);
    }

    const sources: Array<{ document_id: string; title: string; short_title: string | null; section?: string; url: string }> = [];
    let contextBlock = "";

    if (searchResults && searchResults.length > 0) {
      console.log(`RAG: Found ${searchResults.length} documents`);

      // Load content snippets for top results
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
    if (context_document_id) {
      console.log("RAG: Searching within context document:", context_document_id);

      const { data: docSections } = await supabase.rpc("search_within_document", {
        p_document_id: context_document_id,
        search_query: question,
      });

      if (docSections && docSections.length > 0) {
        // Also get document title
        const { data: ctxDoc } = await supabase
          .from("documents")
          .select("title, short_title")
          .eq("id", context_document_id)
          .single();

        contextBlock += "\n\n[КОНТЕКСТНЫЙ ДОКУМЕНТ: " + (ctxDoc?.title || "") + "\n" +
          docSections.slice(0, 10).map((s: any) =>
            `${s.section_type} ${s.number || ""} ${s.title || ""}\n${s.snippet?.replace(/<\/?mark>/g, "**") || ""}`
          ).join("\n---\n") +
          "\n]";

        // Add context doc sections to sources
        for (const s of docSections.slice(0, 5)) {
          sources.push({
            document_id: context_document_id,
            title: ctxDoc?.short_title || ctxDoc?.title || "",
            short_title: null,
            section: `${s.number || ""} ${s.title || ""}`.trim(),
            url: `/app/documents/${context_document_id}#section-${s.section_id}`,
          });
        }
      }
    }

    // Step 3: Load conversation history
    let historyMessages: Array<{ role: string; content: string }> = [];
    if (session_id) {
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
      { role: "user", content: question + contextBlock },
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
        return new Response(
          JSON.stringify({ error: "Слишком много запросов. Подождите немного." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Исчерпан лимит AI-запросов." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, t);
      return new Response(
        JSON.stringify({ error: "Ошибка AI-сервиса" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 5: Stream response with metadata
    const encoder = new TextEncoder();
    let fullAnswer = "";

    const transform = new TransformStream({
      start(controller) {
        // Send sources + metadata as first SSE event
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
        // Save messages after stream completes
        if (user && session_id && fullAnswer) {
          await supabase.from("assistant_messages").insert([
            { conversation_id: session_id, role: "user", content: question },
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
        // Increment counter for authenticated users only
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
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
