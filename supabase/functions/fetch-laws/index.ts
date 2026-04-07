import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

function removeByTagNames(html: string, tags: string[]): string {
  for (const tag of tags) {
    html = html.replace(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"), "");
    html = html.replace(new RegExp(`<${tag}[^>]*\\/?>`, "gi"), "");
  }
  return html;
}

function extractDocumentBody(html: string): string {
  const containers = [
    /<div[^>]*class="[^"]*document-body[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<\/|$)/i,
    /<div[^>]*id="content_document"[^>]*>([\s\S]*?)<\/div>\s*(?:<\/|$)/i,
    /<div[^>]*class="[^"]*lawbody[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<\/|$)/i,
    /<div[^>]*class="[^"]*text-body[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<\/|$)/i,
  ];
  for (const re of containers) {
    const m = html.match(re);
    if (m && m[1] && m[1].length > 500) return m[1];
  }
  const bodyM = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return bodyM ? bodyM[1] : html;
}

function htmlToMarkdown(html: string): string {
  let md = html;
  for (let i = 6; i >= 1; i--) {
    const prefix = "#".repeat(i);
    md = md.replace(new RegExp(`<h${i}[^>]*>([\\s\\S]*?)<\\/h${i}>`, "gi"), (_, c) => `\n${prefix} ${stripTags(c).trim()}\n`);
  }
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, c) => `\n- ${stripTags(c).trim()}`);
  md = md.replace(/<\/?[uo]l[^>]*>/gi, "\n");
  md = md.replace(/<(?:b|strong)[^>]*>([\s\S]*?)<\/(?:b|strong)>/gi, "**$1**");
  md = md.replace(/<(?:i|em)[^>]*>([\s\S]*?)<\/(?:i|em)>/gi, "*$1*");
  md = md.replace(/<br\s*\/?>/gi, "\n");
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, c) => `\n${stripTags(c).trim()}\n`);
  md = md.replace(/<\/div>/gi, "\n");
  md = stripTags(md);
  md = md.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
  md = md.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
  md = md.replace(/\n{3,}/g, "\n\n").trim();
  return md;
}

const SECTION_PATTERNS: { re: RegExp; type: string; level: number }[] = [
  { re: /^(РАЗДЕЛ\s+[IVXLCDM\d]+)\s*[.\s]*(.*)$/i, type: "part", level: 0 },
  { re: /^(ГЛАВА\s+\d+)\s*[.\s]*(.*)$/i, type: "chapter", level: 1 },
  { re: /^(Статья\s+\d+[\d.]*)\s*[.\s]*(.*)$/i, type: "article", level: 2 },
];

function parseSections(markdown: string) {
  const lines = markdown.split("\n");
  const flat: { type: string; number: string; title: string; level: number; startLine: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/^#+\s*/, "").replace(/^\*\*\s*/, "").replace(/\s*\*\*$/, "").trim();
    for (const pat of SECTION_PATTERNS) {
      const m = line.match(pat.re);
      if (m) {
        flat.push({ type: pat.type, number: m[1].trim(), title: m[2].trim(), level: pat.level, startLine: i });
        break;
      }
    }
  }
  if (flat.length === 0) return [];
  const sections: any[] = [];
  for (let i = 0; i < flat.length; i++) {
    const start = flat[i].startLine + 1;
    const end = i + 1 < flat.length ? flat[i + 1].startLine : lines.length;
    const content_md = lines.slice(start, end).join("\n").trim();
    const content_text = content_md.replace(/[#*_`|>-]/g, "").replace(/\n{2,}/g, "\n").trim();
    sections.push({
      section_type: flat[i].type, number: flat[i].number, title: flat[i].title,
      content_markdown: content_md, content_text, level: flat[i].level,
      sort_order: i, path: String(i + 1),
    });
  }
  return sections;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const body = await req.json();
  const secret = Deno.env.get("IMPORT_SECRET");
  if (!secret || body.secret !== secret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Get empty documents with source_url
  const { data: docs } = await supabase
    .from("documents")
    .select("id, title, source_url, content_text")
    .not("source_url", "is", null);

  const emptyDocs = (docs || []).filter(d => !d.content_text || d.content_text.length < 200);
  const results: any[] = [];

  for (const doc of emptyDocs) {
    console.log(`Fetching: ${doc.title}`);
    try {
      const resp = await fetch(doc.source_url!, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept-Language": "ru-RU,ru;q=0.9",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      if (!resp.ok) {
        results.push({ title: doc.title, status: "http_error", code: resp.status });
        continue;
      }

      const rawHtml = await resp.text();
      let bodyHtml = extractDocumentBody(rawHtml);
      bodyHtml = removeByTagNames(bodyHtml, ["script", "style", "nav", "header", "footer", "noscript", "iframe"]);
      const content_markdown = htmlToMarkdown(bodyHtml);
      const content_text = content_markdown.replace(/[#*_`|>-]/g, "").replace(/\n{2,}/g, "\n").trim();

      if (content_text.length < 200) {
        results.push({ title: doc.title, status: "too_short", length: content_text.length });
        continue;
      }

      await supabase.from("documents").update({
        content_markdown, content_text,
        raw_html: bodyHtml.substring(0, 500000),
        last_updated: new Date().toISOString(),
      }).eq("id", doc.id);

      await supabase.from("document_sections").delete().eq("document_id", doc.id);
      const sections = parseSections(content_markdown);
      if (sections.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < sections.length; i += batchSize) {
          await supabase.from("document_sections").insert(
            sections.slice(i, i + batchSize).map(s => ({ document_id: doc.id, ...s }))
          );
        }
      }

      console.log(`OK: ${doc.title} — ${content_text.length} chars, ${sections.length} sections`);
      results.push({ title: doc.title, status: "ok", chars: content_text.length, sections: sections.length });
    } catch (e) {
      results.push({ title: doc.title, status: "error", error: String(e) });
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
