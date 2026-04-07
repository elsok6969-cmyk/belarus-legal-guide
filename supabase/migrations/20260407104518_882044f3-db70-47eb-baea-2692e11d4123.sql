-- Subscription limits per plan
CREATE TABLE public.subscription_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan text NOT NULL,
  feature text NOT NULL,
  daily_limit integer,
  monthly_limit integer,
  UNIQUE(plan, feature)
);

ALTER TABLE public.subscription_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read subscription limits"
  ON public.subscription_limits FOR SELECT
  TO public
  USING (true);

-- Usage tracking
CREATE TABLE public.usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature text NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own usage"
  ON public.usage_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own usage"
  ON public.usage_tracking FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_usage_tracking_lookup
  ON public.usage_tracking (user_id, feature, used_at);

-- check_limit function
CREATE OR REPLACE FUNCTION public.check_limit(p_user_id uuid, p_feature text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_plan text;
  v_daily_limit integer;
  v_used_today integer;
BEGIN
  -- Get user plan
  SELECT subscription_plan INTO v_plan
  FROM public.user_profiles
  WHERE id = p_user_id;

  IF v_plan IS NULL THEN v_plan := 'free'; END IF;

  -- Get limit for this feature+plan
  SELECT daily_limit INTO v_daily_limit
  FROM public.subscription_limits
  WHERE plan = v_plan AND feature = p_feature;

  -- NULL daily_limit = unlimited
  IF v_daily_limit IS NULL THEN
    RETURN jsonb_build_object('allowed', true, 'used', 0, 'limit', null, 'plan', v_plan);
  END IF;

  -- Count today's usage
  SELECT count(*) INTO v_used_today
  FROM public.usage_tracking
  WHERE user_id = p_user_id
    AND feature = p_feature
    AND used_at >= date_trunc('day', now());

  RETURN jsonb_build_object(
    'allowed', v_used_today < v_daily_limit,
    'used', v_used_today,
    'limit', v_daily_limit,
    'plan', v_plan
  );
END;
$$;

-- increment_usage function
CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id uuid, p_feature text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  INSERT INTO public.usage_tracking (user_id, feature) VALUES (p_user_id, p_feature);
$$;