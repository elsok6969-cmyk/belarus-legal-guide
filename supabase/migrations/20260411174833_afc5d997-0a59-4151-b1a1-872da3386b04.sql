CREATE TABLE public.document_amendments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  amendment_law_title text NOT NULL,
  amendment_law_number text,
  amendment_date date,
  effective_date date,
  affected_articles text[],
  raw_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_amendments_document_id ON public.document_amendments(document_id);

ALTER TABLE public.document_amendments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read document_amendments"
  ON public.document_amendments FOR SELECT
  USING (true);

CREATE POLICY "Service role manage document_amendments"
  ON public.document_amendments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin manage document_amendments"
  ON public.document_amendments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));