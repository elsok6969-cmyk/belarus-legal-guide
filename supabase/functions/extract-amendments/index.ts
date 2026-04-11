import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}

interface ParsedAmendment {
  amendment_law_title: string;
  amendment_law_number: string | null;
  amendment_date: string | null; // ISO date
  effective_date: string | null;
  affected_articles: string[];
  raw_text: string;
}

function parseChangeAddSection(html: string): ParsedAmendment[] {
  // pravo.by uses <p class="changeadd"> for each amendment entry
  const amendments: ParsedAmendment[] = [];
  const pRe = /<p[^>]*class="[^"]*changeadd[^"]*"[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = pRe.exec(html)) !== null) {
    const text = stripTags(m[1]).trim();
    if (text.length < 10) continue;
    const parsed = parseAmendmentEntry(text);
    if (parsed) amendments.push(parsed);
  }

  // Fallback: try finding a div.changeadd container
  if (amendments.length === 0) {
    const containerMatch = html.match(/<div[^>]*class="[^"]*changeadd[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (containerMatch) {
      return parseAmendmentList(containerMatch[1]);
    }
  }

  return amendments;
}

function parseAmendmentList(html: string): ParsedAmendment[] {
  const amendments: ParsedAmendment[] = [];

  // Split by <li>, <p>, or <br> to get individual entries
  const entries: string[] = [];

  // Try <li> items first
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = liRe.exec(html)) !== null) {
    entries.push(stripTags(m[1]).trim());
  }

  // If no <li>, try <p> or <br>-separated
  if (entries.length === 0) {
    const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    while ((m = pRe.exec(html)) !== null) {
      entries.push(stripTags(m[1]).trim());
    }
  }

  if (entries.length === 0) {
    // Split by <br> or newlines
    const text = stripTags(html);
    const lines = text.split(/[\n;]/).map(l => l.trim()).filter(l => l.length > 20);
    entries.push(...lines);
  }

  for (const entry of entries) {
    if (entry.length < 10) continue;
    const parsed = parseAmendmentEntry(entry);
    if (parsed) amendments.push(parsed);
  }

  return amendments;
}

function parseAmendmentEntry(text: string): ParsedAmendment | null {
  // Extract law number: № XXX-З or N XXX-З
  const numMatch = text.match(/[№N]\s*(\d+[\-\/]?[А-Яа-яA-Z]*)/);
  const lawNumber = numMatch ? numMatch[1] : null;

  // Extract date: от DD.MM.YYYY or от DD месяц YYYY
  const months: Record<string, string> = {
    'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04',
    'мая': '05', 'июня': '06', 'июля': '07', 'августа': '08',
    'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12',
  };

  let amendmentDate: string | null = null;

  // Try "от DD.MM.YYYY"
  const dotDate = text.match(/от\s+(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dotDate) {
    amendmentDate = `${dotDate[3]}-${dotDate[2].padStart(2, '0')}-${dotDate[1].padStart(2, '0')}`;
  } else {
    // Try "от DD месяца YYYY"
    const textDate = text.match(/от\s+(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(\d{4})/i);
    if (textDate) {
      const monthNum = months[textDate[2].toLowerCase()] || '01';
      amendmentDate = `${textDate[3]}-${monthNum}-${textDate[1].padStart(2, '0')}`;
    }
  }

  // Extract affected articles: "ст. 1, 5, 12" or "статья 45"
  const affected: string[] = [];
  const artMatch = text.match(/(?:ст(?:атьи|атью|атья|\.)\s*)([\d,\s\-и]+)/gi);
  if (artMatch) {
    for (const am of artMatch) {
      const nums = am.match(/\d+/g);
      if (nums) affected.push(...nums.map(n => `ст. ${n}`));
    }
  }

  // Build title — the law name
  let title = text;
  // Truncate at 300 chars
  if (title.length > 300) title = title.substring(0, 297) + '...';

  return {
    amendment_law_title: title,
    amendment_law_number: lawNumber,
    amendment_date: amendmentDate,
    effective_date: null, // Could be parsed further if format found
    affected_articles: affected,
    raw_text: text,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const importSecret = Deno.env.get('IMPORT_SECRET');

    // Auth: either service role or IMPORT_SECRET header
    const providedSecret = req.headers.get('x-import-secret');
    if (providedSecret !== importSecret && !authHeader?.includes(serviceKey)) {
      // Check if user is admin
      const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader || '' } },
      });
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const supabaseAdmin = createClient(supabaseUrl, serviceKey);
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (!roleData) {
        return new Response(JSON.stringify({ error: 'Admin only' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const body = await req.json().catch(() => ({}));
    const documentId = body.document_id; // optional: process single document

    const supabase = createClient(supabaseUrl, serviceKey);

    // Get documents to process
    let query = supabase.from('documents').select('id, title, source_url, raw_html');
    if (documentId) {
      query = query.eq('id', documentId);
    } else {
      // Process all documents that have source_url
      query = query.not('source_url', 'is', null).limit(50);
    }

    const { data: docs, error: docsErr } = await query;
    if (docsErr) throw docsErr;
    if (!docs || docs.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No documents to process', processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let totalAmendments = 0;
    let processedDocs = 0;
    const results: { document_id: string; title: string; amendments_found: number; error?: string }[] = [];

    for (const doc of docs) {
      try {
        let html = doc.raw_html || '';

        // If no raw_html, fetch from source
        if (!html && doc.source_url) {
          console.log(`Fetching: ${doc.source_url}`);
          const resp = await fetch(doc.source_url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept-Language': 'ru-RU,ru;q=0.9',
              'Accept': 'text/html,application/xhtml+xml',
            },
          });
          if (resp.ok) {
            html = await resp.text();
            // Save raw_html for future use
            await supabase.from('documents').update({ raw_html: html.substring(0, 500000) }).eq('id', doc.id);
          } else {
            results.push({ document_id: doc.id, title: doc.title, amendments_found: 0, error: `HTTP ${resp.status}` });
            continue;
          }
        }

        if (!html) {
          results.push({ document_id: doc.id, title: doc.title, amendments_found: 0, error: 'No HTML' });
          continue;
        }

        const amendments = parseChangeAddSection(html);

        if (amendments.length === 0) {
          results.push({ document_id: doc.id, title: doc.title, amendments_found: 0 });
          continue;
        }

        // Delete existing amendments for this document
        await supabase.from('document_amendments').delete().eq('document_id', doc.id);

        // Insert new amendments
        const rows = amendments.map(a => ({
          document_id: doc.id,
          amendment_law_title: a.amendment_law_title,
          amendment_law_number: a.amendment_law_number,
          amendment_date: a.amendment_date,
          effective_date: a.effective_date,
          affected_articles: a.affected_articles,
          raw_text: a.raw_text,
        }));

        const { error: insertErr } = await supabase.from('document_amendments').insert(rows);
        if (insertErr) {
          results.push({ document_id: doc.id, title: doc.title, amendments_found: 0, error: insertErr.message });
          continue;
        }

        totalAmendments += amendments.length;
        processedDocs++;
        results.push({ document_id: doc.id, title: doc.title, amendments_found: amendments.length });

        console.log(`${doc.title}: ${amendments.length} amendments`);

        // Delay between documents
        if (docs.length > 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ document_id: doc.id, title: doc.title, amendments_found: 0, error: msg });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed_documents: processedDocs,
      total_amendments: totalAmendments,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
