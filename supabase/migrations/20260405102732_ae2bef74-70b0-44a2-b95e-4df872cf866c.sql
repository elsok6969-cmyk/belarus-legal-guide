
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE POLICY "Service role can manage rates"
ON public.currency_rates
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage documents"
ON public.documents
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
