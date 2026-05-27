-- ============================================================
-- reserve.me — Initial Schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE businesses (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                    text UNIQUE NOT NULL,
  name                    text NOT NULL,
  description             text,
  logo_url                text,
  timezone                text NOT NULL DEFAULT 'UTC',
  stripe_customer_id      text,
  stripe_subscription_id  text,
  subscription_status     text NOT NULL DEFAULT 'trial'
                            CHECK (subscription_status IN ('trial','active','past_due','canceled')),
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id          uuid PRIMARY KEY,  -- matches Supabase Auth uid
  email       text UNIQUE NOT NULL,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE business_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         text NOT NULL CHECK (role IN ('owner','staff')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_id)
);

CREATE TABLE services (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name             text NOT NULL,
  description      text,
  duration_minutes int NOT NULL,
  price_cents      int NOT NULL,
  currency         text NOT NULL DEFAULT 'USD',
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE staff_profiles (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id             uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id                 uuid REFERENCES users(id),
  display_name            text NOT NULL,
  bio                     text,
  avatar_url              text,
  google_calendar_token   jsonb,  -- encrypted OAuth tokens
  google_calendar_id      text,
  ical_feed_url           text    -- unique secret token UUID embedded in URL
);

CREATE TABLE availability (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id     uuid NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  day_of_week  int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   time NOT NULL,
  end_time     time NOT NULL
);

CREATE TABLE availability_overrides (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id        uuid NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  date            date NOT NULL,
  is_unavailable  boolean NOT NULL DEFAULT true,
  start_time      time,   -- NULL + is_unavailable = full day off
  end_time        time,
  reason          text
);

CREATE TABLE appointments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  service_id      uuid NOT NULL REFERENCES services(id),
  staff_id        uuid NOT NULL REFERENCES staff_profiles(id),
  client_id       uuid REFERENCES users(id),
  client_name     text NOT NULL,
  client_email    text NOT NULL,
  client_phone    text,
  start_time      timestamptz NOT NULL,
  end_time        timestamptz NOT NULL,
  status          text NOT NULL DEFAULT 'confirmed'
                    CHECK (status IN ('confirmed','cancelled','completed','no_show')),
  notes           text,
  google_event_id text,
  ical_uid        text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE clients (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES users(id),
  email        text NOT NULL,
  full_name    text NOT NULL,
  phone        text,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, email)
);

CREATE TABLE subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id             uuid NOT NULL REFERENCES businesses(id),
  stripe_subscription_id  text UNIQUE NOT NULL,
  plan                    text NOT NULL CHECK (plan IN ('starter','pro','enterprise')),
  status                  text NOT NULL,
  current_period_end      timestamptz NOT NULL,
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_business_members_business ON business_members(business_id);
CREATE INDEX idx_business_members_user ON business_members(user_id);
CREATE INDEX idx_services_business ON services(business_id);
CREATE INDEX idx_staff_profiles_business ON staff_profiles(business_id);
CREATE INDEX idx_availability_staff ON availability(staff_id);
CREATE INDEX idx_appointments_business ON appointments(business_id);
CREATE INDEX idx_appointments_staff ON appointments(staff_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_clients_business ON clients(business_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper: get all business_ids the current user belongs to
CREATE OR REPLACE FUNCTION get_my_business_ids()
RETURNS uuid[] LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT ARRAY(
    SELECT business_id FROM business_members WHERE user_id = auth.uid()
  )
$$;

-- Helper: check if current user is owner of a business
CREATE OR REPLACE FUNCTION is_business_owner(p_business_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM business_members
    WHERE user_id = auth.uid()
      AND business_id = p_business_id
      AND role = 'owner'
  )
$$;

-- businesses: members can read their own business
CREATE POLICY "members can read own business"
  ON businesses FOR SELECT
  USING (id = ANY(get_my_business_ids()));

CREATE POLICY "owners can update own business"
  ON businesses FOR UPDATE
  USING (is_business_owner(id));

-- users: users can read/update their own profile
CREATE POLICY "users can read own profile"
  ON users FOR SELECT USING (id = auth.uid());

CREATE POLICY "users can update own profile"
  ON users FOR UPDATE USING (id = auth.uid());

CREATE POLICY "users can insert own profile"
  ON users FOR INSERT WITH CHECK (id = auth.uid());

-- business_members: members can read their business's members
CREATE POLICY "members can read business members"
  ON business_members FOR SELECT
  USING (business_id = ANY(get_my_business_ids()));

CREATE POLICY "owners can manage members"
  ON business_members FOR ALL
  USING (is_business_owner(business_id));

-- services: anyone can read active services (for booking page)
CREATE POLICY "public can read active services"
  ON services FOR SELECT
  USING (is_active = true);

CREATE POLICY "members can read all business services"
  ON services FOR SELECT
  USING (business_id = ANY(get_my_business_ids()));

CREATE POLICY "owners can manage services"
  ON services FOR ALL
  USING (is_business_owner(business_id));

-- staff_profiles: public can read (needed for booking page)
CREATE POLICY "public can read staff profiles"
  ON staff_profiles FOR SELECT USING (true);

CREATE POLICY "owners can manage staff profiles"
  ON staff_profiles FOR ALL
  USING (is_business_owner(business_id));

CREATE POLICY "staff can update own profile"
  ON staff_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- availability: public can read (needed to show available slots)
CREATE POLICY "public can read availability"
  ON availability FOR SELECT USING (true);

CREATE POLICY "owners can manage availability"
  ON availability FOR ALL
  USING (
    is_business_owner(
      (SELECT business_id FROM staff_profiles WHERE id = staff_id)
    )
  );

CREATE POLICY "staff can manage own availability"
  ON availability FOR ALL
  USING (
    (SELECT user_id FROM staff_profiles WHERE id = staff_id) = auth.uid()
  );

-- availability_overrides: same pattern
CREATE POLICY "public can read availability overrides"
  ON availability_overrides FOR SELECT USING (true);

CREATE POLICY "owners can manage overrides"
  ON availability_overrides FOR ALL
  USING (
    is_business_owner(
      (SELECT business_id FROM staff_profiles WHERE id = staff_id)
    )
  );

-- appointments: business members can read; anyone can insert (guest booking)
CREATE POLICY "members can read business appointments"
  ON appointments FOR SELECT
  USING (business_id = ANY(get_my_business_ids()));

CREATE POLICY "anyone can create appointments"
  ON appointments FOR INSERT WITH CHECK (true);

CREATE POLICY "owners can manage appointments"
  ON appointments FOR UPDATE
  USING (is_business_owner(business_id));

-- clients: business members only
CREATE POLICY "members can read clients"
  ON clients FOR SELECT
  USING (business_id = ANY(get_my_business_ids()));

CREATE POLICY "anyone can insert clients"
  ON clients FOR INSERT WITH CHECK (true);

CREATE POLICY "owners can manage clients"
  ON clients FOR ALL
  USING (is_business_owner(business_id));

-- subscriptions: owners only
CREATE POLICY "owners can read subscriptions"
  ON subscriptions FOR SELECT
  USING (is_business_owner(business_id));

-- ============================================================
-- TRIGGER: auto-create users row on auth.users insert
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();
