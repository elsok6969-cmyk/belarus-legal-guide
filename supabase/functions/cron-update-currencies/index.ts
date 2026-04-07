import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const NBRB_RATES_URL = "https://api.nbrb.by/exrates/rates?periodicity=0";
const NBRB_REFI_URL = "https://api.nbrb.by/refinancingrate";

const TRACKED_CURRENCIES: Record<number, string> = {
  431: "USD", 451: "EUR", 456: "RUB", 462: "CNY",
  452: "PLN", 449: "UAH", 429: "GBP",
};

const CURRENCY_NAMES: Record<string, string> = {
  USD: "Доллар США", EUR: "Евро", RUB: "Российский рубль",
  CNY: "Китайский юань", PLN: "Польский злотый",
  UAH: "Украинская гривна", GBP: "Фунт стерлингов",
};

async function sendTelegram(message: string) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
  });
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const today = new Date().toISOString().split("T")[0];
  const lines: string[] = [];
  let hasError = false;

  try {
    // 1. Fetch NBRB rates
    const ratesResp = await fetch(NBRB_RATES_URL);
    if (!ratesResp.ok) throw new Error(`NBRB API ${ratesResp.status}`);
    const rates: any[] = await ratesResp.json();

    for (const rate of rates) {
      const code = TRACKED_CURRENCIES[rate.Cur_ID];
      if (!code) continue;

      const newRate = rate.Cur_OfficialRate / rate.Cur_Scale;
      const scale = rate.Cur_Scale;

      // Get previous rate
      const { data: existing } = await supabase
        .from("currency_rates")
        .select("rate, id")
        .eq("currency_code", code)
        .order("rate_date", { ascending: false })
        .limit(1);

      const prevRate = existing?.[0]?.rate ? Number(existing[0].rate) : null;
      const change = prevRate ? +(rate.Cur_OfficialRate - prevRate * scale).toFixed(4) : 0;
      const arrow = change > 0 ? "▲" : change < 0 ? "▼" : "—";

      // Upsert rate for today
      await supabase
        .from("currency_rates")
        .upsert({
          currency_code: code,
          currency_name: CURRENCY_NAMES[code] || code,
          rate: rate.Cur_OfficialRate,
          rate_date: today,
          change_value: change,
        }, { onConflict: "currency_code,rate_date" });

      const scaleLabel = scale > 1 ? `/${scale}` : "";
      lines.push(
        `${code}${scaleLabel}: ${rate.Cur_OfficialRate.toFixed(4)} (${arrow} ${change >= 0 ? "+" : ""}${change})`
      );
    }

    // 2. Fetch refinancing rate
    let refiLine = "";
    try {
      const refiResp = await fetch(NBRB_REFI_URL);
      if (refiResp.ok) {
        const refiData: any[] = await refiResp.json();
        if (refiData.length > 0) {
          const latest = refiData[refiData.length - 1];
          const refiValue = latest.Value;
          await supabase
            .from("economic_indicators")
            .upsert({
              slug: "refinancing-rate",
              name_ru: "Ставка рефинансирования",
              current_value: `${refiValue}%`,
              effective_date: latest.Date?.split("T")[0] || today,
              source_url: "https://www.nbrb.by/statistics/monetarypolicyinstruments/refinancingrate",
            }, { onConflict: "slug" });
          refiLine = `Ставка рефинансирования: ${refiValue}%`;
        }
      }
    } catch (e) {
      refiLine = "Ставка рефинансирования: ошибка загрузки";
    }

    // 3. Log and notify
    await supabase.from("system_logs").insert({
      action: "update_currencies",
      status: "success",
      details: { rates_count: lines.length, date: today },
    });

    const msg = `📊 <b>Курсы обновлены</b> (${new Date().toLocaleTimeString("ru-RU", { timeZone: "Europe/Minsk" })})\n${lines.join("\n")}${refiLine ? "\n" + refiLine : ""}\n✅ Обновлено успешно`;
    await sendTelegram(msg);

    return new Response(JSON.stringify({ success: true, rates: lines.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    await supabase.from("system_logs").insert({
      action: "update_currencies",
      status: "error",
      details: { error: errMsg, date: today },
    });

    await sendTelegram(
      `🔴 <b>ОШИБКА</b>: API НБРБ недоступен\nКурсы НЕ обновлены. Дата: ${today}\nОшибка: ${errMsg}\nПроверь https://api.nbrb.by/exrates/rates?periodicity=0`
    );

    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
