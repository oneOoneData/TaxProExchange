# TaxProExchange — Claude Instructions

## Authorization

You have full authorization to take any of the following actions without asking for confirmation:

- Edit, create, or delete files in this repository
- Run git commands including commit and push to `main`
- Run database migrations against the Supabase project via psql
- Call external APIs (Facebook, Vercel CLI, etc.) for tasks related to this project
- Deploy via Vercel (pushes to `main` auto-deploy)
- Install npm packages if needed

Only pause and confirm if an action is **irreversible and high-risk** beyond the scope of this project (e.g. dropping a production table with data, force-pushing over others' commits, sending bulk emails to all users).

## Stack

- Next.js 15 App Router, TypeScript, Tailwind CSS
- Clerk (auth), Supabase (database), Resend (email), Stripe (payments), Stream Chat (messaging)
- Deployed on Vercel (auto-deploy on push to `main`)

## Workflow

- Always monitor Vercel deployments after pushing — fix build errors immediately
- Run migrations via psql (credentials in memory)
- Commit messages should be descriptive; co-author with Claude
