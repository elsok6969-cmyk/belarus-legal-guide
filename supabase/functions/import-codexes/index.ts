import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CODEXES = [
  { title: "Гражданский кодекс Республики Беларусь", short_title: "ГК РБ", doc_number: "218-З", doc_date: "1998-12-07", url: "https://pravo.by/document/?guid=3871&p0=HK9800218" },
  { title: "Налоговый кодекс Республики Беларусь (Общая часть)", short_title: "НК РБ (Общая)", doc_number: "166-З", doc_date: "2002-12-19", url: "https://pravo.by/document/?guid=3871&p0=HK0200166" },
  { title: "Налоговый кодекс Республики Беларусь (Особенная часть)", short_title: "НК РБ (Особенная)", doc_number: "71-З", doc_date: "2009-12-29", url: "https://pravo.by/document/?guid=3871&p0=HK0900071" },
  { title: "Трудовой кодекс Республики Беларусь", short_title: "ТК РБ", doc_number: "296-З", doc_date: "1999-07-26", url: "https://pravo.by/document/?guid=3871&p0=HK9900296" },
  { title: "Кодекс Республики Беларусь об административных правонарушениях", short_title: "КоАП РБ", doc_number: "91-З", doc_date: "2003-03-21", url: "https://pravo.by/document/?guid=3871&p0=HK0300194" },
  { title: "Уголовный кодекс Республики Беларусь", short_title: "УК РБ", doc_number: "275-З", doc_date: "1999-07-09", url: "https://pravo.by/document/?guid=3871&p0=HK9900275" },
  { title: "Банковский кодекс Республики Беларусь", short_title: "БанК РБ", doc_number: "441-З", doc_date: "2000-10-25", url: "https://pravo.by/document/?guid=3871&p0=HK0000441" },
  { title: "Жилищный кодекс Республики Беларусь", short_title: "ЖК РБ", doc_number: "428-З", doc_date: "2012-12-28", url: "https://pravo.by/document/?guid=3871&p0=HK1200428" },
  { title: "Кодекс Республики Беларусь о земле", short_title: "КоЗ РБ", doc_number: "425-З", doc_date: "2008-07-23", url: "https://pravo.by/document/?guid=3871&p0=HK0800425" },
  { title: "Кодекс Республики Беларусь о браке и семье", short_title: "КоБС РБ", doc_number: "278-З", doc_date: "1999-07-09", url: "https://pravo.by/document/?guid=3871&p0=HK9900278" },
  { title: "Кодекс Республики Беларусь об образовании", short_title: "КоО РБ", doc_number: "243-З", doc_date: "2011-01-13", url: "https://pravo.by/document/?guid=3871&p0=HK1100243" },
  { title: "Бюджетный кодекс Республики Беларусь", short_title: "БюдК РБ", doc_number: "412-З", doc_date: "2008-07-16", url: "https://pravo.by/document/?guid=3871&p0=HK0800412" },
  { title: "Таможенный кодекс Республики Беларусь", short_title: "ТамК РБ", doc_number: "129-З", doc_date: "2007-01-04", url: "https://pravo.by/document/?guid=3871&p0=HK0700129" },
  { title: "Уголовно-процессуальный кодекс Республики Беларусь", short_title: "УПК РБ", doc_number: "295-З", doc_date: "1999-07-16", url: "https://pravo.by/document/?guid=3871&p0=HK9900295" },
  { title: "Уголовно-исполнительный кодекс Республики Беларусь", short_title: "УИК РБ", doc_number: "365-З", doc_date: "2000-01-11", url: "https://pravo.by/document/?guid=3871&p0=HK0000365" },
  { title: "Процессуально-исполнительный кодекс Республики Беларусь об административных правонарушениях", short_title: "ПИКоАП РБ", doc_number: "194-З", doc_date: "2006-12-20", url: "https://pravo.by/document/?guid=3871&p0=HK0600194" },
  { title: "Кодекс Республики Беларусь о судоустройстве и статусе судей", short_title: "КоСС РБ", doc_number: "139-З", doc_date: "2006-06-29", url: "https://pravo.by/document/?guid=3871&p0=HK0600139" },
  { title: "Избирательный кодекс Республики Беларусь", short_title: "ИзбК РБ", doc_number: "370-З", doc_date: "2000-02-11", url: "https://pravo.by/document/?guid=3871&p0=HK0000370" },
  { title: "Лесной кодекс Республики Беларусь", short_title: "ЛесК РБ", doc_number: "420-З", doc_date: "2015-12-24", url: "https://pravo.by/document/?guid=3871&p0=HK1500420" },
  { title: "Водный кодекс Республики Беларусь", short_title: "ВодК РБ", doc_number: "149-З", doc_date: "2014-04-30", url: "https://pravo.by/document/?guid=3871&p0=HK1400149" },
  { title: "Воздушный кодекс Республики Беларусь", short_title: "ВоздК РБ", doc_number: "117-З", doc_date: "2006-07-16", url: "https://pravo.by/document/?guid=3871&p0=HK0600117" },
  { title: "Кодекс Республики Беларусь о культуре", short_title: "КоК РБ", doc_number: "413-З", doc_date: "2016-07-20", url: "https://pravo.by/document/?guid=3871&p0=HK1600413" },
  { title: "Кодекс Республики Беларусь о недрах", short_title: "КоН РБ", doc_number: "103-З", doc_date: "2008-05-14", url: "https://pravo.by/document/?guid=3871&p0=HK0800103" },
  { title: "Кодекс внутреннего водного транспорта Республики Беларусь", short_title: "КВВТ РБ", doc_number: "321-З", doc_date: "2002-06-24", url: "https://pravo.by/document/?guid=3871&p0=HK0200321" },
  { title: "Кодекс торгового мореплавания Республики Беларусь", short_title: "КТМ РБ", doc_number: "321-З", doc_date: "1999-11-15", url: "https://pravo.by/document/?guid=3871&p0=HK9900321" },
  { title: "Кодекс Республики Беларусь об архитектурной, градостроительной и строительной деятельности", short_title: "КоАГСД РБ", doc_number: "300-З", doc_date: "2004-07-05", url: "https://pravo.by/document/?guid=3871&p0=HK0400300" },
];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

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

async function insertSectionsRecursive(
  supabase: ReturnType<typeof createClient>,
  documentId: string,
  sections: Section[],
  parentId: string | null
): Promise<number> {
  let count = 0;
  for (const sec of sections) {
    const { data, error } = await supabase
      .from('document_sections')
      .insert({
        document_id: documentId,
        parent_id: parentId,
        section_type: sec.section_type,
        number: sec.number || null,
        title: sec.title || null,
        content_markdown: sec.content_markdown || null,
        content_text: sec.content_text || null,
        sort_order: sec.sort_order,
        level: sec.level,
        path: sec.path || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`Section insert error (${sec.number}):`, error.message);
      continue;
    }
    count++;
    if (sec.children?.length > 0) {
      count += await insertSectionsRecursive(supabase, documentId, sec.children, data.id);
    }
  }
  return count;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Parse batch parameter
  let batch = 0; // 0 = all
  try {
    const body = await req.json();
    if (body.batch) batch = Number(body.batch);
  } catch { /* defaults */ }

  // Determine slice
  let codexes = CODEXES;
  if (batch === 1) codexes = CODEXES.slice(0, 9);
  else if (batch === 2) codexes = CODEXES.slice(9, 18);
  else if (batch === 3) codexes = CODEXES.slice(18);

  // Ensure document_type "codex" exists
  let codexTypeId: string;
  const { data: existingType } = await supabase
    .from('document_types')
    .select('id')
    .eq('slug', 'codex')
    .single();

  if (existingType) {
    codexTypeId = existingType.id;
  } else {
    const { data: newType, error: typeErr } = await supabase
      .from('document_types')
      .insert({ slug: 'codex', name_ru: 'Кодекс', description: 'Кодексы Республики Беларусь', sort_order: 1 })
      .select('id')
      .single();
    if (typeErr || !newType) {
      return new Response(JSON.stringify({ success: false, error: 'Failed to create document_type: ' + typeErr?.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    codexTypeId = newType.id;
  }

  // SSE streaming
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      let imported = 0;
      let updated = 0;
      let failed = 0;
      const errors: { short_title: string; error: string }[] = [];

      for (let i = 0; i < codexes.length; i++) {
        const codex = codexes[i];
        console.log(`[${i + 1}/${codexes.length}] Processing: ${codex.short_title}`);
        send({ progress: i + 1, total: codexes.length, current: codex.short_title, status: 'parsing' });

        try {
          // Call parse-pravo-document
          const parseUrl = `${supabaseUrl}/functions/v1/parse-pravo-document`;
          const parseResp = await fetch(parseUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ url: codex.url, document_type: 'codex' }),
          });

          if (!parseResp.ok) {
            const errText = await parseResp.text();
            throw new Error(`Parser HTTP ${parseResp.status}: ${errText.substring(0, 200)}`);
          }

          const parsed = await parseResp.json();
          if (!parsed.success) {
            throw new Error(parsed.error || 'Parse failed');
          }

          console.log(`  Parsed: ${parsed.content_length} chars, ${parsed.sections_count} sections`);

          // Check for existing document
          const { data: existing } = await supabase
            .from('documents')
            .select('id')
            .eq('short_title', codex.short_title)
            .eq('document_type_id', codexTypeId)
            .single();

          let documentId: string;

          const docData = {
            document_type_id: codexTypeId,
            title: codex.title,
            short_title: codex.short_title,
            doc_number: parsed.doc_number || codex.doc_number,
            doc_date: parsed.doc_date || codex.doc_date,
            status: parsed.status || 'active',
            source_url: codex.url,
            raw_html: parsed.raw_html || null,
            content_markdown: parsed.content_markdown,
            content_text: parsed.content_text,
            last_updated: new Date().toISOString(),
          };

          if (existing) {
            // Update existing
            const { error: updErr } = await supabase
              .from('documents')
              .update(docData)
              .eq('id', existing.id);
            if (updErr) throw new Error(`Update failed: ${updErr.message}`);
            documentId = existing.id;

            // Delete old sections before re-inserting
            await supabase
              .from('document_sections')
              .delete()
              .eq('document_id', documentId);

            updated++;
            console.log(`  Updated existing document: ${documentId}`);
          } else {
            // Insert new
            const { data: newDoc, error: insErr } = await supabase
              .from('documents')
              .insert(docData)
              .select('id')
              .single();
            if (insErr || !newDoc) throw new Error(`Insert failed: ${insErr?.message}`);
            documentId = newDoc.id;
            imported++;
            console.log(`  Inserted new document: ${documentId}`);
          }

          // Insert sections recursively
          if (parsed.sections?.length > 0) {
            const secCount = await insertSectionsRecursive(supabase, documentId, parsed.sections, null);
            console.log(`  Inserted ${secCount} sections`);
          }

          send({ progress: i + 1, total: codexes.length, current: codex.short_title, status: 'success', sections: parsed.sections_count });

        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          console.error(`  FAILED: ${errMsg}`);
          errors.push({ short_title: codex.short_title, error: errMsg });
          failed++;
          send({ progress: i + 1, total: codexes.length, current: codex.short_title, status: 'error', error: errMsg });
        }

        // Delay between requests
        if (i < codexes.length - 1) {
          await sleep(2000);
        }
      }

      send({ done: true, imported, updated, failed, errors });
      console.log(`Import complete: ${imported} imported, ${updated} updated, ${failed} failed`);
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
});
