CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE public.pending_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  source_url text,
  doc_type text,
  discovered_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  notes text
);

ALTER TABLE public.pending_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage pending_documents" ON public.pending_documents
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manage pending_documents" ON public.pending_documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.pending_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  old_date date,
  new_date date,
  source_url text,
  discovered_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  notes text
);

ALTER TABLE public.pending_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage pending_updates" ON public.pending_updates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manage pending_updates" ON public.pending_updates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  status text NOT NULL DEFAULT 'success',
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read system_logs" ON public.system_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manage system_logs" ON public.system_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.validate_pending_doc_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('pending','imported','skipped') THEN
    RAISE EXCEPTION 'Invalid pending_documents status: %', NEW.status;
  END IF;
  RETURN NEW;
END;$$;

CREATE TRIGGER trg_validate_pending_doc_status
  BEFORE INSERT OR UPDATE ON public.pending_documents
  FOR EACH ROW EXECUTE FUNCTION public.validate_pending_doc_status();

CREATE OR REPLACE FUNCTION public.validate_pending_update_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('pending','processed','skipped') THEN
    RAISE EXCEPTION 'Invalid pending_updates status: %', NEW.status;
  END IF;
  RETURN NEW;
END;$$;

CREATE TRIGGER trg_validate_pending_update_status
  BEFORE INSERT OR UPDATE ON public.pending_updates
  FOR EACH ROW EXECUTE FUNCTION public.validate_pending_update_status();