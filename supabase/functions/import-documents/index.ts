import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Список кодексов Беларуси с их кодами на pravo.by
const CODEX_CODES = [
  { code: "2121", title: "Гражданский кодекс", slug: "grazhdanskij-kodeks" },
  { code: "2235", title: "Трудовой кодекс", slug: "trudovoj-kodeks" },
  { code: "2919", title: "Налоговый кодекс (Общая часть)", slug: "nalogovyj-kodeks-obshchaya" },
  { code: "34603", title: "Налоговый кодекс (Особенная часть)", slug: "nalogovyj-kodeks-osobennaya" },
  { code: "2583", title: "Уголовный кодекс", slug: "ugolovnyj-kodeks" },
  { code: "2974", title: "Кодекс об административных правонарушениях", slug: "koap" },
  { code: "2661", title: "Гражданский процессуальный кодекс", slug: "gpk" },
  { code: "3361", title: "Хозяйственный процессуальный кодекс", slug: "hpk" },
  { code: "2584", title: "Уголовно-процессуальный кодекс", slug: "upk" },
  { code: "2640", title: "Кодекс о браке и семье", slug: "kodeks-o-brake-i-seme" },
  { code: "9535", title: "Жилищный кодекс", slug: "zhilishchnyj-kodeks" },
  { code: "2614", title: "Земельный кодекс", slug: "zemelnyj-kodeks" },
  { code: "5477", title: "Лесной кодекс", slug: "lesnoj-kodeks" },
  { code: "5605", title: "Водный кодекс", slug: "vodnyj-kodeks" },
  { code: "6549", title: "Воздушный кодекс", slug: "vozdushnyj-kodeks" },
  { code: "7623", title: "Кодекс внутреннего водного транспорта", slug: "kvvt" },
  { code: "3429", title: "Таможенный кодекс ЕАЭС", slug: "tamozhennyj-kodeks-eaes" },
  { code: "12243", title: "Кодекс о земле", slug: "kodeks-o-zemle" },
  { code: "2586", title: "Исполнительный кодекс", slug: "ispolnitelnyj-kodeks" },
  { code: "15202", title: "Кодекс об образовании", slug: "kodeks-ob-obrazovanii" },
  { code: "15203", title: "Кодекс здравоохранения", slug: "kodeks-zdravoohraneniya" },
  { code: "348", title: "Банковский кодекс", slug: "bankovskij-kodeks" },
  { code: "15601", title: "Избирательный кодекс", slug: "izbiratelnyj-kodeks" },
  { code: "15700", title: "Кодекс о культуре", slug: "kodeks-o-kulture" },
  { code: "15800", title: "Кодекс о недрах", slug: "kodeks-o-nedrah" },
  { code: "3950", title: "Уголовно-исполнительный кодекс", slug: "uik" },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function hashText(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function fetchDocumentMeta(
  code: string
): Promise<{ source_url: string; title?: string; date_adopted?: string | null; reg_number?: string; organ?: string } | null> {
  try {
    const url = `https://pravo.by/document/?guid=3961&p0=${code}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PravoBY-Bot/1.0)" },
    });
    if (!response.ok) return null;
    const html = await response.text();

    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const dateMatch = html.match(/Дата принятия[^:]*:\s*(\d{2}\.\d{2}\.\d{4})/);
    const numMatch = html.match(/Рег[\. ]номер[^:]*:\s*([^\n<]+)/);
    const organMatch = html.match(/Орган[^:]*:\s*([^\n<]+)/);

    return {
      source_url: url,
      title: titleMatch?.[1]?.trim(),
      date_adopted: dateMatch ? dateMatch[1].split(".").reverse().join("-") : null,
      reg_number: numMatch?.[1]?.trim(),
      organ: organMatch?.[1]?.trim(),
    };
  } catch (e) {
    console.error(`Error fetching meta for code ${code}:`, e);
    return null;
  }
}

async function fetchDocumentText(sourceUrl: string): Promise<string | null> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) return null;

  try {
    const etalonUrl = sourceUrl.replace("pravo.by", "etalonline.by");
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: etalonUrl,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.data?.markdown || null;
  } catch (e) {
    console.error("Firecrawl error:", e);
    return null;
  }
}

interface ImportResults {
  imported: number;
  updated: number;
  errors: number;
}

async function importDocuments(
  supabase: ReturnType<typeof createClient>,
  type: string,
  limit: number
): Promise<ImportResults> {
  const results: ImportResults = { imported: 0, updated: 0, errors: 0 };
  const documents = type === "codex" ? CODEX_CODES.slice(0, limit) : [];

  for (const doc of documents) {
    try {
      await sleep(500);

      const meta = await fetchDocumentMeta(doc.code);
      if (!meta) {
        results.errors++;
        continue;
      }

      const bodyText = await fetchDocumentText(meta.source_url);
      await sleep(500);

      const contentHash = bodyText ? await hashText(bodyText) : null;

      const { data: existing } = await supabase
        .from("documents")
        .select("id, content_hash")
        .eq("slug", doc.slug)
        .single();

      const docData: Record<string, unknown> = {
        title: meta.title || doc.title,
        doc_type: "codex",
        organ: meta.organ || "",
        date_adopted: meta.date_adopted || null,
        reg_number: meta.reg_number || "",
        body_text: bodyText || "",
        slug: doc.slug,
        source_url: meta.source_url,
        is_free: true,
        updated_at: new Date().toISOString(),
        ...(contentHash && { content_hash: contentHash }),
      };

      if (existing) {
        if (contentHash && existing.content_hash !== contentHash) {
          await supabase.from("documents").update(docData).eq("id", existing.id);
          results.updated++;
        }
      } else {
        await supabase.from("documents").insert(docData);
        results.imported++;
      }
    } catch (e) {
      console.error(`Error processing ${doc.title}:`, e);
      results.errors++;
    }
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const importSecret = Deno.env.get("IMPORT_SECRET");
  if (importSecret) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${importSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let type = "codex";
  let limit = 50;
  try {
    const body = await req.json();
    if (body.type) type = body.type;
    if (body.limit) limit = body.limit;
  } catch {
    // defaults
  }

  const startTime = Date.now();

  const { data: logEntry } = await supabase
    .from("import_logs")
    .insert({ type, limit_count: limit, status: "running", started_at: new Date().toISOString() })
    .select("id")
    .single();

  try {
    const results = await importDocuments(supabase, type, limit);
    const duration = Date.now() - startTime;

    if (logEntry?.id) {
      await supabase
        .from("import_logs")
        .update({
          status: "completed",
          imported: results.imported,
          updated: results.updated,
          errors: results.errors,
          duration_ms: duration,
          completed_at: new Date().toISOString(),
        })
        .eq("id", logEntry.id);
    }

    console.log(`Import completed: ${results.imported} imported, ${results.updated} updated, ${results.errors} errors in ${duration}ms`);

    return new Response(JSON.stringify({ success: true, ...results, duration_ms: duration }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    if (logEntry?.id) {
      await supabase
        .from("import_logs")
        .update({ status: "failed", error_message: errorMsg, completed_at: new Date().toISOString() })
        .eq("id", logEntry.id);
    }

    return new Response(JSON.stringify({ success: false, error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
