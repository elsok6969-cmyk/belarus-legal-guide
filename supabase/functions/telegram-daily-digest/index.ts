import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_API = "https://api.telegram.org/bot";

async function sendTelegram(message: string): Promise<boolean> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");
  if (!token || !chatId) return false;

  const resp = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message.substring(0, 4096),
      parse_mode: "HTML",
    }),
  });
  const data = await resp.json();
  return data.ok === true;
}

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const parts: string[] = [];
    const today = new Date().toISOString().slice(0, 10);

    // ── 1. Currency rates ──
    try {
      const nbrbRes = await fetch("https://api.nbrb.by/exrates/rates?periodicity=0");
      if (nbrbRes.ok) {
        const rates = await nbrbRes.json();
        const main = ["USD", "EUR", "RUB", "CNY", "PLN"];
        const filtered = rates.filter((r: any) => main.includes(r.Cur_Abbreviation));

        // Get previous rates from DB for change calculation
        const { data: prevRates } = await supabase
          .from("currency_rates")
          .select("currency_code, rate")
          .order("rate_date", { ascending: false })
          .limit(50);

        const prevMap: Record<string, number> = {};
        if (prevRates) {
          for (const r of prevRates) {
            if (!prevMap[r.currency_code]) prevMap[r.currency_code] = Number(r.rate);
          }
        }

        let ratesText = `💱 <b>Курсы НБРБ на ${today}</b>\n`;
        for (const r of filtered) {
          const prev = prevMap[r.Cur_Abbreviation];
          const rate = r.Cur_OfficialRate;
          let arrow = "";
          if (prev) {
            const diff = rate - prev;
            if (Math.abs(diff) > 0.0001) {
              arrow = diff > 0 ? ` ↑${diff.toFixed(4)}` : ` ↓${Math.abs(diff).toFixed(4)}`;
            }
          }
          const scale = r.Cur_Scale > 1 ? `/${r.Cur_Scale}` : "";
          ratesText += `  ${r.Cur_Abbreviation}${scale}: <b>${rate.toFixed(4)}</b>${arrow}\n`;
        }
        parts.push(ratesText);
      }
    } catch (_) {
      parts.push("⚠️ Не удалось загрузить курсы НБРБ");
    }

    // ── 2. System errors (last 24h) ──
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const { data: errors, count: errorCount } = await supabase
      .from("system_logs")
      .select("action, details", { count: "exact" })
      .eq("status", "error")
      .gte("created_at", yesterday)
      .order("created_at", { ascending: false })
      .limit(5);

    if (errorCount && errorCount > 0) {
      let errText = `🚨 <b>Ошибки за 24ч: ${errorCount}</b>\n`;
      for (const e of errors || []) {
        const detail = typeof e.details === "object" && e.details
          ? (e.details as Record<string, unknown>).error_message || e.action
          : e.action;
        errText += `  • ${String(detail).substring(0, 80)}\n`;
      }
      parts.push(errText);
    } else {
      parts.push("✅ Ошибок за 24ч нет");
    }

    // ── 3. New documents (last 24h) ──
    const { data: newDocs, count: docCount } = await supabase
      .from("documents")
      .select("title, short_title, doc_number", { count: "exact" })
      .gte("created_at", yesterday)
      .order("created_at", { ascending: false })
      .limit(5);

    if (docCount && docCount > 0) {
      let docText = `📄 <b>Новые НПА: ${docCount}</b>\n`;
      for (const d of newDocs || []) {
        const name = d.short_title || d.title;
        docText += `  • ${name.substring(0, 80)}${d.doc_number ? ` (${d.doc_number})` : ""}\n`;
      }
      if (docCount > 5) docText += `  ... и ещё ${docCount - 5}\n`;
      parts.push(docText);
    } else {
      parts.push("📄 Новых НПА за 24ч нет");
    }

    // ── 4. Pending documents / updates ──
    const { count: pendingDocs } = await supabase
      .from("pending_documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: pendingUpdates } = await supabase
      .from("pending_updates")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    if ((pendingDocs || 0) > 0 || (pendingUpdates || 0) > 0) {
      parts.push(`📋 Ожидают: ${pendingDocs || 0} новых, ${pendingUpdates || 0} обновлений`);
    }

    // ── Send ──
    const message = parts.join("\n\n");
    const ok = await sendTelegram(message);

    await supabase.from("system_logs").insert({
      action: "telegram_daily_digest",
      status: ok ? "success" : "error",
      details: { sections: parts.length },
    });

    return new Response(JSON.stringify({ success: ok, date: today }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
