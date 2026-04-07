
-- Make user_id NOT NULL on subscription_requests to prevent orphaned PII
ALTER TABLE public.subscription_requests ALTER COLUMN user_id SET NOT NULL;
