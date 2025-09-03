diff --git a/buildplan.md b/buildplan.md
index 3b2e1ad..7f6c2b1 100644
--- a/buildplan.md
+++ b/buildplan.md
@@ -1,14 +1,16 @@
 # TaxProExchange — MVP Build Plan
-Last updated: Aug 26, 2025
+Last updated: Aug 30, 2025

 ## Scope & Positioning
-MVP = verified directory + discovery (no payments, no file exchange), “LinkedIn-lite for tax pros.”
+MVP = verified directory + discovery **and lightweight Job Board** (no payments, no file exchange, no in-app chat). “LinkedIn-lite for tax pros, with a simple job board for overflow work.”

 ## Goals / Non-Goals
 ### Goals
-- Seed verified supply; enable discovery by credential/state/specialization.
-- Manual verification with audit trail.
-- Basic connection workflow (off-platform email OK).
+- Seed verified supply; enable discovery by credential/state/specialization.
+- Manual verification with audit trail.
+- Basic connection workflow (off-platform email OK).
+-- **New:** Allow verified firms to publish **Job Posts**; allow verified pros to **apply**; notify via email.
+
 ### Non-Goals (MVP)
 - Escrow/payments
 - Document portal/file exchange
 - Complex reputation system
 - In-app messaging/chat
- - Job marketplace with bidding/escrow
+ - Job marketplace with bidding/escrow (beyond simple posting + applications)

 ## Personas
 - CPA, EA, CTEC/Preparer
 - Admin (internal)

 ## Stack & Architecture
-- **Next.js (App Router)** + Tailwind on Vercel
-- **Authentication:** NextAuth (Google/LinkedIn)
-- **Database:** Supabase Postgres + RLS
-- **Email:** Postmark/Resend (TBD)
-- **Analytics:** Vercel Analytics + GA/Plausible
-- **Forms/Waitlist:** Tally
+- **Next.js (App Router)** + Tailwind on Vercel
+- **Authentication:** **Clerk** (Google/LinkedIn OAuth). Server uses Clerk auth for SSR/middleware guards.
+- **Database:** Supabase Postgres + RLS
+- **Email:** **Resend** (DKIM configured) for verification decisions, job notifications, and digests.
+- **Analytics:** Vercel Analytics + GA/Plausible
+- ~~Forms/Waitlist: Tally~~ **Removed waitlist** (no longer needed).

@@
 ## Data Model (MVP)
-- `users`, `profiles` (visibility_state, is_listed, accepting_work)
-- `licenses`, `specializations`, `profile_specializations`
-- `locations`, `profile_locations`, `availability`
-- `verification_requests`
-- *(optional post-MVP)* `endorsements`, `connections`, `messages`, `waitlist`
+- `users`, `profiles` (visibility_state, is_listed, accepting_work, **is_verified**)
+- `licenses`, `specializations`, `profile_specializations`
+- `locations`, `profile_locations`, `availability`
+- `verification_requests`
+- **Job Board (new):** `jobs`, `applications`
+- *(optional post-MVP)* `endorsements`, `connections`, `messages`
+- ~~`waitlist`~~ (removed)

@@
 ## Search & Filters (MVP)
 - Query `profiles` joined to licenses/specializations/locations
 - Filters: credential, state(s), specialization(s), accepting work
 - Text search over headline/bio/firm
 - Sort: verified → recent activity → relevance
+ - **Jobs index** supports filters: credential required, specialization, states, location_type (remote/onsite/hybrid), rate_type.

@@
 ## Verification Workflow
 - Submit license(s); admin checks registries (CPA board, IRS EA, CTEC)
 - Upload evidence/notes
 - Set `licenses.status`; if approved, set `profiles.visibility_state='verified'` and `is_listed=true`
 - Email user and write `audit_logs`
+ - **Email via Resend.** Templates: `verification-approved`, `verification-rejected`.

@@
-## API Surface
-- `/api/specializations`, `/api/search`, `/api/profile`
-- `/api/verification/*`
-- `/api/connect/*`
-- `/api/waitlist`
+## API Surface
+- `/api/specializations`, `/api/search`, `/api/profile`
+- `/api/verification/*`
+- `/api/connect/*`
+- **Job Board (new):**
+  - `POST /api/jobs` (verified firms) — create as `draft`
+  - `PATCH /api/jobs/:id` (owner/admin) — edit; status transitions
+  - `POST /api/jobs/:id/publish` (owner/admin) — set `status='open'`
+  - `GET /api/jobs` — public listing with filters
+  - `GET /api/jobs/:slug` — public detail
+  - `POST /api/jobs/:id/applications` (authed pro) — submit
+  - `GET /api/jobs/:id/applications` (owner/admin) — list
+  - `PATCH /api/applications/:id` (job owner/admin) — update status
+- ~~`/api/waitlist`~~ (removed)

@@
 ## Pages & Components
 - `/` landing
 - `/join` onboarding
 - `/verify` admin queue
 - `/search` directory
 - `/p/[slug]` public profile
+- **Job Board (new pages):**
+  - `/jobs` (public index, filterable)
+  - `/jobs/[slug]` (public detail)
+  - `/jobs/new` (gated to verified firms)
+  - `/admin/jobs` (moderation queue)

@@
 ## QA Checklist (MVP)
 - Auth + RLS verified (no client-side trust)
 - Profiles hidden until verified; only `verified && is_listed` appear in search
 - Admin can approve/reject with audit logs
 - Connection call-to-action (off-platform email is OK)
 - Accessibility basics
+ - **Jobs:** Unverified users cannot access `/jobs/new` or create jobs (UI & API blocked)
+ - **Jobs:** Public sees only `open/paused` jobs; closed/archived 404 unless owner/admin
+ - **Applications:** Applicant sees own applications; job owner sees apps to their job; others denied
+ - **Notifications:** Emails sent on application submit and status change (idempotent)

@@
 ## SEO & Content
 - Title/meta, OG/Twitter
 - `ProfessionalService` schema on profile pages
 - `/search` indexable with canonical
+ - **Job Board:** Add `schema.org/JobPosting` to `/jobs/[slug]` with `title`, `description`, `employmentType: Contract`,
+   `jobLocationType`, `applicantLocationRequirements` (states), `datePosted`, `validThrough` (deadline), `hiringOrganization`,
+   and `baseSalary`/`value` when provided.
+ - Ensure `/jobs` is indexable; add canonical to filtered views.

@@
 ## Analytics & KPIs
-- Track waitlist signups, verified count, searches/filters, connection requests
+- Track verified count, searches/filters, connection requests
+- **Job Board events:** `job_created`, `job_published`, `job_viewed`, `job_filtered`, `application_submitted`,
+  `application_status_changed`
 - Conversion: onboard → verified → listed
+ - Conversion (Jobs): verified_firm → job_published; profile_completed → application_submitted

@@
 ## Security & Compliance
 - Minimal PII
 - Strict RLS/admin policies
 - Decision logs
 - No client tax files
+ - Clerk used for authentication; admin role enforced server-side only.

@@
 ## Monetization (post-MVP)
 - Featured listings
 - Job post fees
 - Affiliate placements

@@
-## Delivery Stages
+## Delivery Stages
 - **Stage 0:** Landing
 - **Stage 1:** Onboarding & Verification
-- **Stage 2:** Search & Profiles
-- **Stage 3:** Connections
+- **Stage 2:** Search & Profiles **+ Job Board (lightweight)**
+- **Stage 3:** Connections
 - **Stage 4:** Growth/UX polish

@@
 ## SQL & RLS Sketches
 - `pg_trgm` index for headline/bio search
 - Example RLS: public read, self read/write on profiles
+
+### Job Board — Tables
+```sql
+create table if not exists jobs (
+  id uuid primary key default gen_random_uuid(),
+  owner_id uuid not null references users(id),
+  title text not null,
+  slug text generated always as (regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')) stored,
+  description text not null,
+  credentials_required text[] not null default '{}',
+  specializations text[] not null default '{}',
+  software_required text[] not null default '{}',
+  location_type text not null check (location_type in ('remote','onsite','hybrid')),
+  states text[] not null default '{}',
+  rate_type text not null check (rate_type in ('fixed','hourly','percentage')),
+  budget_low numeric null,
+  budget_high numeric null,
+  payout_terms text null,
+  deadline date null,
+  status text not null default 'draft' check (status in ('draft','open','paused','closed','archived')),
+  published_at timestamptz null,
+  created_at timestamptz not null default now()
+);
+
+create table if not exists applications (
+  id uuid primary key default gen_random_uuid(),
+  job_id uuid not null references jobs(id) on delete cascade,
+  applicant_id uuid not null references users(id),
+  cover_note text,
+  status text not null default 'submitted' check (status in ('submitted','reviewed','declined','accepted')),
+  created_at timestamptz not null default now()
+);
+
+create index if not exists idx_jobs_specializations on jobs using gin (specializations);
+create index if not exists idx_jobs_states on jobs using gin (states);
+create index if not exists idx_jobs_software on jobs using gin (software_required);
+create index if not exists idx_jobs_title_trgm on jobs using gin (title gin_trgm_ops);
+create index if not exists idx_jobs_desc_trgm on jobs using gin (description gin_trgm_ops);
+```
+
+### Job Board — RLS (sketch)
+```sql
+alter table jobs enable row level security;
+create policy jobs_public_select on jobs
+  for select using (status in ('open','paused') or owner_id = auth.uid() or is_admin(auth.uid()));
+create policy jobs_owner_write on jobs
+  for all using (owner_id = auth.uid() or is_admin(auth.uid()))
+  with check (owner_id = auth.uid() or is_admin(auth.uid()));
+create policy jobs_insert_verified on jobs
+  for insert with check (profile_is_verified(auth.uid()));
+
+alter table applications enable row level security;
+create policy apps_applicant_select on applications
+  for select using (applicant_id = auth.uid() or job_belongs_to(auth.uid(), job_id) or is_admin(auth.uid()));
+create policy apps_applicant_insert on applications
+  for insert with check (auth.uid() = applicant_id);
+create policy apps_owner_update on applications
+  for update using (job_belongs_to(auth.uid(), job_id) or is_admin(auth.uid()))
+  with check (true);
+```

@@
 ## Launch Checklist & Risks
 - Domain + HTTPS
 - robots.txt & sitemap.xml
 - Seed 25 verified profiles
 - Perf targets
 - Verification SOP
 - Privacy/Terms live
 - Risks: credential fraud, low supply density, seasonality
+ - **New risk:** low-quality/spam jobs → mitigations: only verified firms can post, “Report job,” admin moderation queue.
