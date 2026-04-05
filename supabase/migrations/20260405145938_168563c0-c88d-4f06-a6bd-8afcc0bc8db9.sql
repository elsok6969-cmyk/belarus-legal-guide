
-- Create import_logs table
CREATE TABLE IF NOT EXISTS public.import_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text,
  limit_count integer,
  status text DEFAULT 'running',
  imported integer DEFAULT 0,
  updated integer DEFAULT 0,
  errors integer DEFAULT 0,
  duration_ms integer,
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages import logs"
  ON public.import_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Add content_hash column to documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS content_hash text;
