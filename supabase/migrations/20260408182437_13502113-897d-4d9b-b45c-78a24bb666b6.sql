
CREATE OR REPLACE FUNCTION public.search_all(query text, filter_type text DEFAULT NULL::text, result_limit integer DEFAULT 30)
 RETURNS TABLE(result_type text, document_id uuid, section_id uuid, document_title text, document_short_title text, section_title text, section_number text, doc_type_slug text, doc_type_name text, doc_date date, doc_number text, doc_status text, snippet text, rank real)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '8000'
AS $function$
DECLARE
  tsq tsquery;
  clean_query text;
  article_num text;
  codex_filter text;
  codex_abbrevs text[][] := ARRAY[
    ARRAY['ук', '%Уголовн%кодекс%'],
    ARRAY['тк', '%Трудов%кодекс%'],
    ARRAY['гк', '%Гражданск%кодекс%'],
    ARRAY['нк', '%Налогов%кодекс%'],
    ARRAY['коап', '%КоАП%'],
    ARRAY['жк', '%Жилищн%кодекс%'],
    ARRAY['зк', '%Земельн%кодекс%'],
    ARRAY['бк', '%Банковск%кодекс%']
  ];
  i int;
  word text;
  remaining_words text[];
  fts_ok boolean := true;
  ilike_pattern text;
BEGIN
  clean_query := trim(query);
  ilike_pattern := '%' || clean_query || '%';

  codex_filter := NULL;
  remaining_words := ARRAY[]::text[];

  FOR word IN SELECT unnest(string_to_array(lower(clean_query), ' ')) LOOP
    DECLARE found boolean := false;
    BEGIN
      FOR i IN 1..array_length(codex_abbrevs, 1) LOOP
        IF word = codex_abbrevs[i][1] THEN
          codex_filter := codex_abbrevs[i][2];
          found := true;
          EXIT;
        END IF;
      END LOOP;
      IF NOT found THEN
        remaining_words := remaining_words || word;
      END IF;
    END;
  END LOOP;

  article_num := NULL;
  IF array_to_string(remaining_words, ' ') ~ '^\d+$' THEN
    article_num := array_to_string(remaining_words, ' ');
  ELSIF clean_query ~* '(?:ст\.?|статья)\s*(\d+)' THEN
    article_num := (regexp_match(clean_query, '(?:ст\.?|статья)\s*(\d+)', 'i'))[1];
  END IF;

  BEGIN
    tsq := websearch_to_tsquery('russian', clean_query);
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      tsq := plainto_tsquery('russian', clean_query);
    EXCEPTION WHEN OTHERS THEN
      fts_ok := false;
    END;
  END;

  IF fts_ok AND (tsq IS NULL OR tsq::text = '') THEN
    fts_ok := false;
  END IF;

  IF article_num IS NOT NULL THEN
    RETURN QUERY
    SELECT
      'section'::text,
      d.id,
      ds.id,
      d.title,
      d.short_title,
      ds.title,
      ds.number,
      dt.slug,
      dt.name_ru,
      d.doc_date,
      d.doc_number,
      d.status,
      left(coalesce(ds.content_text, ''), 200),
      100.0::real
    FROM document_sections ds
    JOIN documents d ON ds.document_id = d.id
    LEFT JOIN document_types dt ON d.document_type_id = dt.id
    WHERE (
      ds.number = article_num
      OR ds.number = article_num || '.'
      OR ds.number = 'Статья ' || article_num
      OR ds.number = 'Статья ' || article_num || '.'
      OR ds.number LIKE 'Статья ' || article_num || '.%'
    )
      AND (codex_filter IS NULL OR d.title ILIKE codex_filter OR d.short_title ILIKE codex_filter)
      AND (filter_type IS NULL OR dt.slug = filter_type);
  END IF;

  IF fts_ok THEN
    BEGIN
      RETURN QUERY
      SELECT
        'document'::text,
        d.id,
        NULL::uuid,
        d.title,
        d.short_title,
        NULL::text,
        d.doc_number,
        dt.slug,
        dt.name_ru,
        d.doc_date,
        d.doc_number,
        d.status,
        ts_headline('russian', coalesce(d.content_text, d.title), tsq,
          'MaxWords=30,MinWords=10,StartSel=<mark>,StopSel=</mark>'),
        ts_rank(to_tsvector('russian', coalesce(d.title,'') || ' ' || coalesce(d.short_title,'') || ' ' || coalesce(d.content_text,'')), tsq)::real
      FROM documents d
      LEFT JOIN document_types dt ON d.document_type_id = dt.id
      WHERE to_tsvector('russian', coalesce(d.title,'') || ' ' || coalesce(d.short_title,'') || ' ' || coalesce(d.content_text,'')) @@ tsq
        AND (codex_filter IS NULL OR d.title ILIKE codex_filter OR d.short_title ILIKE codex_filter)
        AND (filter_type IS NULL OR dt.slug = filter_type)
      ORDER BY ts_rank(to_tsvector('russian', coalesce(d.title,'') || ' ' || coalesce(d.short_title,'') || ' ' || coalesce(d.content_text,'')), tsq) DESC
      LIMIT result_limit;

      RETURN QUERY
      SELECT
        'section'::text,
        d.id,
        ds.id,
        d.title,
        d.short_title,
        ds.title,
        ds.number,
        dt.slug,
        dt.name_ru,
        d.doc_date,
        d.doc_number,
        d.status,
        ts_headline('russian', coalesce(ds.content_text, ds.title, ''), tsq,
          'MaxWords=30,MinWords=10,StartSel=<mark>,StopSel=</mark>'),
        ts_rank(to_tsvector('russian', coalesce(ds.title,'') || ' ' || coalesce(ds.content_text,'')), tsq)::real
      FROM document_sections ds
      JOIN documents d ON ds.document_id = d.id
      LEFT JOIN document_types dt ON d.document_type_id = dt.id
      WHERE to_tsvector('russian', coalesce(ds.title,'') || ' ' || coalesce(ds.content_text,'')) @@ tsq
        AND (codex_filter IS NULL OR d.title ILIKE codex_filter OR d.short_title ILIKE codex_filter)
        AND (filter_type IS NULL OR dt.slug = filter_type)
        AND (article_num IS NULL OR NOT (
          ds.number = article_num
          OR ds.number = article_num || '.'
          OR ds.number = 'Статья ' || article_num
          OR ds.number = 'Статья ' || article_num || '.'
          OR ds.number LIKE 'Статья ' || article_num || '.%'
        ))
      ORDER BY ts_rank(to_tsvector('russian', coalesce(ds.title,'') || ' ' || coalesce(ds.content_text,'')), tsq) DESC
      LIMIT result_limit;

      RETURN;
    EXCEPTION WHEN OTHERS THEN
      fts_ok := false;
    END;
  END IF;

  RETURN QUERY
  SELECT
    'document'::text,
    d.id,
    NULL::uuid,
    d.title,
    d.short_title,
    NULL::text,
    d.doc_number,
    dt.slug,
    dt.name_ru,
    d.doc_date,
    d.doc_number,
    d.status,
    left(coalesce(d.content_text, ''), 200),
    0.5::real
  FROM documents d
  LEFT JOIN document_types dt ON d.document_type_id = dt.id
  WHERE (d.title ILIKE ilike_pattern OR d.short_title ILIKE ilike_pattern)
    AND (codex_filter IS NULL OR d.title ILIKE codex_filter OR d.short_title ILIKE codex_filter)
    AND (filter_type IS NULL OR dt.slug = filter_type)
  LIMIT result_limit;

  RETURN QUERY
  SELECT
    'section'::text,
    d.id,
    ds.id,
    d.title,
    d.short_title,
    ds.title,
    ds.number,
    dt.slug,
    dt.name_ru,
    d.doc_date,
    d.doc_number,
    d.status,
    left(coalesce(ds.content_text, ''), 200),
    0.3::real
  FROM document_sections ds
  JOIN documents d ON ds.document_id = d.id
  LEFT JOIN document_types dt ON d.document_type_id = dt.id
  WHERE (ds.title ILIKE ilike_pattern OR ds.content_text ILIKE ilike_pattern)
    AND (codex_filter IS NULL OR d.title ILIKE codex_filter OR d.short_title ILIKE codex_filter)
    AND (filter_type IS NULL OR dt.slug = filter_type)
  LIMIT result_limit;

  RETURN;
END;
$function$;
