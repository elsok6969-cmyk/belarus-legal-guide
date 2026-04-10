import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CODEXES = [
  { title: "Гражданский кодекс Республики Беларусь", short_title: "ГК РБ", doc_number: "218-З", doc_date: "1998-12-07", url: "https://pravo.by/document/?guid=3871&p0=HK9800218&p2=2" },
  { title: "Налоговый кодекс Республики Беларусь (Общая часть)", short_title: "НК РБ (Общая)", doc_number: "166-З", doc_date: "2002-12-19", url: "https://pravo.by/document/?guid=3871&p0=HK0200166&p2=2" },
  { title: "Налоговый кодекс Республики Беларусь (Особенная часть)", short_title: "НК РБ (Особенная)", doc_number: "71-З", doc_date: "2009-12-29", url: "https://pravo.by/document/?guid=3871&p0=HK0900071&p2=2" },
  { title: "Трудовой кодекс Республики Беларусь", short_title: "ТК РБ", doc_number: "296-З", doc_date: "1999-07-26", url: "https://pravo.by/document/?guid=3871&p0=HK9900296&p2=2" },
  { title: "Кодекс Республики Беларусь об административных правонарушениях", short_title: "КоАП РБ", doc_number: "91-З", doc_date: "2021-01-06", url: "https://pravo.by/document/?guid=3871&p0=HK2100091&p2=2" },
  { title: "Уголовный кодекс Республики Беларусь", short_title: "УК РБ", doc_number: "275-З", doc_date: "1999-07-09", url: "https://pravo.by/document/?guid=3871&p0=HK9900275&p2=2" },
  { title: "Банковский кодекс Республики Беларусь", short_title: "БанК РБ", doc_number: "441-З", doc_date: "2000-10-25", url: "https://pravo.by/document/?guid=3871&p0=HK0000441&p2=2" },
  { title: "Жилищный кодекс Республики Беларусь", short_title: "ЖК РБ", doc_number: "428-З", doc_date: "2012-12-28", url: "https://pravo.by/document/?guid=3871&p0=HK1200428&p2=2" },
  { title: "Кодекс Республики Беларусь о земле", short_title: "КоЗ РБ", doc_number: "425-З", doc_date: "2008-07-23", url: "https://pravo.by/document/?guid=3871&p0=HK0800425&p2=2" },
  { title: "Кодекс Республики Беларусь о браке и семье", short_title: "КоБС РБ", doc_number: "278-З", doc_date: "1999-07-09", url: "https://pravo.by/document/?guid=3871&p0=HK9900278&p2=2" },
  { title: "Кодекс Республики Беларусь об образовании", short_title: "КоО РБ", doc_number: "243-З", doc_date: "2011-01-13", url: "https://pravo.by/document/?guid=3871&p0=HK1100243&p2=2" },
  { title: "Бюджетный кодекс Республики Беларусь", short_title: "БюдК РБ", doc_number: "412-З", doc_date: "2008-07-16", url: "https://pravo.by/document/?guid=3871&p0=HK0800412&p2=2" },
  { title: "О таможенном регулировании в Республике Беларусь", short_title: "ТамРег РБ", doc_number: "129-З", doc_date: "2014-01-10", url: "https://pravo.by/document/?guid=3871&p0=H11400129&p2=2" },
  { title: "Уголовно-процессуальный кодекс Республики Беларусь", short_title: "УПК РБ", doc_number: "295-З", doc_date: "1999-07-16", url: "https://pravo.by/document/?guid=3871&p0=HK9900295&p2=2" },
  { title: "Уголовно-исполнительный кодекс Республики Беларусь", short_title: "УИК РБ", doc_number: "365-З", doc_date: "2000-01-11", url: "https://pravo.by/document/?guid=3871&p0=HK0000365&p2=2" },
  { title: "Процессуально-исполнительный кодекс Республики Беларусь об административных правонарушениях", short_title: "ПИКоАП РБ", doc_number: "92-З", doc_date: "2021-01-06", url: "https://pravo.by/document/?guid=3871&p0=HK2100092&p2=2" },
  { title: "Кодекс Республики Беларусь о судоустройстве и статусе судей", short_title: "КоСС РБ", doc_number: "139-З", doc_date: "2006-06-29", url: "https://pravo.by/document/?guid=3871&p0=HK0600139&p2=2" },
  { title: "Избирательный кодекс Республики Беларусь", short_title: "ИзбК РБ", doc_number: "370-З", doc_date: "2000-02-11", url: "https://pravo.by/document/?guid=3871&p0=HK0000370&p2=2" },
  { title: "Лесной кодекс Республики Беларусь", short_title: "ЛесК РБ", doc_number: "332-З", doc_date: "2015-12-24", url: "https://pravo.by/document/?guid=3871&p0=Hk1500332&p2=2" },
  { title: "Водный кодекс Республики Беларусь", short_title: "ВодК РБ", doc_number: "149-З", doc_date: "2014-04-30", url: "https://pravo.by/document/?guid=3871&p0=HK1400149&p2=2" },
  { title: "Воздушный кодекс Республики Беларусь", short_title: "ВоздК РБ", doc_number: "117-З", doc_date: "2006-07-16", url: "https://pravo.by/document/?guid=3871&p0=HK0600117&p2=2" },
  { title: "Кодекс Республики Беларусь о культуре", short_title: "КоК РБ", doc_number: "413-З", doc_date: "2016-07-20", url: "https://pravo.by/document/?guid=3871&p0=HK1600413&p2=2" },
  { title: "Кодекс Республики Беларусь о недрах", short_title: "КоН РБ", doc_number: "406-З", doc_date: "2008-07-14", url: "https://pravo.by/document/?guid=3871&p0=HK0800406&p2=2" },
  { title: "Кодекс внутреннего водного транспорта Республики Беларусь", short_title: "КВВТ РБ", doc_number: "118-З", doc_date: "2002-06-24", url: "https://pravo.by/document/?guid=3871&p0=Hk0200118&p2=2" },
  { title: "Кодекс торгового мореплавания Республики Беларусь", short_title: "КТМ РБ", doc_number: "321-З", doc_date: "1999-11-15", url: "https://pravo.by/document/?guid=3871&p0=HK9900321&p2=2" },
  { title: "Кодекс Республики Беларусь об архитектурной, градостроительной и строительной деятельности", short_title: "КоАГСД РБ", doc_number: "289-З", doc_date: "2023-07-17", url: "https://pravo.by/document/?guid=3871&p0=Hk2300289&p2=2" },
];

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

function flattenSections(sections: Section[], parentId: string | null = null): Array<{
  parent_id: string | null;
  section_type: string;
  number: string | null;
  title: string | null;
  content_markdown: string | null;
  content_text: string | null;
  sort_order: number;
  level: number;
  path: string | null;
  children: Section[];
}> {
  const result: any[] = [];
  for (const sec of sections) {
    result.push({
      parent_id: parentId,
      section_type: sec.section_type,
      number: sec.number || null,
      title: sec.title || null,
      content_markdown: sec.content_markdown || null,
      content_text: sec.content_text || null,
      sort_order: sec.sort_order,
      level: sec.level,
      path: sec.path || null,
      children: sec.children || [],
    });
  }
  return result;
}

async function insertSectionsFlat(
  supabaseClient: any,
  documentId: string,
  sections: Section[],
  parentId: string | null
): Promise<number> {
  let count = 0;
  const items = flattenSections(sections, parentId);

  for (const item of items) {
    const { children, ...row } = item;
    const { data, error } = await supabaseClient
      .from('document_sections')
      .insert({ document_id: documentId, ...row })
      .select('id')
      .single();

    if (error) {
      console.error(`Section insert error: ${error.message}`);
      continue;
    }
    count++;
    if (children?.length > 0) {
      count += await insertSectionsFlat(supabaseClient, documentId, children, data.id);
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
  const supabaseClient = createClient(supabaseUrl, supabaseKey);

  let index = -1;
  let skipSections = false;
  try {
    const body = await req.json();
    if (typeof body.index === 'number') index = body.index;
    if (body.skip_sections) skipSections = true;
  } catch { /* defaults */ }

  // Ensure codex type exists
  let codexTypeId: string;
  const { data: existingType } = await supabaseClient
    .from('document_types')
    .select('id')
    .eq('slug', 'codex')
    .single();

  if (existingType) {
    codexTypeId = existingType.id;
  } else {
    const { data: newType, error: typeErr } = await supabaseClient
      .from('document_types')
      .insert({ slug: 'codex', name_ru: 'Кодекс', description: 'Кодексы Республики Беларусь', sort_order: 1 })
      .select('id')
      .single();
    if (typeErr || !newType) {
      return new Response(JSON.stringify({ success: false, error: 'Failed to create document_type' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    codexTypeId = newType.id;
  }

  // If index=-1, find next codex that needs importing
  if (index === -1) {
    const { data: existing } = await supabaseClient
      .from('documents')
      .select('short_title')
      .eq('document_type_id', codexTypeId)
      .not('content_text', 'is', null);

    const existingTitles = new Set((existing || []).map((d: any) => d.short_title));
    index = CODEXES.findIndex(c => !existingTitles.has(c.short_title));
    if (index === -1) {
      return new Response(JSON.stringify({ success: true, message: 'All codexes already imported', total: CODEXES.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  if (index < 0 || index >= CODEXES.length) {
    return new Response(JSON.stringify({ success: false, error: `Invalid index: ${index}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const codex = CODEXES[index];
  console.log(`Processing [${index + 1}/${CODEXES.length}]: ${codex.short_title}`);

  try {
    // Parse from pravo.by
    const parseResp = await fetch(`${supabaseUrl}/functions/v1/parse-pravo-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({ url: codex.url, document_type: 'codex' }),
    });

    if (!parseResp.ok) {
      const errText = await parseResp.text();
      throw new Error(`Parser HTTP ${parseResp.status}: ${errText.substring(0, 200)}`);
    }

    const parsed = await parseResp.json();
    if (!parsed.success) throw new Error(parsed.error || 'Parse failed');

    console.log(`Parsed: ${parsed.content_length} chars, ${parsed.sections_count} sections`);

    // Upsert document
    const { data: existing } = await supabaseClient
      .from('documents')
      .select('id')
      .eq('short_title', codex.short_title)
      .eq('document_type_id', codexTypeId)
      .single();

    const docData = {
      document_type_id: codexTypeId,
      title: codex.title,
      short_title: codex.short_title,
      doc_number: parsed.doc_number || codex.doc_number,
      doc_date: parsed.doc_date || codex.doc_date,
      status: parsed.status || 'active',
      source_url: codex.url,
      content_markdown: parsed.content_markdown,
      content_text: parsed.content_text,
      last_updated: new Date().toISOString(),
    };

    let documentId: string;
    let action: string;

    if (existing) {
      await supabaseClient.from('documents').update(docData).eq('id', existing.id);
      await supabaseClient.from('document_sections').delete().eq('document_id', existing.id);
      documentId = existing.id;
      action = 'updated';
    } else {
      const { data: newDoc, error: insErr } = await supabaseClient
        .from('documents')
        .insert(docData)
        .select('id')
        .single();
      if (insErr || !newDoc) throw new Error(`Insert failed: ${insErr?.message}`);
      documentId = newDoc.id;
      action = 'imported';
    }

    // Insert sections (skip if requested for speed)
    let sectionsCount = 0;
    if (!skipSections && parsed.sections?.length > 0) {
      sectionsCount = await insertSectionsFlat(supabaseClient, documentId, parsed.sections, null);
    }

    console.log(`Done: ${action} ${codex.short_title}, ${sectionsCount} sections`);

    return new Response(JSON.stringify({
      success: true,
      action,
      index,
      short_title: codex.short_title,
      document_id: documentId,
      content_length: parsed.content_length,
      sections_inserted: sectionsCount,
      next_index: index + 1 < CODEXES.length ? index + 1 : null,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error(`FAILED ${codex.short_title}: ${errMsg}`);
    return new Response(JSON.stringify({
      success: false,
      index,
      short_title: codex.short_title,
      error: errMsg,
      next_index: index + 1 < CODEXES.length ? index + 1 : null,
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
