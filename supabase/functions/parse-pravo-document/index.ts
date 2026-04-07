const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Section {
  section_type: string;
  number: string;
  title: string;
  content_markdown: string;
  content_text: string;
  level: number;
  sort_order: number;
  path: string;
  children: Section[];
}

// ── HTML cleaning ──

function removeByTagNames(html: string, tags: string[]): string {
  for (const tag of tags) {
    html = html.replace(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi'), '');
    html = html.replace(new RegExp(`<${tag}[^>]*\\/?>`, 'gi'), '');
  }
  return html;
}

function removeByClasses(html: string): string {
  const bad = ['breadcrumb', 'nav\\b', 'menu', 'sidebar', 'share', 'social', 'banner', 'advertising', 'cookie', 'popup', 'pagination', 'pager'];
  for (const cls of bad) {
    html = html.replace(new RegExp(`<[^>]+class="[^"]*${cls}[^"]*"[^>]*>[\\s\\S]*?<\\/[a-z]+>`, 'gi'), '');
  }
  return html;
}

function removeSocialLinks(html: string): string {
  return html.replace(/<a[^>]+href="[^"]*(?:facebook|twitter|vk\.com|ok\.ru|telegram|instagram|youtube)[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');
}

// ── Extract document body ──

function extractDocumentBody(html: string): string {
  // Try known containers
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

  // Fallback: find the largest <div> by content length
  const divs: { content: string; len: number }[] = [];
  const divRe = /<div[^>]*>([\s\S]*?)<\/div>/gi;
  let dm;
  while ((dm = divRe.exec(html)) !== null) {
    const text = dm[1].replace(/<[^>]+>/g, '').trim();
    if (text.length > 500) {
      divs.push({ content: dm[1], len: text.length });
    }
  }
  divs.sort((a, b) => b.len - a.len);
  if (divs.length > 0) return divs[0].content;

  // Last resort: return body content
  const bodyM = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return bodyM ? bodyM[1] : html;
}

// ── HTML → Markdown ──

function htmlToMarkdown(html: string): string {
  let md = html;

  // headings
  for (let i = 6; i >= 1; i--) {
    const prefix = '#'.repeat(i);
    md = md.replace(new RegExp(`<h${i}[^>]*>([\\s\\S]*?)<\\/h${i}>`, 'gi'), (_, c) => `\n${prefix} ${stripTags(c).trim()}\n`);
  }

  // tables
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

  // lists
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, c) => `\n- ${stripTags(c).trim()}`);
  md = md.replace(/<\/?[uo]l[^>]*>/gi, '\n');

  // formatting
  md = md.replace(/<(?:b|strong)[^>]*>([\s\S]*?)<\/(?:b|strong)>/gi, '**$1**');
  md = md.replace(/<(?:i|em)[^>]*>([\s\S]*?)<\/(?:i|em)>/gi, '*$1*');

  // paragraphs and breaks
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, c) => `\n${stripTags(c).trim()}\n`);
  md = md.replace(/<\/div>/gi, '\n');

  // strip remaining tags
  md = stripTags(md);

  // decode entities
  md = md.replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

  // clean whitespace
  md = md.replace(/[ \t]+$/gm, '');
  md = md.replace(/^\s+$/gm, '');
  md = md.replace(/\n{3,}/g, '\n\n');
  md = md.trim();

  return md;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}

// ── Extract title ──

function extractTitle(html: string, fullHtml: string): string {
  // Try h1/h2 inside body
  const h1 = html.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/i);
  if (h1) return stripTags(h1[1]).trim();

  // Try title class
  const titleEl = html.match(/<[^>]+class="[^"]*(?:title|document-title)[^"]*"[^>]*>([\s\S]*?)<\/[a-z]+>/i);
  if (titleEl) return stripTags(titleEl[1]).trim();

  // Fallback to <title> tag
  const pageTitle = fullHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (pageTitle) {
    let t = stripTags(pageTitle[1]).trim();
    // Remove "pravo.by" and navigation parts
    t = t.replace(/\s*[-–|]\s*pravo\.by.*/i, '').replace(/pravo\.by\s*[-–|]\s*/i, '');
    t = t.replace(/^(?:Главная|Правовая информация)\s*[/|]\s*/i, '');
    return t.trim();
  }

  return '';
}

// ── Extract doc metadata ──

function extractDocMeta(html: string, title: string): { doc_number: string; doc_date: string; status: string } {
  let doc_number = '';
  let doc_date = '';
  let status = 'active';

  // Try from title: "... от DD.MM.YYYY №XXX-X"
  const numMatch = title.match(/№\s*([^\s,]+)/);
  if (numMatch) doc_number = numMatch[1];

  const dateMatch = title.match(/от\s+(\d{1,2})[.\s](\d{1,2})[.\s](\d{4})/);
  if (dateMatch) {
    doc_date = `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
  }

  // Check for status hints
  const textLower = stripTags(html).toLowerCase();
  if (textLower.includes('утратил силу') || textLower.includes('не действует')) {
    status = 'expired';
  } else if (textLower.includes('не вступил в силу')) {
    status = 'not_effective_yet';
  }

  return { doc_number, doc_date, status };
}

// ── Section parsing ──

const SECTION_PATTERNS: { re: RegExp; type: string; level: number }[] = [
  { re: /^(РАЗДЕЛ\s+[IVXLCDM\d]+)\s*[.\s]*(.*)/i, type: 'part', level: 0 },
  { re: /^(ГЛАВА\s+\d+)\s*[.\s]*(.*)/i, type: 'chapter', level: 1 },
  { re: /^(Статья\s+\d+[\d.]*)\s*[.\s]*(.*)/i, type: 'article', level: 2 },
  { re: /^(§\s*\d+)\s*[.\s]*(.*)/i, type: 'paragraph', level: 3 },
];

function parseSections(markdown: string): Section[] {
  const lines = markdown.split('\n');
  const flat: { type: string; number: string; title: string; level: number; startLine: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/^#+\s*/, '').trim();
    for (const pat of SECTION_PATTERNS) {
      const m = line.match(pat.re);
      if (m) {
        flat.push({ type: pat.type, number: m[1].trim(), title: m[2].trim(), level: pat.level, startLine: i });
        break;
      }
    }
  }

  if (flat.length === 0) return [];

  // Assign content to each section
  const sections: Section[] = [];
  for (let i = 0; i < flat.length; i++) {
    const start = flat[i].startLine + 1;
    const end = i + 1 < flat.length ? flat[i + 1].startLine : lines.length;
    const contentLines = lines.slice(start, end);
    // Filter out lines that are themselves section headers of deeper level
    const content_md = contentLines.join('\n').trim();
    const content_text = content_md.replace(/[#*_`|>-]/g, '').replace(/\n{2,}/g, '\n').trim();

    sections.push({
      section_type: flat[i].type,
      number: flat[i].number,
      title: flat[i].title,
      content_markdown: content_md,
      content_text,
      level: flat[i].level,
      sort_order: i,
      path: '',
      children: [],
    });
  }

  // Build tree and assign paths
  return buildTree(sections);
}

function buildTree(flat: Section[]): Section[] {
  const root: Section[] = [];
  const stack: { section: Section; level: number }[] = [];
  const counters: number[] = [0, 0, 0, 0, 0];

  for (const sec of flat) {
    // Pop stack to find parent
    while (stack.length > 0 && stack[stack.length - 1].level >= sec.level) {
      stack.pop();
    }

    counters[sec.level]++;
    // Reset deeper counters
    for (let l = sec.level + 1; l < counters.length; l++) counters[l] = 0;

    // Build path
    const pathParts: number[] = [];
    for (let l = 0; l <= sec.level; l++) pathParts.push(counters[l]);
    sec.path = pathParts.filter(p => p > 0).join('.');

    if (stack.length === 0) {
      sec.sort_order = root.length;
      root.push(sec);
    } else {
      const parent = stack[stack.length - 1].section;
      sec.sort_order = parent.children.length;
      parent.children.push(sec);
    }

    stack.push({ section: sec, level: sec.level });
  }

  return root;
}

function countSections(sections: Section[]): number {
  let count = 0;
  for (const s of sections) {
    count += 1 + countSections(s.children);
  }
  return count;
}

// ── Main handler ──

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, document_type } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'url is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch HTML
    console.log('Fetching:', url);
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!resp.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: `HTTP ${resp.status} from source`,
        debug: { url, http_status: resp.status, raw_length: 0, extracted_length: 0 },
      }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const rawHtml = await resp.text();
    console.log('Fetched HTML length:', rawHtml.length);

    // 2. Clean & extract
    let bodyHtml = extractDocumentBody(rawHtml);
    bodyHtml = removeByTagNames(bodyHtml, ['script', 'style', 'nav', 'header', 'footer', 'noscript', 'iframe']);
    bodyHtml = removeByClasses(bodyHtml);
    bodyHtml = removeSocialLinks(bodyHtml);

    // Extract title before converting to markdown
    let title = extractTitle(bodyHtml, rawHtml);

    // Convert to markdown
    const content_markdown = htmlToMarkdown(bodyHtml);
    const content_text = content_markdown.replace(/[#*_`|>-]/g, '').replace(/\n{2,}/g, '\n').trim();

    // 3. Validate
    if (content_text.length < 500) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Content too short, likely parsing failed',
        debug: { url, http_status: 200, raw_length: rawHtml.length, extracted_length: content_text.length },
      }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const htmlArtifacts = (content_text.match(/[<>{}]/g) || []).length;
    if (htmlArtifacts / content_text.length > 0.3) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Content contains too much HTML/code artifacts',
        debug: { url, http_status: 200, raw_length: rawHtml.length, extracted_length: content_text.length },
      }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!title) {
      const pageTitleM = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      title = pageTitleM ? stripTags(pageTitleM[1]).replace(/[-–|].*pravo\.by.*/i, '').trim() : 'Без названия';
    }

    // 4. Extract metadata
    const meta = extractDocMeta(bodyHtml, title);

    // 5. Parse sections
    const sections = parseSections(content_markdown);

    const result = {
      success: true,
      title,
      doc_number: meta.doc_number,
      doc_date: meta.doc_date || null,
      status: meta.status,
      content_markdown,
      content_text,
      raw_html: bodyHtml.substring(0, 500000), // cap at 500KB
      sections,
      content_length: content_text.length,
      sections_count: countSections(sections),
    };

    console.log(`Parsed: "${title}", ${content_text.length} chars, ${result.sections_count} sections`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Parse error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
