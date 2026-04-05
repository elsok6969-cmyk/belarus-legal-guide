
-- =============================================
-- 1. Enum types
-- =============================================
CREATE TYPE public.app_role AS ENUM ('user', 'admin');
CREATE TYPE public.document_status AS ENUM ('active', 'amended', 'repealed');
CREATE TYPE public.change_type AS ENUM ('amended', 'new_version', 'repealed');
CREATE TYPE public.audience_type AS ENUM ('accountant', 'lawyer', 'general');

-- =============================================
-- 2. user_roles (security)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- =============================================
-- 3. topics
-- =============================================
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  document_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Topics are readable by everyone" ON public.topics FOR SELECT USING (true);

-- =============================================
-- 4. experts
-- =============================================
CREATE TABLE public.experts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty TEXT,
  bio TEXT,
  avatar_url TEXT,
  article_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Experts are readable by everyone" ON public.experts FOR SELECT USING (true);

-- =============================================
-- 5. documents
-- =============================================
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'law',
  doc_number TEXT,
  body_text TEXT,
  date_adopted DATE,
  date_effective DATE,
  status document_status NOT NULL DEFAULT 'active',
  source_url TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Documents readable by authenticated" ON public.documents
  FOR SELECT TO authenticated USING (true);

CREATE TRIGGER documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 6. document_sections
-- =============================================
CREATE TABLE public.document_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  heading TEXT,
  level INT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.document_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sections readable by authenticated" ON public.document_sections
  FOR SELECT TO authenticated USING (true);

-- =============================================
-- 7. document_versions
-- =============================================
CREATE TABLE public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  version_number INT NOT NULL DEFAULT 1,
  change_type change_type NOT NULL,
  summary TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Versions readable by authenticated" ON public.document_versions
  FOR SELECT TO authenticated USING (true);

-- =============================================
-- 8. document_topics (M2M)
-- =============================================
CREATE TABLE public.document_topics (
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (document_id, topic_id)
);
ALTER TABLE public.document_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Document topics readable by authenticated" ON public.document_topics
  FOR SELECT TO authenticated USING (true);

-- =============================================
-- 9. articles (news/analytics)
-- =============================================
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  body TEXT,
  expert_id UUID REFERENCES public.experts(id) ON DELETE SET NULL,
  audience audience_type NOT NULL DEFAULT 'general',
  views INT NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published articles readable by everyone" ON public.articles
  FOR SELECT USING (published_at IS NOT NULL);

CREATE TRIGGER articles_updated_at BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 10. article_topics (M2M)
-- =============================================
CREATE TABLE public.article_topics (
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (article_id, topic_id)
);
ALTER TABLE public.article_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Article topics readable by everyone" ON public.article_topics
  FOR SELECT USING (true);

-- =============================================
-- 11. bookmarks
-- =============================================
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, document_id)
);
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bookmarks" ON public.bookmarks
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 12. subscriptions
-- =============================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, document_id)
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subscriptions" ON public.subscriptions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 13. assistant_conversations
-- =============================================
CREATE TABLE public.assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own conversations" ON public.assistant_conversations
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 14. assistant_messages
-- =============================================
CREATE TABLE public.assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.assistant_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own messages" ON public.assistant_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assistant_conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  ));
CREATE POLICY "Users insert own messages" ON public.assistant_messages
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.assistant_conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  ));

-- =============================================
-- 15. user_settings
-- =============================================
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  audience audience_type NOT NULL DEFAULT 'general',
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  update_frequency TEXT NOT NULL DEFAULT 'weekly',
  theme TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own settings" ON public.user_settings
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER user_settings_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 16. user_activity
-- =============================================
CREATE TABLE public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own activity" ON public.user_activity
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own activity" ON public.user_activity
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 17. currency_rates (cache)
-- =============================================
CREATE TABLE public.currency_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_code TEXT NOT NULL,
  currency_name TEXT NOT NULL,
  rate NUMERIC(12,4) NOT NULL,
  rate_date DATE NOT NULL,
  change_value NUMERIC(12,4) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (currency_code, rate_date)
);
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rates readable by authenticated" ON public.currency_rates
  FOR SELECT TO authenticated USING (true);

-- =============================================
-- 18. deadline_calendar
-- =============================================
CREATE TABLE public.deadline_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  deadline_date DATE NOT NULL,
  category TEXT NOT NULL DEFAULT 'Налоги',
  description TEXT,
  audience audience_type NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deadline_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Calendar readable by authenticated" ON public.deadline_calendar
  FOR SELECT TO authenticated USING (true);
