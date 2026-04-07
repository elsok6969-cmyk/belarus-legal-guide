
-- 1. Add rate limiting to calendar_subscriptions: max 5 per email
CREATE OR REPLACE FUNCTION public.validate_calendar_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (SELECT count(*) FROM public.calendar_subscriptions WHERE email = NEW.email) >= 5 THEN
    RAISE EXCEPTION 'Too many subscriptions for this email';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_calendar_subscription
  BEFORE INSERT ON public.calendar_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.validate_calendar_subscription();

-- 2. Add admin read policy for subscription_requests
CREATE POLICY "Admin can read subscription_requests"
  ON public.subscription_requests
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Add admin read policy for import_logs
CREATE POLICY "Admin can read import_logs"
  ON public.import_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
