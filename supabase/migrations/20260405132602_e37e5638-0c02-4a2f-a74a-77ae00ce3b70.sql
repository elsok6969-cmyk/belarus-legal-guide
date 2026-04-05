
-- Extend profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_requests_today integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_requests_reset_at date DEFAULT CURRENT_DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Validation trigger for profiles.plan
CREATE OR REPLACE FUNCTION public.validate_profile_plan()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.plan IS NOT NULL AND NEW.plan NOT IN ('free', 'standard', 'pro', 'business') THEN
    RAISE EXCEPTION 'Invalid plan value: %', NEW.plan;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_profile_plan_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_plan();

-- Update handle_new_user trigger to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', '')
  );
  RETURN NEW;
END;
$$;

-- Recreate the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create view_history table
CREATE TABLE IF NOT EXISTS public.view_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  viewed_at timestamptz DEFAULT now()
);

ALTER TABLE public.view_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_history_self" ON public.view_history
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS view_history_user_viewed_idx ON public.view_history (user_id, viewed_at DESC);

-- Create subscription_requests table
CREATE TABLE IF NOT EXISTS public.subscription_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  plan text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub_requests_insert_own" ON public.subscription_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sub_requests_select_own" ON public.subscription_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
