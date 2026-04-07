import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const results: Record<string, unknown> = {};

  // 1. Currency rates from NBRB
  try {
    const ratesRes = await fetch("https://api.nbrb.by/exrates/rates?periodicity=0");
    if (!ratesRes.ok) throw new Error(`NBRB rates API: ${ratesRes.status}`);
    const ratesJson = await ratesRes.json();

    const today = new Date().toISOString().slice(0, 10);
    const mainCurrencies = ["USD", "EUR", "RUB", "CNY", "GBP", "PLN", "UAH", "KZT", "JPY", "CHF"];

    // Get previous rates for change calculation
    const { data: prevRates } = await supabase
      .from("currency_rates")
      .select("currency_code, rate")
      .lt("rate_date", today)
      .order("rate_date", { ascending: false })
      .limit(50);

    const prevMap: Record<string, number> = {};
    if (prevRates) {
      for (const r of prevRates) {
        if (!prevMap[r.currency_code]) prevMap[r.currency_code] = Number(r.rate);
      }
    }

    const rows = ratesJson
      .filter((r: any) => mainCurrencies.includes(r.Cur_Abbreviation))
      .map((r: any) => {
        const normalizedRate = r.Cur_OfficialRate / r.Cur_Scale;
        const prev = prevMap[r.Cur_Abbreviation];
        const change = prev ? normalizedRate - prev : 0;
        return {
          currency_code: r.Cur_Abbreviation,
          currency_name: r.Cur_Name,
          rate: r.Cur_OfficialRate,
          rate_date: today,
          change_value: Math.round(change * 10000) / 10000,
        };
      });

    // Upsert (avoid duplicates for same date+code)
    for (const row of rows) {
      const { data: existing } = await supabase
        .from("currency_rates")
        .select("id")
        .eq("currency_code", row.currency_code)
        .eq("rate_date", row.rate_date)
        .maybeSingle();

      if (existing) {
        await supabase.from("currency_rates").update({
          rate: row.rate,
          currency_name: row.currency_name,
          change_value: row.change_value,
        }).eq("id", existing.id);
      } else {
        await supabase.from("currency_rates").insert(row);
      }
    }

    results.currencies = { count: rows.length, date: today };
  } catch (e) {
    results.currencies_error = (e as Error).message;
  }

  // 2. Refinancing rate from NBRB
  try {
    const refRes = await fetch("https://api.nbrb.by/refinancingrate");
    if (!refRes.ok) throw new Error(`NBRB ref rate API: ${refRes.status}`);
    const refJson = await refRes.json();

    // API returns array, last element is current
    const current = Array.isArray(refJson) ? refJson[refJson.length - 1] : refJson;
    const rateValue = current.Value ?? current.rate;
    const dateValue = current.Date ?? current.date;

    await supabase.from("economic_indicators").upsert({
      slug: "refinancing-rate",
      name_ru: "Ставка рефинансирования",
      current_value: `${rateValue}%`,
      value_type: "percent",
      effective_date: dateValue ? new Date(dateValue).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    }, { onConflict: "slug" });

    results.refinancing_rate = rateValue;
  } catch (e) {
    results.refinancing_rate_error = (e as Error).message;
  }

  // 3. Update USD/EUR/RUB indicators for header display
  try {
    const { data: latestRates } = await supabase
      .from("currency_rates")
      .select("currency_code, rate")
      .order("rate_date", { ascending: false })
      .limit(30);

    const rateMap: Record<string, number> = {};
    if (latestRates) {
      for (const r of latestRates) {
        if (!rateMap[r.currency_code]) rateMap[r.currency_code] = Number(r.rate);
      }
    }

    const currencyIndicators = [
      { slug: "usd-rate", name_ru: "Курс USD", code: "USD" },
      { slug: "eur-rate", name_ru: "Курс EUR", code: "EUR" },
      { slug: "rub-rate", name_ru: "Курс RUB/100", code: "RUB" },
    ];

    for (const ci of currencyIndicators) {
      if (rateMap[ci.code]) {
        await supabase.from("economic_indicators").upsert({
          slug: ci.slug,
          name_ru: ci.name_ru,
          current_value: `${rateMap[ci.code]} BYN`,
          value_type: "currency",
          effective_date: new Date().toISOString().slice(0, 10),
          updated_at: new Date().toISOString(),
        }, { onConflict: "slug" });
      }
    }
    results.currency_indicators = "updated";
  } catch (e) {
    results.currency_indicators_error = (e as Error).message;
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
