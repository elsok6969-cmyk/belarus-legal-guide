
-- content_views: page view tracking
CREATE TABLE public.content_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text NOT NULL,
  page_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_content_views_session ON public.content_views(session_id);
CREATE INDEX idx_content_views_page ON public.content_views(page_url);
CREATE INDEX idx_content_views_created ON public.content_views(created_at);
ALTER TABLE public.content_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert content views" ON public.content_views FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can read content views" ON public.content_views FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- paywall_events: funnel analytics
CREATE TABLE public.paywall_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text NOT NULL,
  event_type text NOT NULL,
  page_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_paywall_events_type ON public.paywall_events(event_type);
CREATE INDEX idx_paywall_events_page ON public.paywall_events(page_url);
CREATE INDEX idx_paywall_events_created ON public.paywall_events(created_at);
ALTER TABLE public.paywall_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert paywall events" ON public.paywall_events FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can read paywall events" ON public.paywall_events FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Validate event_type
CREATE OR REPLACE FUNCTION public.validate_paywall_event_type()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.event_type NOT IN ('impression', 'click_register', 'click_subscribe', 'click_login') THEN
    RAISE EXCEPTION 'Invalid paywall event_type: %', NEW.event_type;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_paywall_event_type_trigger BEFORE INSERT OR UPDATE ON public.paywall_events FOR EACH ROW EXECUTE FUNCTION public.validate_paywall_event_type();

-- email_subscribers
CREATE TABLE public.email_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text NOT NULL DEFAULT 'unknown',
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);
CREATE INDEX idx_email_subscribers_email ON public.email_subscribers(email);
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert email subscriber" ON public.email_subscribers FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can read email subscribers" ON public.email_subscribers FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
