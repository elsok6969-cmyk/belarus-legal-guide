import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/* ── Section patterns (same as parse-pravo-document) ── */

const SECTION_PATTERNS: { re: RegExp; type: string; level: number }[] = [
  { re: /^(ОБЩАЯ ЧАСТЬ|ОСОБЕННАЯ ЧАСТЬ)$/i, type: 'part', level: 0 },
  { re: /^(ЧАСТЬ\s+[IVXLCDM\d]+)\s*[.\s]*(.*)/i, type: 'part', level: 0 },
  { re: /^(РАЗДЕЛ\s+[IVXLCDM\d]+)\s*[.\s]*(.*)/i, type: 'section', level: 1 },
  { re: /^(ГЛАВА\s+\d+[\d.]*)\s*[.\s]*(.*)/i, type: 'chapter', level: 2 },
  { re: /^(Статья\s+\d+[\d.-]*)\s*[.\s]*(.*)/i, type: 'article', level: 3 },
  { re: /^(§\s*\d+)\s*[.\s]*(.*)/i, type: 'paragraph', level: 3 },
];

interface FlatSection {
  section_type: string;
  number: string;
  title: string;
  content_markdown: string;
  content_text: string;
  level: number;
  sort_order: number;
  path: string;
  parent_id: string | null;
}

function matchSection(line: string): { type: string; number: string; title: string; level: number } | null {
  const cleaned = line.replace(/^#+\s*/, '').trim();
  for (const pat of SECTION_PATTERNS) {
    const m = cleaned.match(pat.re);
    if (m) {
      // For ОБЩАЯ/ОСОБЕННАЯ ЧАСТЬ patterns (no groups beyond [1])
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

function parseSectionsFromMarkdown(markdown: string): FlatSection[] {
  const lines = markdown.split('\n');
  const sections: FlatSection[] = [];
  let currentSection: {
    type: string; number: string; title: string; level: number;
    contentLines: string[]; startLine: number;
  } | null = null;

  for (const line of lines) {
    const match = matchSection(line);
    if (match) {
      // Save previous section
      if (currentSection) {
        const content_md = currentSection.contentLines.join('\n').trim();
        sections.push({
          section_type: currentSection.type,
          number: currentSection.number,
          title: currentSection.title,
          content_markdown: content_md,
          content_text: content_md.replace(/[#*_`|>]/g, '').replace(/\n{2,}/g, '\n').trim(),
          level: currentSection.level,
          sort_order: sections.length,
          path: '',
          parent_id: null,
        });
      }
      currentSection = {
        type: match.type,
        number: match.number,
        title: match.title,
        level: match.level,
        contentLines: [],
        startLine: 0,
      };
    } else if (currentSection) {
      currentSection.contentLines.push(line);
    }
    // Lines before first section are ignored (preamble)
  }

  // Don't forget the last section
  if (currentSection) {
    const content_md = currentSection.contentLines.join('\n').trim();
    sections.push({
      section_type: currentSection.type,
      number: currentSection.number,
      title: currentSection.title,
      content_markdown: content_md,
      content_text: content_md.replace(/[#*_`|>]/g, '').replace(/\n{2,}/g, '\n').trim(),
      level: currentSection.level,
      sort_order: sections.length,
      path: '',
      parent_id: null,
    });
  }

  // Assign parent_id based on level hierarchy
  // Each section's parent = the last section with a lower level value
  const parentStack: { id: number; level: number }[] = [];
  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    // Pop stack entries with same or higher level
    while (parentStack.length > 0 && parentStack[parentStack.length - 1].level >= sec.level) {
      parentStack.pop();
    }
    if (parentStack.length > 0) {
      sec.parent_id = String(parentStack[parentStack.length - 1].id);
    }
    parentStack.push({ id: i, level: sec.level });
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

  let docLimit = 5;
  let docOffset = 0;
  try {
    const body = await req.json();
    if (typeof body.limit === 'number') docLimit = body.limit;
    if (typeof body.offset === 'number') docOffset = body.offset;
  } catch { /* defaults */ }

  // Find documents with content_markdown but no sections
  const { data: docs, error: docsErr } = await sb
    .from('documents')
    .select('id, short_title, title, content_markdown')
    .not('content_markdown', 'is', null)
    .order('created_at')
    .range(docOffset, docOffset + docLimit - 1);

  if (docsErr || !docs) {
    return new Response(JSON.stringify({ success: false, error: docsErr?.message || 'No docs' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const results: any[] = [];

  for (const doc of docs) {
    if (!doc.content_markdown || doc.content_markdown.length < 100) {
      results.push({ id: doc.id, title: doc.short_title || doc.title, skipped: true, reason: 'no content' });
      continue;
    }

    try {
      // Parse sections
      const sections = parseSectionsFromMarkdown(doc.content_markdown);
      if (sections.length === 0) {
        results.push({ id: doc.id, title: doc.short_title || doc.title, skipped: true, reason: 'no sections parsed' });
        continue;
      }

      // Delete old sections
      await sb.from('document_sections').delete().eq('document_id', doc.id);

      // Insert new sections in batches, resolving parent_id
      // parent_id in our flat array is an index (string). We need to map to real UUIDs.
      const idMap: Record<string, string> = {};

      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        const realParentId = sec.parent_id !== null ? (idMap[sec.parent_id] || null) : null;

        const { data: inserted, error: insErr } = await sb
          .from('document_sections')
          .insert({
            document_id: doc.id,
            section_type: sec.section_type,
            number: sec.number || null,
            title: sec.title || null,
            content_markdown: sec.content_markdown || null,
            content_text: sec.content_text || null,
            level: sec.level,
            sort_order: sec.sort_order,
            path: sec.path || null,
            parent_id: realParentId,
          })
          .select('id')
          .single();

        if (insErr) {
          console.error(`Insert error for doc ${doc.id}, section ${i}: ${insErr.message}`);
          continue;
        }
        idMap[String(i)] = inserted.id;
      }

      const totalInserted = Object.keys(idMap).length;
      const withContent = sections.filter(s => s.content_markdown.length > 0).length;

      results.push({
        id: doc.id,
        title: doc.short_title || doc.title,
        sections_parsed: sections.length,
        sections_inserted: totalInserted,
        sections_with_content: withContent,
      });

      console.log(`✓ ${doc.short_title || doc.title}: ${totalInserted} sections (${withContent} with content)`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`✗ ${doc.short_title || doc.title}: ${msg}`);
      results.push({ id: doc.id, title: doc.short_title || doc.title, error: msg });
    }
  }

  return new Response(JSON.stringify({
    success: true,
    processed: results.length,
    next_offset: docOffset + docLimit,
    results,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
