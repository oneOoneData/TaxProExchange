# Admin Firms Dashboard + Website Enrichment

**Date:** 2025-10-09

## Overview
Built complete admin-only firms management dashboard with live website enrichment capability.

## Files Created

1. **database/migrations/20251009_add_enrichment_fields.sql** - Adds enrichment columns to profiles
2. **lib/enrichment/siteEnricher.ts** - Playwright + Cheerio website scraping engine
3. **app/api/admin/firms/route.ts** - GET/POST API for firms list with search/sort/pagination
4. **app/api/admin/firms/export/route.ts** - GET API for CSV export
5. **app/api/admin/enrich/route.ts** - POST API to run enrichment on selected/filtered firms
6. **components/admin/FirmsGrid.tsx** - TanStack Table v8 grid with search/sort/selection
7. **app/admin/firms/page.tsx** - Admin page at /admin/firms

## Features

1. **Firms Grid** - Live data from `public.profiles` table
2. **Global Search** - Across firm_name, website_url, linkedin_url, specialty_verified
3. **Sortable Columns** - Click-to-sort headers for all columns
4. **Pagination** - Configurable page size (default 50)
5. **Row Selection** - Checkboxes for targeted enrichment
6. **CSV Export**:
   - Export visible CSV (client-side)
   - Export ALL/filtered CSV (server-side)
7. **Run Enrichment** - Button that crawls firm websites to:
   - Discover team/about pages
   - Count team members (extracts names from HTML)
   - Extract specialty keywords
   - Write back to: team_size_verified, team_page_url, specialty_verified, confidence_level, last_verified_on

## Database Changes

Added enrichment columns to `public.profiles`:
- `team_size_verified` (text) - Number of team members discovered
- `team_page_url` (text) - URL of team/about page used
- `specialty_verified` (text) - Specialties extracted from website
- `confidence_level` (text) - High/Medium/Low confidence score
- `last_verified_on` (date) - Date of last enrichment run

## Enrichment Logic

### Technology Stack
- **Playwright** (headless Chromium) to render JavaScript pages
- **Cheerio** for HTML parsing
- **Concurrency**: 4 pages at once
- **Timeout**: 15s per page

### Behavior
- Respects `robots.txt` (checks Disallow rules before crawling)
- Discovers candidate URLs: /team, /our-team, /about, /staff, /leadership, etc.
- Parses homepage for additional team-related links
- Retries once on network failure

### Name Detection
- Looks for 2-4 capitalized words (e.g., "Jane Q. Doe")
- Excludes ALL CAPS headers (e.g., "OUR TEAM")
- Filters out common non-names (e.g., "Tax Preparation")
- Uses selectors: [itemprop="name"], .team-member, .staff, .member, h1-h4, strong, etc.

### Specialty Extraction
Keyword matching for:
- Bookkeeping, Payroll, Tax Preparation, Tax Planning
- Sales Tax, SALT, IRS Representation
- Fractional CFO, Real Estate, Construction
- Ecommerce, Cryptocurrency, R&D Tax Credit
- Cost Segregation, Estate Planning, Financial Planning

### Confidence Scoring
- **High**: 3+ people found AND team-related page
- **Medium**: 1-2 people OR about page with some roles
- **Low**: 0 people, robots.txt disallowed, or only inferred keywords

## Security

- **Admin-Only**: All routes check `is_admin` via Clerk + Supabase
- **No LinkedIn Scraping**: Only crawls firm websites from `profiles.website_url`
- **No Third-Party Logins**: Public pages only
- **Single Origin**: Only crawls the domain in website_url field

## Usage

1. **Run Database Migration**:
   ```bash
   psql -h <host> -U <user> -d <database> -f database/migrations/20251009_add_enrichment_fields.sql
   ```

2. **Access Dashboard**:
   Navigate to `/admin/firms` (admin-only)

3. **Run Enrichment**:
   - Select specific rows (checkboxes) + click "Run Enrichment", OR
   - Apply search filters + click "Run Enrichment" to enrich filtered set, OR
   - Click "Run Enrichment" with no selection to enrich all visible/filtered firms

4. **Export Data**:
   - "Export Visible CSV" - Downloads current page
   - "Export ALL CSV" - Downloads all filtered results

## API Endpoints

### GET /api/admin/firms
Query params: `?query=&page=1&pageSize=50&sort=firm_name.asc`
Returns: `{ rows: [], total: number, page: number, pageSize: number }`

### POST /api/admin/firms (optional)
Body: `{ firms: [{ firm_name?, website_url, linkedin_url? }] }`
Upserts firms by website_url (case-insensitive)

### GET /api/admin/firms/export
Query params: `?query=&sort=firm_name.asc`
Returns: CSV file stream

### POST /api/admin/enrich
Body options:
- `{ ids: ["uuid1", "uuid2"] }` - Enrich specific profiles
- `{ query: "search", sort: "firm_name.asc" }` - Enrich filtered set
- `{ all: true }` - Enrich all profiles with websites

Returns: `{ total, attempted, updated, skipped, errors: [{id, reason}] }`

## TODOs

- [ ] Run database migration in production
- [ ] Test enrichment on sample profiles
- [ ] Consider adding rate limiting to prevent overload
- [ ] Add enrichment status/progress tracking for long-running jobs
- [ ] Add retry logic for failed enrichments
- [ ] Consider background job queue for large enrichment runs

## Notes

- Enrichment runs synchronously within HTTP request (may timeout on large sets)
- For very large datasets, consider breaking into smaller batches
- Playwright browser is launched/closed per enrichment request
- No sample/mock data - all data comes from Supabase `public.profiles`

