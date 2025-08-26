# TaxProExchange – MVP Build Plan

*Last updated: Aug 26, 2025*

## 🔰 Context (Source of Truth)

**What we’re building:** A connection‑only directory + matchmaking platform for verified tax professionals (CPAs, EAs, CTEC preparers). The MVP focuses on **trust** (credential verification) and **discovery** (search & filters). **No payments** or file exchange.

**Positioning:** “LinkedIn‑lite for tax pros” with verified credentials and simple ways to find each other for handoffs, overflow work, and representation.

**Guiding principles:**

* Trust first: real names, credential verification, clear badges, manual review at start.
* Be narrow: only features that help professionals find each other and connect.
* Ship fast: bias to low‑code / managed services; iterate based on usage.

**Out of scope (for MVP):** Escrow/payments, document exchange/portal, in‑app contracts, complex reputation systems.

---

## 🧭 Goals & Non‑Goals

**Goals**

1. Capture waitlist and seed supply (verified profiles) quickly.
2. Enable discovery via credential/state/specialty filters.
3. Provide basic connection workflow (share contact or lightweight DM).
4. Manual verification workflow with audit trail.

**Non‑Goals**

* Handling client funds or practitioner escrow.
* Tax preparation tools, e‑signature, or file storage.

---

## 👥 Personas

* **CPA (supply)**: Needs overflow help, review & sign‑off partners, IRS rep support.
* **EA (supply/demand)**: Offers IRS representation; seeks referrals and collaboration.
* **CTEC/Tax Preparer (supply/demand)**: Needs CPA for reviews/sign‑offs; offers 1040/Sch C prep capacity.
* **Admin (internal)**: Reviews verification requests, flags/rates risk, approves/denies.

---

## 🏗️ Architecture & Stack

* **Frontend**: Next.js (App Router) + Tailwind, deployed on **Vercel**.
* **Auth**: NextAuth.js (Google + LinkedIn). Require work email if possible; allow exceptions during beta.
* **DB**: **Supabase Postgres** (managed) with RLS.
* **Images**: Vercel/Next Image or Supabase Storage.
* **Forms**: Tally for public waitlist; internal forms via app.
* **Search**: Postgres full‑text + indexes (MVP); consider Typesense/Algolia later.
* **Analytics**: Vercel Analytics + Plausible/GA.
* **Email**: Postmark/Resend (transactional: verification decisions, onboarding).

Environments: **prod**, **staging** (separate DBs). Feature flags via env vars.

---

## 📦 Data Model (Postgres / Supabase)

> Naming: snake\_case tables; UUID v4 primary keys; timestamps (UTC) with `created_at`, `updated_at`.

### 1) `users`

* `id` **uuid pk**
* `email` **text unique not null**
* `password_hash` **text null** (if we support password later; for now null)
* `auth_provider` **text not null** (e.g., `google`, `linkedin`)
* `role` **text not null default 'member'** (enum: `member`, `admin`)
* `is_active` **boolean not null default true**
* `last_sign_in_at` **timestamptz null**
* `created_at` **timestamptz not null default now()**
* `updated_at` **timestamptz not null default now()**

Indexes: `idx_users_email` (unique)

### 2) `profiles`

* `id` **uuid pk**
* `user_id` **uuid fk -> users.id unique not null**
* `first_name` **text not null**
* `last_name` **text not null**
* `headline` **text null** (e.g., “CPA • S‑Corp & Multi‑State”)
* `bio` **text null**
* `credential_type` **text not null** (enum: `CPA`, `EA`, `CTEC`, `Other`)
* `ptin` **text null**
* `website_url` **text null**
* `linkedin_url` **text null**
* `firm_name` **text null**
* `phone` **text null** (optional display)
* `public_email` **text null** (contact email to reveal)
* `avatar_url` **text null**
* `is_listed` **boolean not null default false** (visible in search)
* `visibility_state` **text not null default 'hidden'** (enum: `hidden`, `pending_verification`, `verified`, `rejected`)
* `accepting_work` **boolean not null default true**
* `created_at` **timestamptz not null default now()**
* `updated_at` **timestamptz not null default now()**

Indexes: `idx_profiles_user_id` (unique), `idx_profiles_visibility_state`, FTS trigram on `headline`, `bio`.

### 3) `licenses`

Represents official license/registration records provided by user and validated by admin.

* `id` **uuid pk**
* `profile_id` **uuid fk -> profiles.id not null**
* `license_kind` **text not null** (enum: `CPA_STATE_LICENSE`, `EA_ENROLLMENT`, `CTEC_REG`, `OTHER`)
* `license_number` **text not null**
* `issuing_authority` **text not null** (e.g., `CA Board of Accountancy`, `IRS`, `CTEC`)
* `state` **text null** (2‑letter; required for CPA state licenses)
* `expires_on` **date null**
* `status` **text not null default 'pending'** (enum: `pending`, `verified`, `rejected`)
* `notes` **text null** (admin notes)
* `created_at` **timestamptz not null default now()**
* `updated_at` **timestamptz not null default now()**

Indexes: `idx_licenses_profile_id`, (`license_kind`, `state`), `license_number` btree

### 4) `specializations`

Master list of specialties (seed data).

* `id` **uuid pk**
* `slug` **text unique not null** (e.g., `s_corp`, `multi_state`, `real_estate`, `crypto`, `irs_rep`)
* `label` **text not null**

### 5) `profile_specializations`

Many‑to‑many between profiles and specialties.

* `id` **uuid pk**
* `profile_id` **uuid fk -> profiles.id not null**
* `specialization_id` **uuid fk -> specializations.id not null**
* unique constraint (`profile_id`, `specialization_id`)

### 6) `locations`

Normalized locations selected by profile.

* `id` **uuid pk**
* `country` **text not null default 'US'**
* `state` **text null** (2‑letter)
* `city` **text null**

### 7) `profile_locations`

Profiles can target multiple locations.

* `id` **uuid pk**
* `profile_id` **uuid fk -> profiles.id not null**
* `location_id` **uuid fk -> locations.id not null**
* unique constraint (`profile_id`, `location_id`)

### 8) `availability`

* `id` **uuid pk**
* `profile_id` **uuid fk -> profiles.id not null**
* `accepting_work` **boolean not null default true**
* `capacity_notes` **text null** (e.g., “10 returns/mo”, “Off‑season only”)
* `updated_at` **timestamptz not null default now()**

### 9) `verification_requests`

History of verification actions.

* `id` **uuid pk**
* `profile_id` **uuid fk -> profiles.id not null**
* `submitted_by` **uuid fk -> users.id not null**
* `status` **text not null default 'pending'** (enum: `pending`, `approved`, `rejected`)
* `reviewed_by` **uuid fk -> users.id null** (admin)
* `review_notes` **text null**
* `evidence_urls` **jsonb null** (links/screenshots to board lookups)
* `created_at` **timestamptz not null default now()**
* `updated_at` **timestamptz not null default now()**

### 10) `endorsements` (optional MVP+)

* `id` **uuid pk**
* `profile_id` **uuid fk -> profiles.id not null** (recipient)
* `endorser_profile_id` **uuid fk -> profiles.id not null** (giver)
* `note` **text null**
* unique (`profile_id`, `endorser_profile_id`)

### 11) `connections`

Records of intent to connect (for analytics + optional in‑app messaging later).

* `id` **uuid pk**
* `requester_profile_id` **uuid fk -> profiles.id not null**
* `recipient_profile_id` **uuid fk -> profiles.id not null**
* `status` **text not null default 'pending'** (enum: `pending`, `accepted`, `declined`)
* `created_at` **timestamptz not null default now()**
* `updated_at` **timestamptz not null default now()**
* unique (`requester_profile_id`, `recipient_profile_id`)

### 12) `messages` (stretch; can be off until V2)

* `id` **uuid pk**
* `connection_id` **uuid fk -> connections.id not null**
* `sender_profile_id` **uuid fk -> profiles.id not null**
* `body` **text not null**
* `created_at` **timestamptz not null default now()**

### 13) `waitlist`

Public interest capture (also mirrored in Tally).

* `id` **uuid pk**
* `email` **text unique not null**
* `role_interest` **text null** (e.g., `CPA`, `EA`, `CTEC`)
* `notes` **text null**
* `source` **text null** (e.g., `landing`, `linkedin`, `event`)
* `created_at` **timestamptz not null default now()**

### 14) `audit_logs`

* `id` **uuid pk**
* `actor_user_id` **uuid fk -> users.id not null**
* `action` **text not null** (e.g., `VERIFY_APPROVE`, `VERIFY_REJECT`, `PROFILE_EDIT`)
* `target_table` **text not null**
* `target_id` **uuid not null**
* `metadata` **jsonb null**
* `created_at` **timestamptz not null default now()**

RLS: Profiles readable if `is_listed = true` and `visibility_state = 'verified'`. Users can read/write their own profile rows. Admin bypass.

---

## 🔎 Search & Filters (MVP)

* Query over `profiles` joined with `licenses`, `profile_specializations`, `profile_locations`.
* Filters: `credential_type`, state(s), specialization(s), `accepting_work`.
* Text search over `headline`, `bio`, `firm_name` (pg\_trgm + `ILIKE` fallback).
* Sort: `verified` first, then recent activity, then text relevance.

---

## 🔐 Verification Workflow

1. Profile submits license(s) with numbers and issuing authority.
2. Admin opens `verification_request` and checks public registries:

   * CPA: State Board lookup (e.g., CBA for California).
   * EA: IRS enrolled agent list.
   * CTEC: CTEC registry.
3. Admin uploads screenshot URLs / notes; sets `licenses.status = verified`.
4. If all required credentials verified → set `profiles.visibility_state = 'verified'` and `is_listed = true`.
5. Email notice to user on approval/rejection; log action in `audit_logs`.

---

## 🧩 API Surface (Next.js Route Handlers)

* `POST /api/waitlist` → create waitlist entry.
* `GET /api/specializations` → list.
* `GET /api/search` → query profiles with filters.
* `POST /api/profile` (auth) → upsert profile + licenses.
* `POST /api/verification/submit` (auth) → create `verification_request`.
* `POST /api/verification/:id/decision` (admin) → approve/reject.
* `POST /api/connect` (auth) → create connection request.
* `POST /api/connect/:id/decision` (auth) → accept/decline.

All endpoints rate‑limited; input validated with Zod.

---

## 🖥️ Pages & Components

* `/` Landing (already drafted): hero, features, how‑it‑works, waitlist, FAQ.
* `/join` Onboarding: auth → profile form (credential, states, specialties) → submit verification.
* `/verify` Admin queue: list of pending requests, detail view with evidence upload and approve/reject.
* `/search` Directory: filters sidebar (credential/state/specialty/availability), results grid/list, profile cards.
* `/p/[slug]` Public profile: name, credential badge, specialties, states, bio, contact button, verification badge.

Components: `BadgeVerified`, `CredentialPill`, `FilterPanel`, `ProfileCard`, `AdminDecisionPanel`.

---

## 🧪 QA Checklist (MVP)

* Auth flows (Google/LinkedIn) + RLS rules verified.
* Profiles hidden until `verified`.
* Search returns only verified & listed profiles.
* Admin can approve/reject with audit logs.
* Connection flow records and notifies both parties.
* Accessibility: semantic headings, labels for inputs, focus states, color contrast.

---

## 🔎 SEO & Content

* Titles: "Find Verified CPAs, EAs, and Tax Preparers – TaxProExchange".
* Meta description: 150–160 chars focusing on verified directory.
* OpenGraph/Twitter cards.
* Public `p/[slug]` pages are indexable; `search` is indexable with canonical.
* Schema.org `ProfessionalService` for profile pages.

---

## 📈 Analytics & KPIs

* Waitlist signups (daily/weekly).
* Verified profiles count.
* Searches performed; filter usage.
* Connection requests created & accepted.
* Conversion: % of onboarded → verified → listed.

---

## 🧯 Security & Compliance

* Minimal PII; store only business contact details.
* RLS to restrict row access; admin role via Supabase policies.
* Logs for verification decisions.
* No client data, no tax files handled.

---

## 💵 Monetization (Post‑MVP Switches)

* Featured listings (monthly subscription).
* Job post fees.
* Affiliate placements (tax software, CPE, insurance).

---

## 🗺️ Delivery Plan (Stages)

**Stage 0 – Landing & Waitlist (Week 1)**

* Deploy marketing site on Vercel.
* Tally form for waitlist; mirror to `waitlist` table.

**Stage 1 – Onboarding & Verification (Weeks 2–3)**

* Auth + `/join` profile form.
* Submit license(s) → `verification_requests`.
* Admin `/verify` to approve/reject; emails + audit logs.

**Stage 2 – Search & Profiles (Weeks 3–4)**

* `/search` with filters (credential/state/specialty/availability).
* Public profile pages with verification badges.

**Stage 3 – Connections (Week 5)**

* `Connect` CTA → record connection request; email both parties; optional in‑app minimal messaging.

**Stage 4 – Growth & UX Polish (Week 6+)**

* Invite campaigns to waitlist; add endorsements (lightweight) and activity sorting.
* Add featured listings (simple toggle + billing later).

---

## 🧱 SQL Sketches

```sql
-- profiles minimal FTS support
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_profiles_trgm ON profiles USING gin ((headline || ' ' || coalesce(bio, ''))) gin_trgm_ops;

-- RLS example
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profile_read_public ON profiles
  FOR SELECT USING (
    is_listed = true AND visibility_state = 'verified'
  );
CREATE POLICY profile_self_rw ON profiles
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

---

## 🧰 Dev Tasks (Backlog excerpts)

* [ ] Next.js app bootstrap, Tailwind, ESLint, Prettier, Zod.
* [ ] NextAuth with Google/LinkedIn providers.
* [ ] Supabase project + tables + RLS policies.
* [ ] `/join` wizard with client/server validation.
* [ ] Admin `/verify` queue with approve/reject + email via Resend.
* [ ] `/search` endpoint + UI (filters + pagination).
* [ ] Profile pages with clean slugs.
* [ ] Connection requests + notifications.
* [ ] Analytics wiring (Vercel + Plausible).

---

## 📎 Sample Profile JSON (for fixtures)

```json
{
  "first_name": "Jordan",
  "last_name": "Chan",
  "credential_type": "CPA",
  "headline": "CPA • S-Corp & Multi-State",
  "bio": "10+ years reviewing S-corps and multi-state filings; open for seasonal overflow.",
  "firm_name": "Chan & Co.",
  "public_email": "jordan@chanandco.com",
  "accepting_work": true,
  "specializations": ["s_corp", "multi_state", "irs_rep"],
  "locations": [{"state": "CA"}, {"state": "AZ"}]
}
```

---

## 🚀 Launch Checklist

* [ ] Custom domain attached in Vercel; HTTPS green.
* [ ] Robots.txt + sitemap.xml.
* [ ] Seed at least 25 verified profiles (manual onboarding).
* [ ] Search and profile pages load < 2s on mobile.
* [ ] Admin verification SOP documented (screenshots/evidence required).
* [ ] Privacy & Terms drafted (connection‑only, no client data).

---

## ⚠️ Risks & Mitigations

* **Credential fraud** → manual checks + evidence; fast takedown.
* **Low supply density initially** → hand‑recruit first cohort; “Founding Member” badges.
* **Seasonality** → broaden categories (year‑round bookkeeping, IRS resolution).

---

## 📣 Messaging Snippets (for outreach)

> “We’re launching TaxProExchange — a verified directory for CPAs, EAs, and CTEC preparers to find each other for referrals and overflow work. Join the beta and claim your profile.”
