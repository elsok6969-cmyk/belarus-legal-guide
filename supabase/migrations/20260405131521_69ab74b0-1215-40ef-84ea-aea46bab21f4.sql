
-- Add missing columns to documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS organ text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS reg_number text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS reg_date date;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT false;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- Generate slugs for existing documents from title (simple transliteration)
UPDATE public.documents SET slug = LOWER(
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  REPLACE(REPLACE(REPLACE(REPLACE(
    title,
    'а','a'),'б','b'),'в','v'),'г','g'),'д','d'),'е','e'),'ё','yo'),'ж','zh'),
    'з','z'),'и','i'),'й','j'),'к','k'),'л','l'),'м','m'),'н','n'),'о','o'),
    'п','p'),'р','r'),'с','s'),'т','t'),'у','u'),'ф','f'),'х','kh'),'ц','ts'),
    'ч','ch'),'ш','sh'),'щ','shch'),'ъ',''),'ы','y'),'ь',''),'э','e'),'ю','yu'),
    'я','ya'),' ','-')
) WHERE slug IS NULL;

-- Security definer function to increment view_count without exposing UPDATE to public
CREATE OR REPLACE FUNCTION public.increment_view_count(doc_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.documents SET view_count = COALESCE(view_count, 0) + 1 WHERE id = doc_id;
$$;
