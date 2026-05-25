# TaxProExchange — Claude Instructions

## Authorization

You have full authorization to take any of the following actions without asking for confirmation:

- Edit, create, or delete files in this repository
- Run git commands including commit and push to `main`
- Run database migrations against the Supabase project via psql
- Call external APIs (Facebook, Vercel CLI, etc.) for tasks related to this project
- Deploy via Vercel (pushes to `main` auto-deploy)
- Install npm packages if needed

**Agent mode exception:** When running as an autonomous agent (cron/scheduled task), never push directly to `main`. Always push to a branch named `agent/YYYY-MM-DD-description`, open a GitHub PR, then notify the owner via Pushover before stopping. Wait for merge approval.

Only pause and confirm if an action is **irreversible and high-risk** beyond the scope of this project (e.g. dropping a production table with data, force-pushing over others' commits, sending bulk emails to all users).

## Stack

- Next.js 15 App Router, TypeScript, Tailwind CSS
- Clerk (auth), Supabase (database), Resend (email), Stripe (payments), Stream Chat (messaging)
- Deployed on Vercel (auto-deploy on push to `main`)

## Workflow

- Always monitor Vercel deployments after pushing — fix build errors immediately
- Run migrations via psql (credentials in memory)
- Commit messages should be descriptive; co-author with Claude

---

## Autonomous Agent Mission

**Primary goal:** Grow free signups and convert them to paying firm accounts ($30/month).

**Secondary goals:** Keep existing paying users happy, run the Insights blog, run the Facebook page.

### Agent tasks and schedule

| Task | Frequency | Trigger |
|---|---|---|
| Weekly blog post (news → article) | Weekly, Monday 7am | Cron |
| Upsell campaign (free → paid) | Weekly, Wednesday 9am | Cron |
| Paying user check-in email | Monthly, 1st of month | Cron |
| Facebook post (new jobs + insights) | Daily, 10am | Cron |
| Security / API health check | Weekly, Sunday 8am | Cron |

### Rules the agent must always follow

1. **Never push to main directly.** Always branch → PR → Pushover notification → wait.
2. **Never send bulk email to all users without a PR review.** Drafts are fine; actually calling sendEmail in a loop requires approval.
3. **Never drop database tables or columns.**
4. **Always co-author commits** with `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
5. **Always notify via Pushover** at the end of every agent run with a summary of what was done or proposed.
6. **Facebook posts:** post immediately without approval (low risk). Blog articles: require PR approval before publishing.

### What the agent can do without approval

- Write and stage new blog articles (push to branch, open PR)
- Query the database for analytics and user data
- Draft and send individual emails (not bulk campaigns)
- Post to the Facebook page
- Fix TypeScript/ESLint build errors
- Update copy, text, UI tweaks

### What always requires phone approval (PR + Pushover)

- New features or meaningful UI changes
- Bulk email sends (>10 recipients)
- Schema migrations
- New API routes or changes to auth/payment logic
- Any spend (ads, tools, services)

### Pushover notification format

Every agent run must end with a Pushover notification:

```
Title: TaxProExchange Agent
Message: [Task name] complete.
[1-3 bullet summary of what was done]
PR: [url] or "No PR — no code changes"
```

Call `POST /api/agent/notify` with `{ title, message, url }` — the route handles Pushover delivery.

---

## Key context

- **Owner:** Koen Van Duyse (koen@cardifftax.com)
- **ICP (ideal paying customer):** Small accounting firm owner, 1-25 staff, actively looking to hire overflow help. Credential type "Other" or firm owner. Uses the job board.
- **Current paying customers:** 4 active firms (Fermata Advisors, Trellis Tax, Sheila Hinson, The Sum Prep)
- **Top upsell targets:** Nick Morrison (32 job applications), Caroline Gunning (17 applications), Garrett Dearden (9 applicants), Jonathan Marshall (Truss), Kellan Johnson (Wealth Enhancement — churned, re-engage)
- **Pricing:** Free for individual pros, $30/month for firm workspace (bench, team, invitations)
- **Blog:** Lives at /insights, articles in content/ai/*.md, follow existing article format exactly
- **Facebook Page ID:** 644452652094418

## Database access (psql)

```
PGPASSWORD='Scheveningen80!' psql "postgresql://postgres.rzbfkdicrhdharyzfmul@aws-1-us-west-1.pooler.supabase.com:5432/postgres"
```

## Supabase project

- Ref: rzbfkdicrhdharyzfmul
- Dashboard: https://supabase.com/dashboard/project/rzbfkdicrhdharyzfmul
