-- ============================================================
-- 005: Add Paddle billing columns to businesses
-- ============================================================

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS paddle_customer_id     text,
  ADD COLUMN IF NOT EXISTS paddle_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_plan      text NOT NULL DEFAULT 'trial';

-- Set existing businesses to trial plan
UPDATE businesses SET subscription_plan = 'trial' WHERE subscription_plan IS NULL;
