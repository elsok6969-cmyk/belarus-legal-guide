
-- 1. user_profiles
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  profession text,
  company_name text,
  subscription_plan text NOT NULL DEFAULT 'free',
  subscription_expires_at timestamptz,
  settings jsonb NOT NULL DEFAULT '{"theme": "light", "notifications": true, "email_digest": "weekly"}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_user_profile_profession()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.profession IS NOT NULL AND NEW.profession NOT IN (
    'accountant','lawyer','hr_specialist','procurement_specialist','labor_safety',
    'economist','financier','secretary','ecologist','builder','individual','entrepreneur','manager'
  ) THEN RAISE EXCEPTION 'Invalid profession: %', NEW.profession; END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_validate_user_profile_profession
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_profile_profession();

CREATE OR REPLACE FUNCTION public.validate_user_profile_plan()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.subscription_plan NOT IN ('free','basic','professional','enterprise') THEN
    RAISE EXCEPTION 'Invalid subscription_plan: %', NEW.subscription_plan;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_validate_user_profile_plan
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_profile_plan();

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own user_profile" ON public.user_profiles FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. user_favorites
CREATE TABLE public.user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  on_watch boolean NOT NULL DEFAULT false,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, document_id)
);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorites" ON public.user_favorites FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. user_document_history
CREATE TABLE public.user_document_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_doc_history_user_viewed ON public.user_document_history (user_id, viewed_at DESC);

ALTER TABLE public.user_document_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own history" ON public.user_document_history FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. user_notifications
CREATE TABLE public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_notification_type()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.type NOT IN ('document_changed','new_document','deadline_reminder','system') THEN
    RAISE EXCEPTION 'Invalid notification type: %', NEW.type;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_validate_notification_type
  BEFORE INSERT OR UPDATE ON public.user_notifications
  FOR EACH ROW EXECUTE FUNCTION public.validate_notification_type();

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.user_notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.user_notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Service role manage notifications" ON public.user_notifications FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 5. deadlines
CREATE TABLE public.deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  deadline_date date NOT NULL,
  deadline_type text NOT NULL,
  profession_tags text[],
  recurring boolean NOT NULL DEFAULT false,
  recurrence_rule text,
  document_id uuid REFERENCES public.documents(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_deadline_type()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.deadline_type NOT IN ('tax','reporting','general') THEN
    RAISE EXCEPTION 'Invalid deadline_type: %', NEW.deadline_type;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_validate_deadline_type
  BEFORE INSERT OR UPDATE ON public.deadlines
  FOR EACH ROW EXECUTE FUNCTION public.validate_deadline_type();

ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read deadlines" ON public.deadlines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage deadlines" ON public.deadlines FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manage deadlines" ON public.deadlines FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 6. economic_indicators
CREATE TABLE public.economic_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_ru text NOT NULL,
  current_value text NOT NULL,
  value_type text,
  effective_date date,
  source_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.economic_indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read indicators" ON public.economic_indicators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage indicators" ON public.economic_indicators FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manage indicators" ON public.economic_indicators FOR ALL TO service_role
  USING (true) WITH CHECK (true);
