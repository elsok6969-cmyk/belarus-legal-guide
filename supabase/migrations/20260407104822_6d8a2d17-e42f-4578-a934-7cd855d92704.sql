CREATE TABLE public.guide_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.guide_categories(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name_ru text NOT NULL,
  profession text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guide_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read guide_categories"
  ON public.guide_categories FOR SELECT TO public USING (true);

CREATE TABLE public.guide_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.guide_categories(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  title_override text,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guide_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read guide_items"
  ON public.guide_items FOR SELECT TO public USING (true);

CREATE INDEX idx_guide_categories_parent ON public.guide_categories(parent_id);
CREATE INDEX idx_guide_categories_profession ON public.guide_categories(profession);
CREATE INDEX idx_guide_items_category ON public.guide_items(category_id);