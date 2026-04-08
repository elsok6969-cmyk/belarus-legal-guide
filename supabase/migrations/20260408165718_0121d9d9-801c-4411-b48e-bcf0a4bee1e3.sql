
-- GIN indexes for full-text search
CREATE INDEX IF NOT EXISTS idx_doc_sections_fts
ON document_sections
USING GIN (to_tsvector('russian', coalesce(title,'') || ' ' || coalesce(content_text,'')));

CREATE INDEX IF NOT EXISTS idx_documents_fts
ON documents
USING GIN (to_tsvector('russian', coalesce(title,'') || ' ' || coalesce(short_title,'') || ' ' || coalesce(content_text,'')));

-- Index on section number for direct lookups
CREATE INDEX IF NOT EXISTS idx_doc_sections_number ON document_sections (number) WHERE number IS NOT NULL;

-- Universal search function
CREATE OR REPLACE FUNCTION public.search_all(
  query text,
  filter_type text DEFAULT NULL,
  result_limit int DEFAULT 30
)
RETURNS TABLE (
  result_type text,
  document_id uuid,
  section_id uuid,
  document_title text,
  document_short_title text,
  section_title text,
  section_number text,
  doc_type_slug text,
  doc_type_name text,
  doc_date date,
  doc_number text,
  doc_status text,
  snippet text,
  rank real
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    ARRAY['коап', '%КоАП%']
  ];
  i int;
  word text;
  remaining_words text[];
BEGIN
  clean_query := trim(query);

  -- Extract codex abbreviation from query
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

  -- Extract article number: digits only, or after "ст"/"ст."/"статья"
  article_num := NULL;
  IF array_to_string(remaining_words, ' ') ~ '^\d+$' THEN
    article_num := array_to_string(remaining_words, ' ');
  ELSIF clean_query ~* '(?:ст\.?|статья)\s*(\d+)' THEN
    article_num := (regexp_match(clean_query, '(?:ст\.?|статья)\s*(\d+)', 'i'))[1];
  END IF;

  -- Build tsquery from full query
  BEGIN
    tsq := websearch_to_tsquery('russian', clean_query);
  EXCEPTION WHEN OTHERS THEN
    tsq := plainto_tsquery('russian', clean_query);
  END;

  RETURN QUERY

  -- Direct article number match (highest priority)
  SELECT
    'section'::text as result_type,
    d.id as document_id,
    ds.id as section_id,
    d.title as document_title,
    d.short_title as document_short_title,
    ds.title as section_title,
    ds.number as section_number,
    dt.slug as doc_type_slug,
    dt.name_ru as doc_type_name,
    d.doc_date,
    d.doc_number,
    d.status as doc_status,
    left(coalesce(ds.content_text, ''), 200) as snippet,
    100.0::real as rank
  FROM document_sections ds
  JOIN documents d ON ds.document_id = d.id
  LEFT JOIN document_types dt ON d.document_type_id = dt.id
  WHERE article_num IS NOT NULL
    AND (ds.number = article_num OR ds.number = 'Статья ' || article_num)
    AND (codex_filter IS NULL OR d.title ILIKE codex_filter OR d.short_title ILIKE codex_filter)
    AND (filter_type IS NULL OR dt.slug = filter_type)

  UNION ALL

  -- Full-text search on documents
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

  UNION ALL

  -- Full-text search on sections
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
    -- exclude sections already found by direct number match
    AND (article_num IS NULL OR NOT (ds.number = article_num OR ds.number = 'Статья ' || article_num))

  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$;
