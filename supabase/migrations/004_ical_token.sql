-- ============================================================
-- 004: Set default token for iCal feed URLs
-- ============================================================

-- Give existing staff without a token a fresh UUID
UPDATE staff_profiles
SET ical_feed_url = gen_random_uuid()::text
WHERE ical_feed_url IS NULL;

-- Make future inserts auto-generate a token
ALTER TABLE staff_profiles
  ALTER COLUMN ical_feed_url SET DEFAULT gen_random_uuid()::text;

-- Optional index so the token lookup is fast
CREATE INDEX IF NOT EXISTS idx_staff_profiles_ical_token
  ON staff_profiles(ical_feed_url);
