import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SECTION_PATTERNS: { re: RegExp; type: string; level: number }[] = [
  { re: /^(ОБЩАЯ ЧАСТЬ|ОСОБЕННАЯ ЧАСТЬ)$/i, type: 'part', level: 0 },
  { re: /^(ЧАСТЬ\s+[IVXLCDM\d]+)\s*[.\s]*(.*)/i, type: 'part', level: 0 },
  { re: /^(РАЗДЕЛ\s+[IVXLCDM\d]+)\s*[.\s]*(.*)/i, type: 'section', level: 1 },
  { re: /^(ГЛАВА\s+\d+[\d.]*)\s*[.\s]*(.*)/i, type: 'chapter', level: 2 },
  { re: /^(Статья\s+\d+[\d.-]*)\s*[.\s]*(.*)/i, type: 'article', level: 3 },
  { re: /^(§\s*\d+)\s*[.\s]*(.*)/i, type: 'paragraph', level: 3 },
];

function matchSection(line: string): { type: string; number: string; title: string; level: number } | null {
  const cleaned = line.replace(/^#+\s*/, '').trim();
  for (const pat of SECTION_PATTERNS) {
    const m = cleaned.match(pat.re);
    if (m) {
      return {
        type: pat.type,
        number: m[1]?.trim() || '',
        title: m[2]?.trim() || '',
        level: pat.level,
      };
    }
  }
  return null;
}

interface FlatSection {
  section_type: string;
  number: string;
  title: string;
  content_markdown: string;
  content_text: string;
  level: number;
  sort_order: number;
}

function parseSectionsFromMarkdown(markdown: string): FlatSection[] {
  const lines = markdown.split('\n');
  const sections: FlatSection[] = [];
  let cur: { type: string; number: string; title: string; level: number; lines: string[] } | null = null;

  for (const line of lines) {
    const m = matchSection(line);
    if (m) {
      if (cur) {
        const content_md = cur.lines.join('\n').trim();
        sections.push({
          section_type: cur.type,
          number: cur.number,
          title: cur.title,
          content_markdown: content_md,
          content_text: content_md.replace(/[#*_`|>]/g, '').replace(/\n{2,}/g, '\n').trim(),
          level: cur.level,
          sort_order: sections.length,
        });
      }
      cur = { type: m.type, number: m.number, title: m.title, level: m.level, lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    }
  }
  if (cur) {
    const content_md = cur.lines.join('\n').trim();
    sections.push({
      section_type: cur.type,
      number: cur.number,
      title: cur.title,
      content_markdown: content_md,
      content_text: content_md.replace(/[#*_`|>]/g, '').replace(/\n{2,}/g, '\n').trim(),
      level: cur.level,
      sort_order: sections.length,
    });
  }
  return sections;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sb = createClient(supabaseUrl, supabaseKey);

  let docLimit = 1;
  let docOffset = 0;
  try {
    const body = await req.json();
    if (typeof body.limit === 'number') docLimit = body.limit;
    if (typeof body.offset === 'number') docOffset = body.offset;
  } catch { /* defaults */ }

  const { data: docs, error: docsErr } = await sb
    .from('documents')
    .select('id, short_title, title, content_markdown')
    .not('content_markdown', 'is', null)
    .order('created_at')
    .range(docOffset, docOffset + docLimit - 1);

  if (docsErr || !docs) {
    return new Response(JSON.stringify({ success: false, error: docsErr?.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const results: any[] = [];

  for (const doc of docs) {
    if (!doc.content_markdown || doc.content_markdown.length < 100) {
      results.push({ id: doc.id, title: doc.short_title, skipped: true });
      continue;
    }

    try {
      const sections = parseSectionsFromMarkdown(doc.content_markdown);
      if (sections.length === 0) {
        results.push({ id: doc.id, title: doc.short_title, skipped: true, reason: 'no sections' });
        continue;
      }

      // Delete old sections
      await sb.from('document_sections').delete().eq('document_id', doc.id);

      // Batch insert (50 at a time), NO parent_id to avoid FK issues
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
        if (insErr) {
          console.error(`Batch error doc=${doc.id} offset=${i}: ${insErr.message}`);
        } else {
          inserted += batch.length;
        }
      }

      const withContent = sections.filter(s => s.content_markdown.length > 0).length;
      results.push({
        id: doc.id,
        title: doc.short_title || doc.title,
        total: sections.length,
        inserted,
        with_content: withContent,
      });
      console.log(`✓ ${doc.short_title}: ${inserted} sections (${withContent} with content)`);
    } catch (e) {
      results.push({ id: doc.id, title: doc.short_title, error: (e as Error).message });
    }
  }

  return new Response(JSON.stringify({
    success: true,
    processed: results.length,
    next_offset: docOffset + docLimit,
    results,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
