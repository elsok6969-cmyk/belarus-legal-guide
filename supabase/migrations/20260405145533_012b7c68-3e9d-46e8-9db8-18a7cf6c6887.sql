
-- Create tax_deadlines table
CREATE TABLE IF NOT EXISTS public.tax_deadlines (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  deadline_date date NOT NULL,
  tax_type text,
  audience text[],
  document_url text,
  is_recurring boolean DEFAULT false,
  recurrence_rule text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tax_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tax deadlines readable by everyone"
  ON public.tax_deadlines FOR SELECT TO public
  USING (true);

-- Create calendar_subscriptions table
CREATE TABLE IF NOT EXISTS public.calendar_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  tax_types text[],
  audience text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.calendar_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert calendar subscription"
  ON public.calendar_subscriptions FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Calendar subscriptions readable by service role"
  ON public.calendar_subscriptions FOR SELECT TO service_role
  USING (true);
