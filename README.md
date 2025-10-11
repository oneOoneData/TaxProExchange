# TaxProExchange

A trusted directory for CPAs, EAs, and CTEC preparers to find each other for handoffs, overflow work, and representation.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Deployment**: Vercel (recommended)

## 📁 Project Structure

```
├── app/
│   ├── globals.css      # Global styles with Tailwind
│   ├── layout.tsx       # Root layout component
│   └── page.tsx         # Landing page
├── package.json         # Dependencies
├── tailwind.config.js   # Tailwind configuration
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

## 🔧 Configuration

### Tally Form Integration

Replace `REPLACE_WITH_TALLY_URL` in `app/page.tsx` with your actual Tally form URL:

```tsx
// In the waitlist section
src="https://tally.so/r/YOUR_ACTUAL_FORM_ID"
```

### Customization

- **Colors**: Modify `tailwind.config.js` for brand colors
- **Content**: Update text content in `app/page.tsx`
- **Styling**: Adjust Tailwind classes throughout components

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repository to Vercel
3. Deploy automatically

### Manual Build

```bash
npm run build
npm start
```

## 📝 Next Steps

This is Stage 0 (Landing & Waitlist). Future stages include:

- **Stage 1**: Onboarding & Verification
- **Stage 2**: Search & Profiles  
- **Stage 3**: Connections
- **Stage 4**: Growth & Polish

## 🔍 SEO & Content Management

### Adding a New Solution Page

Solution pages are SEO-optimized landing pages for specific B2B use cases (overflow staffing, SALT, crypto tax, etc.). To add a new solution:

1. **Add solution config to `lib/constants/solutions.ts`:**
   ```typescript
   {
     slug: 'your-new-solution',
     title: 'Your Solution Title for Tax Firms',
     description: 'Brief meta description (155 chars)',
     h1: 'Your Solution Title for Tax Firms',
     intro: 'Multi-paragraph intro (400-700 words)...',
     whenToUse: [
       'Use case 1',
       'Use case 2',
       'Use case 3'
     ],
     searchQuery: '/search?specialization=your_spec&accepting_work=true',
     faqs: [
       { question: 'Q1?', answer: 'A1' },
       // Add 3-5 FAQs
     ]
   }
   ```

2. **Solution pages are auto-generated** at `/solutions/[slug]` via `generateStaticParams()`.

3. **Update sitemap** – it auto-includes all solutions from the config file.

4. **Deploy** – new solution page will be statically generated on next build.

### Adding a Prefiltered Search Entry to Sitemap

Prefiltered search URLs help SEO by creating crawlable entry points for high-value searches.

1. **Edit `app/sitemap.ts`:**
   ```typescript
   const searchPresets = [
     // Add your new preset
     { query: 'specialization=your_spec&state=CA', label: 'Your-Label-CA' },
     // ...existing presets
   ];
   ```

2. **Deploy** – sitemap will include the new URL on next build.

### Content Guidelines

- **Solution page intro**: 400-700 words, include key terms (overflow, SALT, IRS rep, crypto, etc.)
- **FAQs**: 3-5 questions per solution page, address common objections and clarify process
- **Search intro**: 150-250 words, front-load key terms in first paragraph

### SEO Checklist

- ✅ All public pages use `generateMetadata()` with unique titles/descriptions
- ✅ Canonical URLs set on all pages
- ✅ JSON-LD structured data (Organization, FAQPage, Person, BreadcrumbList)
- ✅ Sitemap includes latest 1,000 profiles + all solution pages + 30 prefiltered searches
- ✅ `robots.txt` allows public pages, disallows auth/dashboard/admin
- ✅ Noindex headers on protected routes (onboarding, dashboard, messages, etc.)
- ✅ Analytics events tracked: `view_for_firms`, `view_solution`, `view_search_prefilter`, `click_browse_verified_pros`

### Files Changed in This SEO Refactor

**New files:**
- `components/seo/JsonLd.tsx` – Generic JSON-LD wrapper component
- `components/seo/SolutionCTA.tsx` – Call-to-action component with analytics
- `components/analytics/AnalyticsPageView.tsx` – Client component for tracking page views
- `lib/constants/solutions.ts` – Solution page configuration
- `lib/analytics.ts` – Analytics event tracking utilities
- `app/for-firms/page.tsx` – New B2B pillar page
- `app/solutions/[slug]/page.tsx` – Dynamic solution pages (SSG)
- `app/sitemap.ts` – Sitemap generator
- `app/onboarding/layout.tsx`, `app/admin/layout.tsx`, etc. – Noindex layouts

**Modified files:**
- `app/page.tsx` – Converted to SSR with B2B hero copy
- `app/search/page.tsx` – Added crawlable intro content
- `app/p/[slug]/page.tsx` – Added `generateStaticParams()` for top 500 profiles
- `app/robots.ts` – Updated allow/disallow rules

## 🤝 Contributing

Follow the build plan in `buildplan.md` for development priorities.
