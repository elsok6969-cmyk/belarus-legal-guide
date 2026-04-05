import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Step 1: Use Firecrawl Map to discover all document URLs
async function mapPravoBy(apiKey: string): Promise<string[]> {
  console.log("Mapping pravo.by for document URLs...");
  const resp = await fetch("https://api.firecrawl.dev/v1/map", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: "https://pravo.by",
      limit: 5000,
      includeSubdomains: false,
      search: "document",
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Firecrawl map failed: ${resp.status} ${err}`);
  }

  const data = await resp.json();
  const links: string[] = data.links || [];

  // Filter: only document pages
  const docLinks = links.filter(
    (url: string) =>
      url.includes("/document/") ||
      url.includes("guid=3961") ||
      url.includes("/pravovaya-informatsiya/")
  );

  console.log(`Map found ${links.length} total URLs, ${docLinks.length} document URLs`);
  return docLinks;
}

// Step 2: Scrape document page for content
async function scrapeDocument(
  apiKey: string,
  url: string
): Promise<{ markdown: string; title: string; metadata: Record<string, string> } | null> {
  try {
    const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    if (!resp.ok) {
      console.warn(`Scrape failed for ${url}: ${resp.status}`);
      return null;
    }

    const data = await resp.json();
    return {
      markdown: data.data?.markdown || data.markdown || "",
      title: data.data?.metadata?.title || data.metadata?.title || "",
      metadata: data.data?.metadata || data.metadata || {},
    };
  } catch (e) {
    console.error(`Scrape error for ${url}:`, e);
    return null;
  }
}

function detectDocType(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("кодекс")) return "codex";
  if (lower.includes("конституц")) return "constitution";
  if (lower.includes("указ")) return "decree";
  if (lower.includes("декрет")) return "decree";
  if (lower.includes("постановлени")) return "resolution";
  if (lower.includes("распоряжени")) return "order";
  if (lower.includes("приказ")) return "order";
  if (lower.includes("решени")) return "decision";
  if (lower.includes("инструкц")) return "instruction";
  if (lower.includes("положени")) return "regulation";
  return "law";
}

function extractDate(text: string): string | null {
  const m = text.match(/(\d{1,2})[\.\-](\d{1,2})[\.\-](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

function extractDocNumber(text: string): string | null {
  const m = text.match(/№\s*(\S+)/);
  return m ? m[1].replace(/[,;]$/, "") : null;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^а-яёa-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 100);
}

async function hashText(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check
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

  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!firecrawlKey) {
    return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let mode = "map"; // "map" = discover only, "import" = discover + scrape + save
  let scrapeLimit = 50; // max documents to scrape per run
  let searchQuery = "document";

  try {
    const body = await req.json();
    if (body.mode) mode = body.mode;
    if (body.limit) scrapeLimit = body.limit;
    if (body.search) searchQuery = body.search;
  } catch {
    // defaults
  }

  try {
    // Step 1: Map the site
    const docUrls = await mapPravoBy(firecrawlKey);

    if (mode === "map") {
      return new Response(
        JSON.stringify({
          success: true,
          mode: "map",
          total_urls: docUrls.length,
          urls: docUrls.slice(0, 200),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Import mode — scrape and save
    const { data: logEntry } = await supabase
      .from("import_logs")
      .insert({
        type: "crawl",
        limit_count: scrapeLimit,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    const startTime = Date.now();
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    const urlsToProcess = docUrls.slice(0, scrapeLimit);

    for (const url of urlsToProcess) {
      try {
        // Check if already imported by source_url
        const { data: existing } = await supabase
          .from("documents")
          .select("id, content_hash")
          .eq("source_url", url)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        await sleep(300); // rate limit

        const scraped = await scrapeDocument(firecrawlKey, url);
        if (!scraped || !scraped.markdown || scraped.markdown.length < 50) {
          errors++;
          continue;
        }

        const title = scraped.title || scraped.markdown.split("\n")[0].replace(/^#+\s*/, "").substring(0, 300);
        const contentHash = await hashText(scraped.markdown);
        const slug = generateSlug(title);

        // Check if slug exists
        const { data: slugExists } = await supabase
          .from("documents")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

        const docData = {
          title: title.substring(0, 500),
          doc_type: detectDocType(title),
          doc_number: extractDocNumber(title),
          date_adopted: extractDate(title) || extractDate(scraped.markdown),
          body_text: scraped.markdown,
          source_url: url,
          slug: slugExists ? `${slug}-${Date.now()}` : slug,
          content_hash: contentHash,
          is_free: true,
          status: "active" as const,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from("documents").insert(docData);
        if (error) {
          console.error(`Insert error for ${url}:`, error.message);
          errors++;
        } else {
          imported++;
        }
      } catch (e) {
        console.error(`Error processing ${url}:`, e);
        errors++;
      }
    }

    const duration = Date.now() - startTime;

    if (logEntry?.id) {
      await supabase
        .from("import_logs")
        .update({
          status: "completed",
          imported,
          updated,
          errors,
          duration_ms: duration,
          completed_at: new Date().toISOString(),
        })
        .eq("id", logEntry.id);
    }

    console.log(
      `Crawl completed: ${imported} imported, ${skipped} skipped, ${errors} errors in ${duration}ms`
    );

    return new Response(
      JSON.stringify({
        success: true,
        mode: "import",
        total_discovered: docUrls.length,
        processed: urlsToProcess.length,
        imported,
        skipped,
        updated,
        errors,
        duration_ms: duration,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error("Crawl error:", errorMsg);
    return new Response(JSON.stringify({ success: false, error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
