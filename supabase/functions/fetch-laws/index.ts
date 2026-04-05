import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Parse pravo.by recent updates page
const PRAVO_UPDATES_URL = "https://pravo.by/novosti/novosti-pravo-by/";

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
  // Match patterns like "12.03.2026" or "12 марта 2026"
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
  return "law";
}

function extractDocNumber(title: string): string | null {
  const match = title.match(/№\s*(\S+)/);
  return match ? match[1] : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for options
    let options = { mode: "check" }; // "check" = only report, "import" = actually import
    try {
      const body = await req.json();
      if (body.mode) options.mode = body.mode;
    } catch {
      // No body = default check mode
    }

    console.log(`Fetching pravo.by updates (mode: ${options.mode})...`);

    // Fetch the page
    const resp = await fetch(PRAVO_UPDATES_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LegalPlatform/1.0)",
        "Accept-Language": "ru-RU,ru;q=0.9",
      },
    });

    if (!resp.ok) {
      throw new Error(`pravo.by returned ${resp.status}`);
    }

    const html = await resp.text();

    // Simple HTML parsing — extract news items
    // pravo.by uses a list of items with titles and dates
    const items: ParsedLaw[] = [];

    // Extract <a> tags with titles from the news list
    const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi;
    let match;
    const seen = new Set<string>();

    while ((match = linkRegex.exec(html)) !== null) {
      const [, href, rawTitle] = match;
      const title = rawTitle.trim();

      // Filter to only law-related links (skip navigation, etc.)
      if (
        title.length < 20 ||
        seen.has(title) ||
        !href.includes("/document/") && !href.includes("/novosti/")
      ) {
        continue;
      }

      seen.add(title);

      // Only include items that look like legal documents
      const hasLegalKeyword = /закон|кодекс|указ|декрет|постановлен|о внесении|об изменении/i.test(title);
      if (!hasLegalKeyword) continue;

      items.push({
        title,
        doc_number: extractDocNumber(title),
        doc_type: detectDocType(title),
        date_adopted: extractDateFromText(title),
        summary: null,
        source_url: href.startsWith("http") ? href : `https://pravo.by${href}`,
        body_text: null,
      });

      if (items.length >= 20) break;
    }

    console.log(`Found ${items.length} potential law updates`);

    if (options.mode === "check") {
      return new Response(
        JSON.stringify({
          success: true,
          mode: "check",
          found: items.length,
          items: items.map((i) => ({ title: i.title, doc_type: i.doc_type, source_url: i.source_url })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Import mode — check for duplicates and insert new
    let imported = 0;
    for (const item of items) {
      // Check if already exists by title
      const { data: existing } = await supabase
        .from("documents")
        .select("id")
        .eq("title", item.title)
        .limit(1);

      if (existing && existing.length > 0) continue;

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

      if (!error) imported++;
    }

    console.log(`Imported ${imported} new documents`);

    return new Response(
      JSON.stringify({
        success: true,
        mode: "import",
        found: items.length,
        imported,
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
