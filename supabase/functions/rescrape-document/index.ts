import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Re-scrape a document from pravo.by using the full-text page (p2=1),
 * re-parse sections, update the DB.
 * 
 * POST body: { "slug": "296-з" } or { "document_id": "uuid" }
 */

const SECTION_PATTERNS: { re: RegExp; type: string; level: number }[] = [
  { re: /^(ОБЩАЯ ЧАСТЬ|ОСОБЕННАЯ ЧАСТЬ)$/i, type: 'part', level: 0 },
  { re: /^(ЧАСТЬ\s+[IVXLCDM\d]+)\s*[.\s]*(.*)/i, type: 'part', level: 0 },
  { re: /^(РАЗДЕЛ\s+[IVXLCDM\d]+)\s*[.\s]*(.*)/i, type: 'section', level: 1 },
  { re: /^(ГЛАВА\s+\d+[\d.]*)\s*[.\s]*(.*)/i, type: 'chapter', level: 2 },
  { re: /^(Статья\s+\d+[\d.-]*)\s*[.\s]*(.*)/i, type: 'article', level: 3 },
  { re: /^(§\s*\d+)\s*[.\s]*(.*)/i, type: 'paragraph', level: 3 },
];

function matchSection(line: string) {
  // Normalize non-breaking spaces (U+00A0) to regular spaces
  const cleaned = line.replace(/^#+\s*/, '').replace(/\u00a0/g, ' ').trim();
  for (const pat of SECTION_PATTERNS) {
    const m = cleaned.match(pat.re);
    if (m) return { type: pat.type, number: m[1]?.trim() || '', title: m[2]?.trim() || '', level: pat.level };
  }
  return null;
}

interface FlatSection {
  section_type: string; number: string; title: string;
  content_markdown: string; content_text: string;
  level: number; sort_order: number;
}

function parseSections(markdown: string): FlatSection[] {
  // Normalize non-breaking spaces throughout
  const lines = markdown.replace(/\u00a0/g, ' ').split('\n');
  const rawSections: FlatSection[] = [];
  let cur: { type: string; number: string; title: string; level: number; lines: string[] } | null = null;

  for (const line of lines) {
    const m = matchSection(line);
    if (m) {
      if (cur) {
        const content_md = cur.lines.join('\n').trim();
        rawSections.push({
          section_type: cur.type, number: cur.number, title: cur.title,
          content_markdown: content_md,
          content_text: content_md.replace(/[#*_`|>]/g, '').replace(/\n{2,}/g, '\n').trim(),
          level: cur.level, sort_order: rawSections.length,
        });
      }
      cur = { type: m.type, number: m.number, title: m.title, level: m.level, lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    }
  }
  if (cur) {
    const content_md = cur.lines.join('\n').trim();
    rawSections.push({
      section_type: cur.type, number: cur.number, title: cur.title,
      content_markdown: content_md,
      content_text: content_md.replace(/[#*_`|>]/g, '').replace(/\n{2,}/g, '\n').trim(),
      level: cur.level, sort_order: rawSections.length,
    });
  }

  // Dedup: keep the version with more content (body version over TOC stub)
  const seen = new Map<string, number>();
  const result: FlatSection[] = [];
  for (const sec of rawSections) {
    const key = `${sec.section_type}::${sec.number}::${sec.title}`;
    // Debug: log article 4 matches
    if (sec.number.includes('4') && sec.section_type === 'article') {
      console.log(`[DEDUP] key="${key}" content_len=${sec.content_markdown.length} title="${sec.title.substring(0, 50)}"`);
    }
    const prevIdx = seen.get(key);
    if (prevIdx !== undefined) {
      if (sec.content_markdown.length > result[prevIdx].content_markdown.length) {
        console.log(`[DEDUP] Replacing key="${key}" old_len=${result[prevIdx].content_markdown.length} new_len=${sec.content_markdown.length}`);
        result[prevIdx] = { ...sec, sort_order: result[prevIdx].sort_order };
      }
    } else {
      seen.set(key, result.length);
      result.push(sec);
    }
  }

  // Remove TOC stubs: sections that have no content and whose title duplicates a later section
  // (These are typically TOC entries at the top of the document)
  const final: FlatSection[] = [];
  for (const sec of result) {
    // Keep structural headers (part, section, chapter) even without content
    if (sec.section_type === 'part' || sec.section_type === 'section' || sec.section_type === 'chapter') {
      final.push(sec);
      continue;
    }
    // Keep articles with content
    if (sec.content_markdown.length > 0) {
      final.push(sec);
      continue;
    }
    // Empty article — still include it (title-only), user will see it's missing
    final.push(sec);
  }

  for (let i = 0; i < final.length; i++) final[i].sort_order = i;
  return final;
}

// Simple HTML → text/markdown (basic)
function htmlToMarkdown(html: string): string {
  let md = html;
  // Headers
  md = md.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_, l, t) => '\n' + '#'.repeat(Number(l)) + ' ' + stripTags(t).trim() + '\n');
  // Paragraphs
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, c) => '\n' + stripTags(c).trim() + '\n');
  // Bold
  md = md.replace(/<(b|strong)[^>]*>([\s\S]*?)<\/(b|strong)>/gi, '**$2**');
  // Italic
  md = md.replace(/<(i|em)[^>]*>([\s\S]*?)<\/(i|em)>/gi, '*$2*');
  // Line breaks
  md = md.replace(/<br\s*\/?>/gi, '\n');
  // Lists
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, c) => '- ' + stripTags(c).trim() + '\n');
  // Remove remaining tags
  md = stripTags(md);
  // Clean whitespace
  md = md.replace(/\n{3,}/g, '\n\n').trim();
  return md;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function extractDocBody(html: string): string {
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
  return html;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sb = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const { slug, document_id } = body;

    if (!slug && !document_id) {
      return new Response(JSON.stringify({ error: 'slug or document_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Get document
    let query = sb.from('documents').select('id, slug, title, short_title, source_url, content_markdown');
    if (slug) query = query.eq('slug', slug);
    else query = query.eq('id', document_id);
    const { data: doc, error: docErr } = await query.single();
    if (docErr || !doc) {
      return new Response(JSON.stringify({ error: 'Document not found', detail: docErr?.message }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Build full-text URL (p2=1 for full text on one page)
    let fetchUrl = doc.source_url;
    if (!fetchUrl) {
      return new Response(JSON.stringify({ error: 'No source_url for this document' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Replace p2=N with p2=1 for full text
    fetchUrl = fetchUrl.replace(/p2=\d+/, 'p2=1');

    console.log(`Fetching full text: ${fetchUrl}`);
    const resp = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: `HTTP ${resp.status} from pravo.by` }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawHtml = await resp.text();
    console.log(`Fetched ${rawHtml.length} bytes`);

    // 3. Extract body & convert to markdown
    let bodyHtml = extractDocBody(rawHtml);
    // Clean scripts/styles
    bodyHtml = bodyHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    bodyHtml = bodyHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    const content_markdown = htmlToMarkdown(bodyHtml);
    const content_text = content_markdown.replace(/[#*_`|>-]/g, '').replace(/\n{2,}/g, '\n').trim();

    if (content_text.length < 500) {
      return new Response(JSON.stringify({
        error: 'Parsed content too short',
        content_length: content_text.length,
        raw_length: rawHtml.length,
      }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 4. Parse sections
    const sections = parseSections(content_markdown);
    const articlesWithContent = sections.filter(s => s.section_type === 'article' && s.content_markdown.length > 0).length;
    const totalArticles = sections.filter(s => s.section_type === 'article').length;
    console.log(`Parsed ${sections.length} sections, ${articlesWithContent}/${totalArticles} articles with content`);

    // 5. Update document content
    const { error: updateErr } = await sb.from('documents').update({
      content_markdown,
      content_text: content_text.substring(0, 50000),
      source_url: fetchUrl,
      last_updated: new Date().toISOString(),
    }).eq('id', doc.id);

    if (updateErr) {
      console.error('Update error:', updateErr.message);
    }

    // 6. Delete old sections & insert new
    await sb.from('document_sections').delete().eq('document_id', doc.id);

    let inserted = 0;
    const BATCH = 50;
    for (let i = 0; i < sections.length; i += BATCH) {
      const batch = sections.slice(i, i + BATCH).map(s => ({
        document_id: doc.id,
        section_type: s.section_type,
        number: s.number || null,
        title: s.title || null,
        content_markdown: s.content_markdown || null,
        content_text: s.content_text || null,
        level: s.level,
        sort_order: s.sort_order,
        parent_id: null,
        path: null,
      }));
      const { error: insErr } = await sb.from('document_sections').insert(batch);
      if (insErr) console.error(`Batch insert error at ${i}: ${insErr.message}`);
      else inserted += batch.length;
    }

    return new Response(JSON.stringify({
      success: true,
      document: doc.short_title || doc.title,
      content_length: content_text.length,
      sections_total: sections.length,
      articles_total: totalArticles,
      articles_with_content: articlesWithContent,
      inserted,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
