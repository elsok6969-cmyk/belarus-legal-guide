
CREATE OR REPLACE FUNCTION public.search_documents(
  search_query text DEFAULT '',
  filter_type text DEFAULT NULL,
  filter_status text DEFAULT NULL,
  filter_date_from date DEFAULT NULL,
  filter_date_to date DEFAULT NULL,
  filter_body text DEFAULT NULL,
  exact_match boolean DEFAULT false,
  title_only boolean DEFAULT false,
  result_limit integer DEFAULT 50,
  result_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  short_title text,
  doc_number text,
  doc_date date,
  status text,
  document_type_name text,
  document_type_slug text,
  issuing_body_name text,
  snippet text,
  rank real,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tsq tsquery;
  has_query boolean;
BEGIN
  has_query := (search_query IS NOT NULL AND trim(search_query) <> '');

  IF has_query THEN
    IF exact_match THEN
      tsq := phraseto_tsquery('russian', search_query);
    ELSE
      tsq := websearch_to_tsquery('russian', search_query);
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.short_title,
    d.doc_number,
    d.doc_date,
    d.status,
    dt.name_ru AS document_type_name,
    dt.slug AS document_type_slug,
    ib.name_ru AS issuing_body_name,
    CASE
      WHEN has_query AND NOT title_only AND d.content_text IS NOT NULL THEN
        ts_headline('russian', d.content_text, tsq,
          'MaxWords=50, MinWords=20, StartSel=<mark>, StopSel=</mark>')
      WHEN has_query AND title_only THEN
        ts_headline('russian', d.title || ' ' || coalesce(d.short_title, ''), tsq,
          'MaxWords=50, MinWords=20, StartSel=<mark>, StopSel=</mark>')
      ELSE NULL
    END AS snippet,
    CASE
      WHEN has_query AND NOT title_only THEN
        ts_rank_cd(to_tsvector('russian', coalesce(d.content_text, '')), tsq)
      WHEN has_query AND title_only THEN
        ts_rank_cd(to_tsvector('russian', d.title || ' ' || coalesce(d.short_title, '')), tsq)
      ELSE 0
    END::real AS rank,
    count(*) OVER()::bigint AS total_count
  FROM documents d
  JOIN document_types dt ON dt.id = d.document_type_id
  LEFT JOIN issuing_bodies ib ON ib.id = d.issuing_body_id
  WHERE
    (NOT has_query OR (
      CASE
        WHEN title_only THEN
          to_tsvector('russian', d.title || ' ' || coalesce(d.short_title, '')) @@ tsq
        ELSE
          to_tsvector('russian', coalesce(d.content_text, '')) @@ tsq
      END
    ))
    AND (filter_type IS NULL OR dt.slug = filter_type)
    AND (filter_status IS NULL OR d.status = filter_status)
    AND (filter_date_from IS NULL OR d.doc_date >= filter_date_from)
    AND (filter_date_to IS NULL OR d.doc_date <= filter_date_to)
    AND (filter_body IS NULL OR ib.name_ru ILIKE '%' || filter_body || '%')
  ORDER BY
    CASE WHEN has_query THEN 0 ELSE 1 END,
    CASE
      WHEN has_query AND NOT title_only THEN
        ts_rank_cd(to_tsvector('russian', coalesce(d.content_text, '')), tsq)
      WHEN has_query AND title_only THEN
        ts_rank_cd(to_tsvector('russian', d.title || ' ' || coalesce(d.short_title, '')), tsq)
      ELSE 0
    END DESC,
    d.doc_date DESC NULLS LAST
  LIMIT result_limit
  OFFSET result_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_within_document(
  p_document_id uuid,
  search_query text
)
RETURNS TABLE (
  section_id uuid,
  section_type text,
  number text,
  title text,
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
BEGIN
  tsq := websearch_to_tsquery('russian', search_query);

  RETURN QUERY
  SELECT
    ds.id AS section_id,
    ds.section_type,
    ds.number,
    ds.title,
    ts_headline('russian', coalesce(ds.content_text, ''), tsq,
      'MaxWords=50, MinWords=20, StartSel=<mark>, StopSel=</mark>') AS snippet,
    ts_rank_cd(to_tsvector('russian', coalesce(ds.content_text, '')), tsq)::real AS rank
  FROM document_sections ds
  WHERE ds.document_id = p_document_id
    AND to_tsvector('russian', coalesce(ds.content_text, '')) @@ tsq
  ORDER BY rank DESC, ds.sort_order;
END;
$$;
