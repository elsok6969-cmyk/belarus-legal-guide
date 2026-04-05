
-- Make currency_rates publicly readable
DROP POLICY IF EXISTS "Rates readable by authenticated" ON public.currency_rates;
CREATE POLICY "Rates readable by everyone"
  ON public.currency_rates FOR SELECT
  TO public
  USING (true);

-- Make deadline_calendar publicly readable  
DROP POLICY IF EXISTS "Calendar readable by authenticated" ON public.deadline_calendar;
CREATE POLICY "Calendar readable by everyone"
  ON public.deadline_calendar FOR SELECT
  TO public
  USING (true);

-- Make documents publicly readable
DROP POLICY IF EXISTS "Documents readable by authenticated" ON public.documents;
CREATE POLICY "Documents readable by everyone"
  ON public.documents FOR SELECT
  TO public
  USING (true);

-- Make document_topics publicly readable
DROP POLICY IF EXISTS "Document topics readable by authenticated" ON public.document_topics;
CREATE POLICY "Document topics readable by everyone"
  ON public.document_topics FOR SELECT
  TO public
  USING (true);

-- Make document_versions publicly readable
DROP POLICY IF EXISTS "Versions readable by authenticated" ON public.document_versions;
CREATE POLICY "Versions readable by everyone"
  ON public.document_versions FOR SELECT
  TO public
  USING (true);
