import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function sendTelegram(message: string): Promise<boolean> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");

  if (!token || !chatId) {
    console.error("Telegram credentials not configured");
    return false;
  }

  try {
    const resp = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );
    const data = await resp.json();
    if (!data.ok) {
      console.error("Telegram error:", data);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Telegram send failed:", e);
    return false;
  }
}

async function logAction(
  supabase: any,
  action: string,
  status: string,
  details: Record<string, any> = {}
) {
  await supabase
    .from("system_logs")
    .insert({ action, status, details });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "message required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit message length
    const trimmed = message.substring(0, 4000);
    const ok = await sendTelegram(trimmed);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    await logAction(supabase, "send_telegram", ok ? "success" : "error", {
      message_length: trimmed.length,
    });

    return new Response(
      JSON.stringify({ success: ok }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

export { sendTelegram, logAction };
