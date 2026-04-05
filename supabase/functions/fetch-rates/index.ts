import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// NBRB API — official rates for today
const NBRB_API = "https://api.nbrb.by/exrates/rates?periodicity=0";

// Currencies we care about
const TRACKED_CURRENCIES: Record<string, string> = {
  USD: "Доллар США",
  EUR: "Евро",
  RUB: "Российский рубль",
  PLN: "Польский злотый",
  GBP: "Фунт стерлингов",
  CNY: "Китайский юань",
  UAH: "Украинская гривна",
  JPY: "Японская иена",
  CHF: "Швейцарский франк",
  CZK: "Чешская крона",
  TRY: "Турецкая лира",
  KZT: "Казахстанский тенге",
};

interface NbrbRate {
  Cur_Abbreviation: string;
  Cur_Scale: number;
  Cur_Name: string;
  Cur_OfficialRate: number;
  Date: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch rates from NBRB
    console.log("Fetching rates from NBRB...");
    const nbrbResp = await fetch(NBRB_API);
    if (!nbrbResp.ok) {
      throw new Error(`NBRB API error: ${nbrbResp.status}`);
    }
    const allRates: NbrbRate[] = await nbrbResp.json();

    // 2. Filter to tracked currencies
    const tracked = allRates.filter((r) => r.Cur_Abbreviation in TRACKED_CURRENCIES);
    const rateDate = new Date().toISOString().split("T")[0];

    // 3. Get yesterday's rates for change calculation
    const { data: prevRates } = await supabase
      .from("currency_rates")
      .select("currency_code, rate")
      .lt("rate_date", rateDate)
      .order("rate_date", { ascending: false })
      .limit(Object.keys(TRACKED_CURRENCIES).length);

    const prevMap = new Map<string, number>();
    prevRates?.forEach((r: any) => {
      if (!prevMap.has(r.currency_code)) {
        prevMap.set(r.currency_code, Number(r.rate));
      }
    });

    // 4. Prepare rows
    const rows = tracked.map((r) => {
      const scale = r.Cur_Scale;
      const name =
        scale > 1
          ? `${TRACKED_CURRENCIES[r.Cur_Abbreviation]} (${scale})`
          : TRACKED_CURRENCIES[r.Cur_Abbreviation];
      const rate = r.Cur_OfficialRate;
      const prevRate = prevMap.get(r.Cur_Abbreviation);
      const change = prevRate ? +(rate - prevRate).toFixed(4) : 0;

      return {
        currency_code: r.Cur_Abbreviation,
        currency_name: name,
        rate,
        change_value: change,
        rate_date: rateDate,
      };
    });

    // 5. Delete existing rates for today (upsert logic)
    await supabase.from("currency_rates").delete().eq("rate_date", rateDate);

    // 6. Insert new rates
    const { error } = await supabase.from("currency_rates").insert(rows);
    if (error) throw error;

    console.log(`Inserted ${rows.length} rates for ${rateDate}`);

    return new Response(
      JSON.stringify({ success: true, date: rateDate, count: rows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("fetch-rates error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
