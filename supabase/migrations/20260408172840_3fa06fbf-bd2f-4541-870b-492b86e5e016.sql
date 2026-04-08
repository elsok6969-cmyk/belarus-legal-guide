DROP POLICY IF EXISTS "Public read deadlines" ON deadlines;
CREATE POLICY "Public read deadlines" ON deadlines FOR SELECT TO public USING (true);