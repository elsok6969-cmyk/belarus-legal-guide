import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

function htmlToMarkdown(html: string): string {
  let md = html;
  for (let i = 6; i >= 1; i--) {
    const prefix = "#".repeat(i);
    md = md.replace(new RegExp(`<h${i}[^>]*>([\\s\\S]*?)<\\/h${i}>`, "gi"), (_, c) => `\n${prefix} ${stripTags(c).trim()}\n`);
  }
  md = md.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, tbl) => {
    const rows: string[][] = [];
    const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trM;
    while ((trM = trRe.exec(tbl)) !== null) {
      const cells: string[] = [];
      const tdRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let tdM;
      while ((tdM = tdRe.exec(trM[1])) !== null) {
        cells.push(stripTags(tdM[1]).trim());
      }
      if (cells.length) rows.push(cells);
    }
    if (rows.length === 0) return '';
    const maxCols = Math.max(...rows.map(r => r.length));
    const lines = rows.map((r, i) => {
      const padded = [...r, ...Array(maxCols - r.length).fill('')];
      const line = '| ' + padded.join(' | ') + ' |';
      if (i === 0) return line + '\n| ' + padded.map(() => '---').join(' | ') + ' |';
      return line;
    });
    return '\n' + lines.join('\n') + '\n';
  });
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
  { re: /^(§\s*\d+)\s*[.\s]*(.*)$/i, type: "paragraph", level: 3 },
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

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");

  let body: any = {};
  try { body = await req.json(); } catch {}
  const { document_id, url } = body;

  if (!document_id || !url) {
    return new Response(JSON.stringify({ error: "document_id and url required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    console.log(`Scraping ${url} for doc ${document_id}`);

    // Use Firecrawl to scrape JS-rendered page
    const scrapeResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["html", "markdown"],
        waitFor: 3000,
        timeout: 30000,
      }),
    });

    if (!scrapeResp.ok) {
      const errText = await scrapeResp.text();
      console.error("Firecrawl error:", errText);
      return new Response(JSON.stringify({ error: "Scrape failed", details: errText }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scrapeData = await scrapeResp.json();
    const markdown = scrapeData.data?.markdown || "";
    const html = scrapeData.data?.html || "";
    
    console.log(`Got markdown: ${markdown.length} chars, html: ${html.length} chars`);

    if (markdown.length < 500) {
      return new Response(JSON.stringify({ error: "Content too short", length: markdown.length }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clean up the markdown - remove navigation/form elements
    let cleanMd = markdown;
    // Remove everything before the law title (nav menus, form elements)
    const lawStart = cleanMd.match(/(?:^|\n)(#{1,3}\s+(?:ЗАКОН|ДЕКРЕТ|УКАЗ|О\s|Статья|РАЗДЕЛ|ГЛАВА))/im);
    if (lawStart && lawStart.index !== undefined) {
      cleanMd = cleanMd.substring(lawStart.index);
    }
    
    const content_text = cleanMd.replace(/[#*_`|>-]/g, "").replace(/\n{2,}/g, "\n").trim();
    
    // Update document
    await supabase.from("documents").update({
      content_markdown: cleanMd,
      content_text,
      raw_html: html.substring(0, 500000),
      source_url: url,
      last_updated: new Date().toISOString(),
    }).eq("id", document_id);

    // Delete old sections and insert new
    await supabase.from("document_sections").delete().eq("document_id", document_id);
    const sections = parseSections(cleanMd);
    if (sections.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < sections.length; i += batchSize) {
        await supabase.from("document_sections").insert(
          sections.slice(i, i + batchSize).map((s: any) => ({ document_id, ...s }))
        );
      }
    }

    console.log(`Done: ${content_text.length} chars, ${sections.length} sections`);

    return new Response(JSON.stringify({
      success: true,
      chars: content_text.length,
      sections: sections.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
