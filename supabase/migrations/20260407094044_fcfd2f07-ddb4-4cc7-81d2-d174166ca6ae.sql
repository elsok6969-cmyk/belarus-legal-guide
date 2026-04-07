
-- ============================================================
-- 1. DROP OLD DOCUMENT-RELATED TABLES (order matters for FKs)
-- ============================================================

-- Tables referencing documents
DROP TABLE IF EXISTS public.document_topics CASCADE;
DROP TABLE IF EXISTS public.document_sections CASCADE;
DROP TABLE IF EXISTS public.document_versions CASCADE;
DROP TABLE IF EXISTS public.bookmarks CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.view_history CASCADE;
DROP TABLE IF EXISTS public.user_activity CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;

-- Drop old enum if exists
DROP TYPE IF EXISTS public.document_status CASCADE;

-- ============================================================
-- 2. CREATE NEW TABLES
-- ============================================================

-- document_types (справочник типов)
CREATE TABLE public.document_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_ru text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- issuing_bodies (органы принятия)
CREATE TABLE public.issuing_bodies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_ru text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- documents (основная таблица)
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type_id uuid NOT NULL REFERENCES public.document_types(id),
  issuing_body_id uuid REFERENCES public.issuing_bodies(id),
  title text NOT NULL,
  short_title text,
  doc_number text,
  doc_date date,
  effective_date date,
  expiry_date date,
  status text NOT NULL DEFAULT 'active',
  source_url text,
  raw_html text,
  content_markdown text,
  content_text text,
  metadata jsonb DEFAULT '{}',
  version integer DEFAULT 1,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Validation trigger for status instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_document_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'not_effective_yet', 'expired', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid document status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_document_status
  BEFORE INSERT OR UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.validate_document_status();

-- document_sections (структурированные разделы)
CREATE TABLE public.document_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.document_sections(id) ON DELETE CASCADE,
  section_type text NOT NULL,
  number text,
  title text,
  content_markdown text,
  content_text text,
  sort_order integer NOT NULL,
  level integer NOT NULL DEFAULT 0,
  path text,
  created_at timestamptz DEFAULT now()
);

-- Validation trigger for section_type
CREATE OR REPLACE FUNCTION public.validate_section_type()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.section_type NOT IN ('part', 'section', 'chapter', 'article', 'paragraph', 'point', 'subpoint') THEN
    RAISE EXCEPTION 'Invalid section_type: %', NEW.section_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_section_type
  BEFORE INSERT OR UPDATE ON public.document_sections
  FOR EACH ROW EXECUTE FUNCTION public.validate_section_type();

-- document_relations (связи между документами)
CREATE TABLE public.document_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id uuid NOT NULL REFERENCES public.documents(id),
  target_document_id uuid NOT NULL REFERENCES public.documents(id),
  relation_type text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(source_document_id, target_document_id, relation_type)
);

-- Validation trigger for relation_type
CREATE OR REPLACE FUNCTION public.validate_relation_type()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.relation_type NOT IN ('amends', 'amended_by', 'repeals', 'repealed_by', 'references', 'referenced_by', 'supersedes', 'superseded_by') THEN
    RAISE EXCEPTION 'Invalid relation_type: %', NEW.relation_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_relation_type
  BEFORE INSERT OR UPDATE ON public.document_relations
  FOR EACH ROW EXECUTE FUNCTION public.validate_relation_type();

-- document_versions (история редакций)
CREATE TABLE public.document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id),
  version_number integer NOT NULL,
  change_description text,
  effective_date date,
  content_markdown text,
  content_text text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX idx_documents_fts ON public.documents USING gin (to_tsvector('russian', COALESCE(content_text, '')));
CREATE INDEX idx_documents_type_status ON public.documents (document_type_id, status);
CREATE INDEX idx_documents_doc_date ON public.documents (doc_date);

CREATE INDEX idx_doc_sections_doc_order ON public.document_sections (document_id, sort_order);
CREATE INDEX idx_doc_sections_path ON public.document_sections (path);
CREATE INDEX idx_doc_sections_fts ON public.document_sections USING gin (to_tsvector('russian', COALESCE(content_text, '')));

CREATE INDEX idx_doc_relations_source ON public.document_relations (source_document_id);
CREATE INDEX idx_doc_relations_target ON public.document_relations (target_document_id);

CREATE INDEX idx_doc_versions_doc ON public.document_versions (document_id, version_number);

-- ============================================================
-- 4. RLS
-- ============================================================

ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issuing_bodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- SELECT for all (public - no auth needed for reading legal documents)
CREATE POLICY "Public read document_types" ON public.document_types FOR SELECT TO public USING (true);
CREATE POLICY "Public read issuing_bodies" ON public.issuing_bodies FOR SELECT TO public USING (true);
CREATE POLICY "Public read documents" ON public.documents FOR SELECT TO public USING (true);
CREATE POLICY "Public read document_sections" ON public.document_sections FOR SELECT TO public USING (true);
CREATE POLICY "Public read document_relations" ON public.document_relations FOR SELECT TO public USING (true);
CREATE POLICY "Public read document_versions" ON public.document_versions FOR SELECT TO public USING (true);

-- Admin write access (INSERT/UPDATE/DELETE) via has_role function
CREATE POLICY "Admin manage document_types" ON public.document_types FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage issuing_bodies" ON public.issuing_bodies FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage documents" ON public.documents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage document_sections" ON public.document_sections FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage document_relations" ON public.document_relations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage document_versions" ON public.document_versions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role full access for edge functions
CREATE POLICY "Service role manage documents" ON public.documents FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manage document_sections" ON public.document_sections FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manage document_types" ON public.document_types FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manage issuing_bodies" ON public.issuing_bodies FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manage document_relations" ON public.document_relations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manage document_versions" ON public.document_versions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 5. Re-create bookmarks and view_history with new FK
-- ============================================================

CREATE TABLE public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bookmarks" ON public.bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.view_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now()
);

ALTER TABLE public.view_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own view_history" ON public.view_history FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own activity" ON public.user_activity FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own activity" ON public.user_activity FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subscriptions" ON public.subscriptions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
