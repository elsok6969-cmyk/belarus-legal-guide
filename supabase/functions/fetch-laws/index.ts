import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Multiple sections of pravo.by for broader coverage
const PRAVO_URLS = [
  "https://pravo.by/novosti/novosti-pravo-by/",
  "https://pravo.by/novosti/obzory-i-kommentarii/",
  "https://pravo.by/novosti/novosti-zakonodatelstva/",
];

interface ParsedLaw {
  title: string;
  doc_number: string | null;
  doc_type: string;
  date_adopted: string | null;
  summary: string | null;
  source_url: string | null;
  body_text: string | null;
}

function extractDateFromText(text: string): string | null {
  const match = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (match) {
    return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }
  return null;
}

function detectDocType(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("кодекс")) return "codex";
  if (lower.includes("указ")) return "decree";
  if (lower.includes("декрет")) return "decree";
  if (lower.includes("постановлени")) return "resolution";
  if (lower.includes("распоряжени")) return "resolution";
  if (lower.includes("приказ")) return "order";
  return "law";
}

function extractDocNumber(title: string): string | null {
  const match = title.match(/№\s*(\S+)/);
  return match ? match[1] : null;
}

async function fetchPage(url: string): Promise<string> {
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; LegalPlatform/1.0)",
      "Accept-Language": "ru-RU,ru;q=0.9",
    },
  });
  if (!resp.ok) {
    console.warn(`Failed to fetch ${url}: ${resp.status}`);
    return "";
  }
  return await resp.text();
}

function parseItemsFromHtml(html: string, seen: Set<string>): ParsedLaw[] {
  const items: ParsedLaw[] = [];

  // Extract all <a> tags with href and text
  const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const [, href, rawTitle] = match;
    // Strip inner HTML tags from title
    const title = rawTitle.replace(/<[^>]+>/g, "").trim();

    if (title.length < 15 || seen.has(title)) continue;

    // Filter: must contain legal keywords or be from a document path
    const isDocumentLink = href.includes("/document/") || href.includes("/pravovaya-informatsiya/");
    const hasLegalKeyword = /закон|кодекс|указ|декрет|постановлен|распоряжен|приказ|о внесении|об изменении|об утверждении|опубликован/i.test(title);

    if (!isDocumentLink && !hasLegalKeyword) continue;

    seen.add(title);

    items.push({
      title: title.substring(0, 500),
      doc_number: extractDocNumber(title),
      doc_type: detectDocType(title),
      date_adopted: extractDateFromText(title),
      summary: null,
      source_url: href.startsWith("http") ? href : `https://pravo.by${href}`,
      body_text: null,
    });
  }

  return items;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let options = { mode: "check" };
    try {
      const body = await req.json();
      if (body.mode) options.mode = body.mode;
    } catch {
      // default check mode
    }

    console.log(`Fetching pravo.by updates (mode: ${options.mode})...`);

    const seen = new Set<string>();
    const allItems: ParsedLaw[] = [];

    // Fetch all sections in parallel
    const pages = await Promise.all(PRAVO_URLS.map(fetchPage));

    for (const html of pages) {
      if (!html) continue;
      const items = parseItemsFromHtml(html, seen);
      allItems.push(...items);
    }

    console.log(`Found ${allItems.length} potential law updates across ${PRAVO_URLS.length} sections`);

    if (options.mode === "check") {
      return new Response(
        JSON.stringify({
          success: true,
          mode: "check",
          found: allItems.length,
          items: allItems.map((i) => ({ title: i.title, doc_type: i.doc_type, source_url: i.source_url })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Import mode
    let imported = 0;
    let skipped = 0;

    for (const item of allItems) {
      // Check duplicate by title or source_url
      const { data: existing } = await supabase
        .from("documents")
        .select("id")
        .or(`title.eq.${item.title},source_url.eq.${item.source_url}`)
        .limit(1);

      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from("documents").insert({
        title: item.title,
        doc_type: item.doc_type,
        doc_number: item.doc_number,
        date_adopted: item.date_adopted,
        summary: item.summary,
        source_url: item.source_url,
        body_text: item.body_text,
        status: "active",
      });

      if (!error) {
        imported++;
      } else {
        console.warn(`Failed to insert: ${error.message}`);
      }
    }

    console.log(`Imported ${imported}, skipped ${skipped} duplicates`);

    return new Response(
      JSON.stringify({
        success: true,
        mode: "import",
        found: allItems.length,
        imported,
        skipped,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("fetch-laws error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
