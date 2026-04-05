import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NEWS_SOURCES = [
  {
    name: "pravo.by - Новости",
    url: "https://pravo.by/novosti/novosti-pravo-by/",
  },
  {
    name: "pravo.by - Обзоры",
    url: "https://pravo.by/novosti/obzory-i-kommentarii/",
  },
  {
    name: "pravo.by - Законодательство",
    url: "https://pravo.by/novosti/novosti-zakonodatelstva/",
  },
  {
    name: "minfin.gov.by - Новости",
    url: "https://minfin.gov.by/ru/news/",
  },
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^а-яёa-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 100);
}

function extractDate(text: string): string | null {
  const m = text.match(/(\d{1,2})[\.\-](\d{1,2})[\.\-](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}T00:00:00Z`;
  return null;
}

async function scrapeNewsPage(apiKey: string, url: string) {
  const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "links"],
      onlyMainContent: true,
    }),
  });

  if (!resp.ok) {
    console.error(`Scrape failed for ${url}: ${resp.status}`);
    return null;
  }

  const data = await resp.json();
  return {
    markdown: data.data?.markdown || data.markdown || "",
    links: data.data?.links || data.links || [],
  };
}

interface NewsItem {
  title: string;
  excerpt: string | null;
  slug: string;
  source_url: string;
  published_at: string | null;
}

function parseNewsFromMarkdown(markdown: string, sourceUrl: string): NewsItem[] {
  const items: NewsItem[] = [];
  const seen = new Set<string>();

  // Split by headings or list items that look like news
  const lines = markdown.split("\n");
  let currentTitle = "";
  let currentExcerpt = "";

  for (const line of lines) {
    const trimmed = line.trim();

    // Heading or bold text = potential news title
    const headingMatch = trimmed.match(/^#{1,3}\s+(.+)/);
    const boldMatch = trimmed.match(/^\*\*(.+?)\*\*/);
    const linkMatch = trimmed.match(/\[(.+?)\]\((.+?)\)/);

    if (headingMatch || boldMatch || (linkMatch && linkMatch[1].length > 20)) {
      // Save previous item
      if (currentTitle && currentTitle.length > 15 && !seen.has(currentTitle)) {
        seen.add(currentTitle);
        items.push({
          title: currentTitle.substring(0, 500),
          excerpt: currentExcerpt.substring(0, 1000) || null,
          slug: generateSlug(currentTitle) + "-" + Date.now().toString(36),
          source_url: sourceUrl,
          published_at: extractDate(currentTitle) || extractDate(currentExcerpt) || new Date().toISOString(),
        });
      }

      currentTitle = headingMatch?.[1] || boldMatch?.[1] || linkMatch?.[1] || "";
      currentTitle = currentTitle.replace(/\[|\]|\(.*?\)/g, "").trim();
      currentExcerpt = "";
    } else if (trimmed && currentTitle) {
      currentExcerpt += " " + trimmed;
    }
  }

  // Don't forget last item
  if (currentTitle && currentTitle.length > 15 && !seen.has(currentTitle)) {
    items.push({
      title: currentTitle.substring(0, 500),
      excerpt: currentExcerpt.substring(0, 1000) || null,
      slug: generateSlug(currentTitle) + "-" + Date.now().toString(36),
      source_url: sourceUrl,
      published_at: extractDate(currentTitle) || extractDate(currentExcerpt) || new Date().toISOString(),
    });
  }

  return items;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // No custom auth — rely on edge function config

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

  let mode = "check"; // "check" or "import"
  try {
    const body = await req.json();
    if (body.mode) mode = body.mode;
  } catch {
    // defaults
  }

  try {
    const allNews: NewsItem[] = [];

    for (const source of NEWS_SOURCES) {
      console.log(`Scraping news from: ${source.name}`);
      const result = await scrapeNewsPage(firecrawlKey, source.url);
      if (!result) continue;

      const items = parseNewsFromMarkdown(result.markdown, source.url);
      console.log(`Found ${items.length} news items from ${source.name}`);
      allNews.push(...items);
    }

    if (mode === "check") {
      return new Response(
        JSON.stringify({
          success: true,
          mode: "check",
          total: allNews.length,
          items: allNews.slice(0, 50).map((n) => ({
            title: n.title,
            published_at: n.published_at,
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Import mode
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const news of allNews) {
      try {
        // Check duplicate by title similarity
        const { data: existing } = await supabase
          .from("articles")
          .select("id")
          .eq("title", news.title)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        const { error } = await supabase.from("articles").insert({
          title: news.title,
          excerpt: news.excerpt,
          slug: news.slug,
          published_at: news.published_at,
          audience: "general",
          body: news.excerpt || "",
        });

        if (error) {
          console.error(`Insert error: ${error.message}`);
          errors++;
        } else {
          imported++;
        }
      } catch (e) {
        console.error(`Error importing news:`, e);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode: "import",
        total: allNews.length,
        imported,
        skipped,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error("Import news error:", errorMsg);
    return new Response(JSON.stringify({ success: false, error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
