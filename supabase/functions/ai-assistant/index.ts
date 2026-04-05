import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Ты — правовой ассистент по законодательству Республики Беларусь.

Правила:
1. Отвечай ТОЛЬКО на вопросы о белорусском праве и законодательстве.
2. Всегда указывай конкретные статьи, пункты и нормативные акты.
3. Используй официальные названия НПА (Трудовой кодекс РБ, НК РБ и т.д.).
4. Если вопрос не о белорусском праве — вежливо откажись.
5. Структурируй ответы: используй заголовки, списки, выделение жирным.
6. В конце КАЖДОГО ответа добавляй строку:
"⚠️ Это справочная информация, не юридическая консультация."
7. Ты НЕ связан с государственными органами Республики Беларусь.

Контекст из базы НПА будет предоставлен в сообщении пользователя в формате [ДОКУМЕНТЫ: ...].`;

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
    // Auth
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load profile & check limits
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, ai_requests_today, ai_requests_reset_at")
      .eq("user_id", user.id)
      .single();

    const today = new Date().toISOString().split("T")[0];
    let requestsToday = profile?.ai_requests_today || 0;

    if (profile?.ai_requests_reset_at !== today) {
      requestsToday = 0;
      await supabase
        .from("profiles")
        .update({ ai_requests_today: 0, ai_requests_reset_at: today })
        .eq("user_id", user.id);
    }

    if (profile?.plan === "free" && requestsToday >= FREE_PLAN_DAILY_LIMIT) {
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

    const { question, session_id } = await req.json();
    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "question is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Search related documents
    const { data: relatedDocs } = await supabase
      .from("documents")
      .select("id, title, slug, body_text, doc_type")
      .textSearch("fts", question, { type: "plain", config: "russian" })
      .limit(3);

    const sources = (relatedDocs || []).map((d) => ({
      id: d.id,
      title: d.title,
      slug: d.slug,
      doc_type: d.doc_type,
    }));

    // Build context from documents
    let contextBlock = "";
    if (relatedDocs && relatedDocs.length > 0) {
      contextBlock =
        "\n\n[ДОКУМЕНТЫ ИЗ БАЗЫ НПА:\n" +
        relatedDocs
          .map(
            (d) =>
              `${d.doc_type}: "${d.title}"\nФрагмент текста: ${d.body_text?.slice(0, 1500) || "текст недоступен"}`
          )
          .join("\n\n") +
        "]";
    }

    // Load conversation history (last 10 messages)
    let historyMessages: Array<{ role: string; content: string }> = [];
    if (session_id) {
      const { data: history } = await supabase
        .from("assistant_messages")
        .select("role, content")
        .eq("conversation_id", session_id)
        .order("created_at", { ascending: true })
        .limit(10);
      if (history) historyMessages = history;
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...historyMessages.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: question + contextBlock },
    ];

    // Call Lovable AI Gateway with streaming
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
          max_tokens: 1500,
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

    // Create a transform stream to:
    // 1. Prepend sources SSE event
    // 2. Pass through AI stream
    // 3. After stream ends, save messages & increment counter
    const encoder = new TextEncoder();
    let fullAnswer = "";

    const transform = new TransformStream({
      start(controller) {
        // Send sources as first SSE event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ sources, requests_used: requestsToday + 1, requests_limit: profile?.plan === "free" ? FREE_PLAN_DAILY_LIMIT : null })}\n\n`)
        );
      },
      transform(chunk, controller) {
        controller.enqueue(chunk);

        // Parse chunk to collect full answer
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
        if (session_id && fullAnswer) {
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
        // Increment request counter
        await supabase
          .from("profiles")
          .update({ ai_requests_today: requestsToday + 1 })
          .eq("user_id", user.id);
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
