# reserve.me — Architecture Plan

> Multi-tenant appointment booking SaaS platform  
> Version 1.0 | May 2026

---

## 1. Product Overview

A single platform where any service business (hairdresser, nail salon, barbershop, massage therapist, etc.) can sign up, get their own branded booking page, and let their clients schedule appointments online.

**Key actors:**
- **Platform admin** — you (manages the whole platform)
- **Business owner** — subscribes, sets up their page, manages staff & services
- **Staff member** — has their own schedule and availability
- **Client / end user** — books appointments, gets confirmations

---

## 2. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SSR for SEO, API routes, great DX |
| Styling | Tailwind CSS + shadcn/ui | Fast, accessible UI components |
| Database | Supabase (PostgreSQL) | Auth, RLS, real-time, storage built in |
| ORM | Prisma or Supabase client | Type-safe DB queries |
| Auth | Supabase Auth | Supports OAuth (Google), magic link, email/password |
| Payments | Stripe + Stripe Connect | Subscriptions for businesses, optional future direct payments |
| Calendar sync | Google Calendar API + iCal (.ics) | Two-way sync and universal fallback |
| Email | Resend | Transactional emails (booking confirmations, reminders) |
| SMS (optional) | Twilio | Booking reminders via SMS |
| Hosting | Vercel | Edge network, Next.js native, zero-config deploys |
| CDN / Storage | Supabase Storage | Business logos, profile images |

---

## 3. Multi-Tenancy Architecture

Each business gets an isolated space on the platform. Isolation is enforced at the **database level** using Supabase Row Level Security (RLS).

### URL Strategy
```
reserve.me/{business-slug}           → public booking page
reserve.me/dashboard                 → business owner dashboard
reserve.me/admin                     → platform admin panel
```

Optional future: custom domains (`booking.sarahnails.com → reserve.me/sarah-nails`) via Vercel edge config.

### Tenant Isolation
- Every table has a `business_id` foreign key
- RLS policies enforce: "you can only read/write rows where `business_id` = your business"
- JWT claims carry `business_id` and `role` after login
- No business can ever see another business's data

---

## 4. Database Schema

### `businesses`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
slug            text UNIQUE NOT NULL          -- used in URL: reserve.me/{slug}
name            text NOT NULL
description     text
logo_url        text
timezone        text NOT NULL DEFAULT 'UTC'
stripe_customer_id    text
stripe_subscription_id text
subscription_status   text DEFAULT 'trial'   -- trial | active | past_due | canceled
created_at      timestamptz DEFAULT now()
```

### `users`
```sql
id              uuid PRIMARY KEY              -- matches Supabase Auth uid
email           text UNIQUE NOT NULL
full_name       text
avatar_url      text
created_at      timestamptz DEFAULT now()
```

### `business_members`  *(links users to businesses with a role)*
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
business_id     uuid REFERENCES businesses(id) ON DELETE CASCADE
user_id         uuid REFERENCES users(id) ON DELETE CASCADE
role            text NOT NULL                 -- owner | staff
created_at      timestamptz DEFAULT now()
UNIQUE(business_id, user_id)
```

### `services`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
business_id     uuid REFERENCES businesses(id) ON DELETE CASCADE
name            text NOT NULL                 -- "Haircut", "Manicure"
description     text
duration_minutes int NOT NULL                 -- 30, 60, 90
price_cents     int NOT NULL                  -- stored in cents
currency        text DEFAULT 'USD'
is_active       boolean DEFAULT true
created_at      timestamptz DEFAULT now()
```

### `staff_profiles`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
business_id     uuid REFERENCES businesses(id) ON DELETE CASCADE
user_id         uuid REFERENCES users(id)
display_name    text NOT NULL
bio             text
avatar_url      text
google_calendar_token  jsonb                  -- encrypted OAuth tokens
google_calendar_id     text
ical_feed_url          text                   -- generated unique feed URL
```

### `availability`  *(weekly recurring schedule per staff)*
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
staff_id        uuid REFERENCES staff_profiles(id) ON DELETE CASCADE
day_of_week     int NOT NULL                  -- 0=Sun ... 6=Sat
start_time      time NOT NULL                 -- e.g. 09:00
end_time        time NOT NULL                 -- e.g. 17:00
```

### `availability_overrides`  *(exceptions: holidays, days off)*
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
staff_id        uuid REFERENCES staff_profiles(id) ON DELETE CASCADE
date            date NOT NULL
is_unavailable  boolean DEFAULT true
start_time      time                          -- if NULL + is_unavailable=true = full day off
end_time        time
reason          text
```

### `appointments`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
business_id     uuid REFERENCES businesses(id) ON DELETE CASCADE
service_id      uuid REFERENCES services(id)
staff_id        uuid REFERENCES staff_profiles(id)
client_id       uuid REFERENCES users(id)
client_name     text NOT NULL                 -- denormalized for guests
client_email    text NOT NULL
client_phone    text
start_time      timestamptz NOT NULL
end_time        timestamptz NOT NULL
status          text DEFAULT 'confirmed'      -- confirmed | cancelled | completed | no_show
notes           text
google_event_id text                          -- to update/delete on Google Calendar
ical_uid        text                          -- for iCal sync
created_at      timestamptz DEFAULT now()
```

### `clients`  *(business-scoped client records)*
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
business_id     uuid REFERENCES businesses(id) ON DELETE CASCADE
user_id         uuid REFERENCES users(id)     -- null if guest booking
email           text NOT NULL
full_name       text NOT NULL
phone           text
notes           text
created_at      timestamptz DEFAULT now()
UNIQUE(business_id, email)
```

### `subscriptions`  *(mirrors Stripe webhooks)*
```sql
id                    uuid PRIMARY KEY DEFAULT gen_random_uuid()
business_id           uuid REFERENCES businesses(id)
stripe_subscription_id text UNIQUE
plan                  text                    -- starter | pro | enterprise
status                text
current_period_end    timestamptz
created_at            timestamptz DEFAULT now()
```

---

## 5. Feature Breakdown

### MVP (Launch)
- [ ] Business signup & onboarding flow
- [ ] Business public booking page (`reserve.me/{slug}`)
- [ ] Service management (CRUD)
- [ ] Staff management + availability setup
- [ ] Client-facing booking flow (pick service → pick staff → pick time → confirm)
- [ ] Email confirmations (booking created, cancelled, reminder 24h before)
- [ ] Google Calendar sync (create/update/delete events on booking actions)
- [ ] iCal feed per staff member
- [ ] Business owner dashboard (view upcoming appointments, manage bookings)
- [ ] Stripe subscription (trial → paid plan)
- [ ] Basic branding per business (name, logo, colors)
- [ ] Cancel / reschedule by client

### Post-MVP (v2)
- [ ] SMS reminders (Twilio)
- [ ] Custom domain support
- [ ] Client accounts (booking history, saved preferences)
- [ ] Staff-specific services (not all staff do all services)
- [ ] Intake forms per service
- [ ] Reviews & ratings
- [ ] Waitlist for fully booked slots
- [ ] Analytics dashboard for business owners
- [ ] Stripe Connect (in-app payments, deposits)
- [ ] Multi-location businesses
- [ ] Admin panel for platform management

---

## 6. Client Booking Flow (Guest-First)

Clients book without creating an account. The flow is:

1. Visit `reserve.me/{slug}` — see the business page
2. Pick a service (name, duration, price shown)
3. Pick a date from a horizontal scroll strip
4. Pick a time from a dropdown of available slots
5. Enter first name, last name, email (required), phone (optional)
6. Hit "Confirm booking" — done

On the confirmation page, two calendar buttons appear immediately:
- **"Add to Google Calendar"** — a pre-filled URL (`calendar.google.com/render?action=TEMPLATE&...`) that opens Google Calendar with all details. No OAuth on our side.
- **"iCal / Outlook"** — downloads a `.ics` file they double-click to import

A confirmation email is also sent automatically with the `.ics` file as an attachment.

**No account needed. No redirect. No password.**

---

## 7. Calendar Integration (Server-Side)

### Business/Staff side — Google Calendar OAuth2
1. Business owner connects their Google account from the dashboard
2. We store encrypted `access_token` + `refresh_token` in `staff_profiles.google_calendar_token`
3. On booking creation → `POST /calendar/v3/calendars/{calendarId}/events`
4. On booking cancellation → `DELETE /calendar/v3/calendars/{calendarId}/events/{eventId}`
5. On reschedule → `PATCH` the event
6. Use server-side refresh token rotation (never expose tokens to client)

**Security note:** Store tokens encrypted at rest (AES-256). Supabase vault or your own encryption layer.

### Business/Staff side — iCal Feed
1. Each staff member gets a unique secret URL: `reserve.me/api/ical/{uuid-token}`
2. Returns a dynamically generated `.ics` with all their appointments
3. Staff can subscribe in any calendar app — auto-refreshes
4. No OAuth needed, protect with unguessable UUID token (rotatable on request)

### Client side — No OAuth needed
- Google Calendar: smart pre-filled URL, client saves in 1 click
- iCal: `.ics` file download or email attachment — works in Apple Calendar, Outlook, any app
- No tokens stored for clients

---

## 8. Authentication & Security

- Supabase Auth handles sessions (JWT-based)
- Role stored in JWT custom claims: `{ business_id, role: 'owner' | 'staff' | 'client' }`
- All DB access gated by RLS policies — even if API is bypassed, data is protected
- Google OAuth tokens encrypted before storage (never in plaintext)
- iCal tokens are UUIDs (unguessable), rotatable
- Stripe webhooks validated with signature verification
- Rate limiting on booking endpoints (prevent spam)
- CSRF protection via Next.js built-ins

---

## 9. Folder Structure (Next.js)

```
/app
  /[slug]                    → public booking page (per business)
    page.tsx
    /book/[serviceId]        → booking flow
  /dashboard                 → business owner area
    /appointments
    /services
    /staff
    /settings
    /billing
  /api
    /webhooks/stripe         → Stripe webhook handler
    /ical/[token]            → iCal feed generator
    /calendar/connect        → Google OAuth callback
  /admin                     → platform admin panel

/components
/lib
  /supabase                  → DB client
  /stripe                    → payment helpers
  /google-calendar           → calendar API wrapper
  /ical                      → .ics generator
  /email                     → Resend templates
```

---

## 10. Estimated Monthly Costs

| Stage | Cost |
|---|---|
| Development / Launch | $0 (free tiers) |
| 1–50 businesses | ~$20–45/month |
| 50–500 businesses | ~$60–120/month |
| 500+ businesses | Scale with revenue |

---

## 11. Suggested Build Order

1. **Supabase project setup** — schema, RLS policies, auth config
2. **Next.js project scaffold** — folder structure, Tailwind, shadcn/ui
3. **Auth flows** — signup, login, role-based redirects
4. **Business onboarding** — create business, set slug, basic settings
5. **Service & staff management** — CRUD in dashboard
6. **Availability engine** — weekly schedule + overrides
7. **Public booking page** — service selection → staff → time slot picker
8. **Booking creation** — write to DB, send confirmation email
9. **Google Calendar integration** — OAuth connect + event sync
10. **iCal feed** — generate .ics endpoint
11. **Stripe integration** — subscription plans, trial period
12. **Polish & launch** — branding, error handling, testing
