import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Codexes list with pravo.by codes
const CODEX_CODES = [
  { code: "2121", title: "Гражданский кодекс Республики Беларусь" },
  { code: "2235", title: "Трудовой кодекс Республики Беларусь" },
  { code: "2919", title: "Налоговый кодекс Республики Беларусь (Общая часть)" },
  { code: "34603", title: "Налоговый кодекс Республики Беларусь (Особенная часть)" },
  { code: "2583", title: "Уголовный кодекс Республики Беларусь" },
  { code: "2974", title: "Кодекс Республики Беларусь об административных правонарушениях" },
  { code: "2661", title: "Гражданский процессуальный кодекс Республики Беларусь" },
  { code: "3361", title: "Хозяйственный процессуальный кодекс Республики Беларусь" },
  { code: "2584", title: "Уголовно-процессуальный кодекс Республики Беларусь" },
  { code: "2640", title: "Кодекс Республики Беларусь о браке и семье" },
  { code: "9535", title: "Жилищный кодекс Республики Беларусь" },
  { code: "2614", title: "Кодекс Республики Беларусь о земле" },
  { code: "348", title: "Банковский кодекс Республики Беларусь" },
  { code: "2586", title: "Уголовно-исполнительный кодекс Республики Беларусь" },
];

// Known important laws
const IMPORTANT_LAWS = [
  {
    title: "Конституция Республики Беларусь",
    doc_type_slug: "constitution",
    source_url: "https://pravo.by/pravovaya-informatsiya/normativnye-dokumenty/konstitutsiya-respubliki-belarus/",
    doc_number: null,
    doc_date: "1994-03-15",
    body_slug: "parliament",
  },
  {
    title: "О нормативных правовых актах",
    doc_type_slug: "law",
    source_url: "https://pravo.by/document/?guid=3961&p0=H11700130",
    doc_number: "130-З",
    doc_date: "2017-07-17",
    body_slug: "parliament",
  },
  {
    title: "О государственной регистрации и ликвидации (прекращении деятельности) субъектов хозяйствования",
    doc_type_slug: "decree",
    source_url: "https://pravo.by/document/?guid=3961&p0=Pd0900001",
    doc_number: "1",
    doc_date: "2009-01-16",
    body_slug: "president",
  },
  {
    title: "Об утверждении Инструкции о порядке исчисления и уплаты налога на добавленную стоимость",
    doc_type_slug: "instruction",
    source_url: null,
    doc_number: null,
    doc_date: null,
    body_slug: "mns",
  },
  {
    title: "О бухгалтерском учёте и отчётности",
    doc_type_slug: "law",
    source_url: "https://pravo.by/document/?guid=3961&p0=H11300057",
    doc_number: "57-З",
    doc_date: "2013-07-12",
    body_slug: "parliament",
  },
  {
    title: "Об аудиторской деятельности",
    doc_type_slug: "law",
    source_url: null,
    doc_number: "56-З",
    doc_date: "2013-07-12",
    body_slug: "parliament",
  },
  {
    title: "О хозяйственных обществах",
    doc_type_slug: "law",
    source_url: null,
    doc_number: "2020-З",
    doc_date: "2020-12-17",
    body_slug: "parliament",
  },
  {
    title: "О государственных закупках товаров (работ, услуг)",
    doc_type_slug: "law",
    source_url: null,
    doc_number: "419-З",
    doc_date: "2006-07-13",
    body_slug: "parliament",
  },
  {
    title: "Об охране труда",
    doc_type_slug: "law",
    source_url: null,
    doc_number: "356-З",
    doc_date: "2008-06-23",
    body_slug: "parliament",
  },
  {
    title: "Об охране окружающей среды",
    doc_type_slug: "law",
    source_url: null,
    doc_number: "1982-XII",
    doc_date: "1992-11-26",
    body_slug: "parliament",
  },
  {
    title: "О защите прав потребителей",
    doc_type_slug: "law",
    source_url: null,
    doc_number: "90-З",
    doc_date: "2002-01-09",
    body_slug: "parliament",
  },
  {
    title: "О подоходном налоге с физических лиц",
    doc_type_slug: "law",
    source_url: null,
    doc_number: null,
    doc_date: null,
    body_slug: "parliament",
  },
  {
    title: "О пенсионном обеспечении",
    doc_type_slug: "law",
    source_url: null,
    doc_number: "1596-XII",
    doc_date: "1992-04-17",
    body_slug: "parliament",
  },
  {
    title: "Об обязательных страховых взносах в бюджет ФСЗН",
    doc_type_slug: "law",
    source_url: null,
    doc_number: "138-XIII",
    doc_date: "1995-10-29",
    body_slug: "parliament",
  },
  {
    title: "О валютном регулировании и валютном контроле",
    doc_type_slug: "law",
    source_url: null,
    doc_number: "226-З",
    doc_date: "2003-07-22",
    body_slug: "parliament",
  },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Fetch page and try to parse document text from pravo.by
async function fetchDocContent(url: string): Promise<{ content_markdown: string; content_text: string } | null> {
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LegalPortal/1.0)",
        "Accept-Language": "ru-RU,ru;q=0.9",
      },
    });
    if (!resp.ok) return null;
    const html = await resp.text();

    // Try to extract main content
    const bodyMatch = html.match(/<div[^>]*class="[^"]*(?:document-body|lawbody|text-body)[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<\/|$)/i);
    let bodyHtml = bodyMatch?.[1] || "";

    if (bodyHtml.length < 200) {
      // Fallback: find largest content div
      const allDivs: { content: string; len: number }[] = [];
      const divRe = /<div[^>]*>([\s\S]{500,}?)<\/div>/gi;
      let m;
      while ((m = divRe.exec(html)) !== null) {
        const text = m[1].replace(/<[^>]+>/g, "").trim();
        allDivs.push({ content: m[1], len: text.length });
      }
      allDivs.sort((a, b) => b.len - a.len);
      if (allDivs.length > 0) bodyHtml = allDivs[0].content;
    }

    if (!bodyHtml || bodyHtml.length < 100) return null;

    // Simple HTML → text + markdown
    let md = bodyHtml;
    // Headings
    for (let i = 6; i >= 1; i--) {
      const prefix = "#".repeat(i);
      md = md.replace(new RegExp(`<h${i}[^>]*>([\\s\\S]*?)<\\/h${i}>`, "gi"), (_, c) => `\n${prefix} ${c.replace(/<[^>]+>/g, "").trim()}\n`);
    }
    md = md.replace(/<br\s*\/?>/gi, "\n");
    md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, c) => `\n${c.replace(/<[^>]+>/g, "").trim()}\n`);
    md = md.replace(/<[^>]+>/g, "");
    md = md.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
    md = md.replace(/\n{3,}/g, "\n\n").trim();

    const content_text = md.replace(/[#*_`|>-]/g, "").replace(/\n{2,}/g, "\n").trim();

    return { content_markdown: md, content_text };
  } catch (e) {
    console.error(`Fetch error for ${url}:`, e);
    return null;
  }
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let type = "all"; // "codex", "law", "all"
  let limit = 100;
  let scrapeContent = false;

  try {
    const body = await req.json();
    if (body.type) type = body.type;
    if (body.limit) limit = body.limit;
    if (body.scrape) scrapeContent = true;
  } catch {
    // defaults
  }

  // Load document_types and issuing_bodies for lookups
  const { data: docTypes } = await supabase.from("document_types").select("id, slug");
  const { data: bodies } = await supabase.from("issuing_bodies").select("id, slug");

  const typeMap = new Map((docTypes || []).map((t) => [t.slug, t.id]));
  const bodyMap = new Map((bodies || []).map((b) => [b.slug, b.id]));

  const startTime = Date.now();
  const { data: logEntry } = await supabase
    .from("import_logs")
    .insert({ type, limit_count: limit, status: "running", started_at: new Date().toISOString() })
    .select("id")
    .single();

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // --- Import codexes ---
    if (type === "codex" || type === "all") {
      const codexTypeId = typeMap.get("codex");
      const parliamentId = bodyMap.get("parliament");

      if (!codexTypeId) {
        console.error("document_type 'codex' not found");
      } else {
        for (const codex of CODEX_CODES.slice(0, limit)) {
          const sourceUrl = `https://pravo.by/document/?guid=3961&p0=${codex.code}`;

          // Check duplicate
          const { data: existing } = await supabase
            .from("documents")
            .select("id")
            .eq("source_url", sourceUrl)
            .maybeSingle();

          if (existing) {
            skipped++;
            continue;
          }

          let content_markdown: string | null = null;
          let content_text: string | null = null;

          if (scrapeContent) {
            await sleep(500);
            const content = await fetchDocContent(sourceUrl);
            if (content) {
              content_markdown = content.content_markdown;
              content_text = content.content_text;
            }
          }

          const { error } = await supabase.from("documents").insert({
            title: codex.title,
            document_type_id: codexTypeId,
            issuing_body_id: parliamentId || null,
            source_url: sourceUrl,
            status: "active",
            content_markdown,
            content_text,
          });

          if (error) {
            console.error(`Insert codex error: ${error.message}`);
            errors++;
          } else {
            imported++;
          }
        }
      }
    }

    // --- Import important laws ---
    if (type === "law" || type === "all") {
      for (const law of IMPORTANT_LAWS.slice(0, limit)) {
        const docTypeId = typeMap.get(law.doc_type_slug);
        if (!docTypeId) {
          console.warn(`Doc type not found: ${law.doc_type_slug}`);
          errors++;
          continue;
        }

        // Check duplicate by title
        const { data: existing } = await supabase
          .from("documents")
          .select("id")
          .eq("title", law.title)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        let content_markdown: string | null = null;
        let content_text: string | null = null;

        if (scrapeContent && law.source_url) {
          await sleep(500);
          const content = await fetchDocContent(law.source_url);
          if (content) {
            content_markdown = content.content_markdown;
            content_text = content.content_text;
          }
        }

        const { error } = await supabase.from("documents").insert({
          title: law.title,
          document_type_id: docTypeId,
          issuing_body_id: bodyMap.get(law.body_slug) || null,
          doc_number: law.doc_number,
          doc_date: law.doc_date,
          source_url: law.source_url,
          status: "active",
          content_markdown,
          content_text,
        });

        if (error) {
          console.error(`Insert law error: ${error.message}`);
          errors++;
        } else {
          imported++;
        }
      }
    }

    const duration = Date.now() - startTime;

    if (logEntry?.id) {
      await supabase
        .from("import_logs")
        .update({
          status: "completed",
          imported,
          errors,
          duration_ms: duration,
          completed_at: new Date().toISOString(),
        })
        .eq("id", logEntry.id);
    }

    console.log(`Import done: ${imported} imported, ${skipped} skipped, ${errors} errors in ${duration}ms`);

    return new Response(
      JSON.stringify({ success: true, imported, skipped, errors, duration_ms: duration }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (logEntry?.id) {
      await supabase
        .from("import_logs")
        .update({ status: "failed", error_message: msg, completed_at: new Date().toISOString() })
        .eq("id", logEntry.id);
    }
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
