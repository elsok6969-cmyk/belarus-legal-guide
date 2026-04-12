
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS unp text;

ALTER TABLE public.subscription_requests ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE public.subscription_requests ADD COLUMN IF NOT EXISTS unp text;

CREATE OR REPLACE FUNCTION public.validate_user_profile_profession()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.profession IS NOT NULL AND NEW.profession NOT IN (
    'accountant','lawyer','hr_specialist','procurement_specialist','labor_safety',
    'economist','financier','secretary','ecologist','builder','individual','entrepreneur','manager','other'
  ) THEN RAISE EXCEPTION 'Invalid profession: %', NEW.profession; END IF;
  RETURN NEW;
END; $function$;
