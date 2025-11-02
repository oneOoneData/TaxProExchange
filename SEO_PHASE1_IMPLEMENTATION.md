# 🧭 Phase 1 SEO Optimization — Implementation Plan

**Project:** TaxProExchange (Next.js 15 App Router / Vercel / Supabase)  
**Goal:** Backend SEO optimizations without visible UI/copy changes  
**Pages:** `/` (homepage) and `/ai` (AI Thought Leadership hub)

---

## ✅ Current State Audit

### Already Implemented ✅
- `next-sitemap` installed and configured (`next-sitemap.config.js`)
- Dynamic sitemap generation (`app/sitemap.ts` includes AI posts)
- Robots.txt (`app/robots.ts`)
- Article schema on individual posts (`articleJsonLd` in `lib/seo.ts`)
- JSON-LD component (`components/seo/JsonLd.tsx`)
- Basic image optimization config in `next.config.js`

### Missing / Needs Fix ❌
- `sharp` package not installed (required for AVIF/WebP)
- Image formats not configured (`formats` array missing)
- `<img>` tags instead of Next.js `<Image>` in:
  - `app/ai/[slug]/page.tsx` (line 110)
  - `app/ai/page.tsx` (line 140)
- Article schema missing on `/ai` hub page
- FAQ schema missing on `/ai` hub page
- BreadcrumbList schema missing for `/ai → /article` navigation
- Lazy loading not explicitly configured for below-the-fold images
- CDN caching headers not optimized for static assets

---

## 📋 Implementation Tasks

### 1. Install Dependencies

```bash
npm install sharp
```

**Why:** Next.js requires `sharp` (or `squoosh`) for automatic image optimization and AVIF/WebP conversion. Without it, images won't be optimized even with the config.

---

### 2. Update `next.config.js`

**Add image format optimization and performance headers:**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  
  // Image optimization configuration
  images: {
    formats: ['image/avif', 'image/webp'], // Add AVIF/WebP format support
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
        pathname: '/avatar/**',
      },
    ],
  },
  
  // ... existing redirects ...
  
  // Security headers + Cache-Control for static assets
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
}

module.exports = {
  ...nextConfig,
  productionBrowserSourceMaps: true
}
```

**Changes:**
- Add `formats: ['image/avif', 'image/webp']` to images config
- Add Cache-Control headers for static assets
- Add `compress: true` (enables Brotli/Gzip)
- Remove `poweredByHeader` (security best practice)

---

### 3. Extend `lib/seo.ts` (Not Create New File)

**Add functions to existing file:**

```typescript
// Add to lib/seo.ts (after existing articleJsonLd function)

/**
 * Generate JSON-LD for Article schema (hub/page level)
 * Use for collection pages like /ai
 */
export function generateArticleCollectionJsonLd({
  title,
  description,
  url,
  dateModified,
  author,
}: {
  title: string;
  description: string;
  url: string;
  dateModified?: string;
  author?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    dateModified: dateModified || new Date().toISOString(),
    ...(author && {
      author: {
        '@type': 'Person',
        name: author,
      },
    }),
    publisher: {
      '@type': 'Organization',
      name: 'TaxProExchange',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo-black.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}

/**
 * Generate JSON-LD for BreadcrumbList schema
 * Use for navigation: Home → AI Hub → Article
 */
export function generateBreadcrumbListJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
    })),
  };
}
```

**Note:** `generateFaqJsonLd` already exists in `lib/seo.ts`, so we'll reuse it.

---

### 4. Update `/app/ai/page.tsx`

**Changes needed:**

1. **Add schema imports:**
```typescript
import JsonLd from '@/components/seo/JsonLd';
import { 
  siteUrl, 
  generateArticleCollectionJsonLd,
  generateFaqJsonLd 
} from '@/lib/seo';
```

2. **Update metadata title** (optimize for keywords):
```typescript
export const metadata: Metadata = {
  title: "AI in Tax: Thought Leadership & Tools for CPAs | TaxProExchange",
  description: "Exploring how AI transforms tax preparation—local LLMs, automation, and trusted tools.",
  alternates: { canonical: `${siteUrl}/ai` },
  // ... rest stays same
};
```

3. **Add schemas in component** (after line 25, before return):
```typescript
export default function AIPage() {
  const posts = getAllPosts();
  
  // Generate schemas
  const articleSchema = generateArticleCollectionJsonLd({
    title: 'AI in Tax: Thought Leadership & Tools for CPAs',
    description: 'Exploring how AI transforms tax preparation—local LLMs, automation, and trusted tools.',
    url: `${siteUrl}/ai`,
    dateModified: posts.length > 0 ? posts[0].data.date : new Date().toISOString(),
    author: 'TaxProExchange Editorial',
  });
  
  const faqSchema = generateFaqJsonLd([
    {
      question: 'How does AI help tax professionals?',
      answer: 'AI assists tax pros with document processing, error detection, client communication, and staying current with tax law changes. Local AI tools offer privacy and security advantages.',
    },
    {
      question: 'Is local AI secure for sensitive tax data?',
      answer: 'Yes. Local AI models run on your own infrastructure, ensuring client data never leaves your control. This is critical for CPA firms handling confidential financial information.',
    },
    {
      question: 'Will AI replace CPAs and tax preparers?',
      answer: 'No. AI augments tax professionals by handling repetitive tasks, allowing CPAs and EAs to focus on complex advisory work, client relationships, and strategic planning.',
    },
  ]);

  return (
    <>
      <JsonLd data={articleSchema} />
      <JsonLd data={faqSchema} />
      <AppNavigation />
      {/* ... rest of component */}
    </>
  );
}
```

4. **Replace `<img>` with Next.js `<Image>`** (line 140):
```typescript
// BEFORE:
<img
  src={post.data.previewImage || post.data.image}
  alt={post.data.title}
  className="w-full h-full object-cover"
/>

// AFTER:
<Image
  src={post.data.previewImage || post.data.image || '/images/placeholder.png'}
  alt={post.data.title}
  width={800}
  height={450}
  className="w-full h-full object-cover"
  loading="lazy"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

---

### 5. Update `/app/ai/[slug]/page.tsx`

**Changes needed:**

1. **Add BreadcrumbList schema** (after line 79):
```typescript
import { generateBreadcrumbListJsonLd } from '@/lib/seo';

// Inside component, after articleSchema:
const breadcrumbSchema = generateBreadcrumbListJsonLd([
  { name: 'Home', url: '/' },
  { name: 'AI Thought Leadership', url: '/ai' },
  { name: post.data.title, url },
]);

return (
  <>
    <JsonLd data={articleSchema} />
    <JsonLd data={breadcrumbSchema} />
    <AppNavigation />
    {/* ... rest */}
  </>
);
```

2. **Replace `<img>` with Next.js `<Image>`** (line 110):
```typescript
// BEFORE:
<img
  src={post.data.image}
  alt={post.data.title}
  className="w-full h-auto object-cover"
/>

// AFTER:
<Image
  src={post.data.image || '/images/placeholder.png'}
  alt={post.data.title}
  width={1200}
  height={630}
  className="w-full h-auto object-cover"
  priority={false} // Not above fold
  sizes="(max-width: 768px) 100vw, 1200px"
/>
```

---

### 6. Add `<link rel="next/prev">` for Pagination (If Needed)

**If `/ai` has pagination, add in metadata:**

```typescript
export const metadata: Metadata = {
  // ... existing metadata
  other: {
    // Add if pagination exists
    'prev': '/ai?page=1',
    'next': '/ai?page=3',
  },
};
```

**Note:** Currently `/ai` shows all posts, so this may not be needed unless pagination is added.

---

### 7. Verify Metadata Titles (No Duplicates)

**Check for patterns like:** `| TaxProExchange | TaxProExchange`

**Current state:**
- `/` → ✅ Good: "Verified CPAs & EAs... | TaxProExchange"
- `/ai` → ✅ Good: "AI Thought Leadership | TaxProExchange"
- `/ai/[slug]` → ✅ Good: `${post.data.title} | TaxProExchange`

**No changes needed if pattern is consistent.**

---

### 8. Optimize Script Loading (If Needed)

**Check for any third-party scripts that should be deferred:**

If you have analytics or other scripts, ensure they use `next/script`:

```typescript
import Script from 'next/script';

// In component:
<Script
  src="https://example.com/analytics.js"
  strategy="lazyOnload"
  id="analytics"
/>
```

**Note:** Check if analytics already use `next/script` — likely already handled.

---

## 🧪 Validation Checklist

After implementation, verify:

- [ ] `sharp` is installed (`npm list sharp`)
- [ ] Next.js Image component converts images to AVIF/WebP (check Network tab)
- [ ] Schema validation passes: https://validator.schema.org/
- [ ] No duplicate meta tags (check HTML source)
- [ ] Canonical URLs are clean (no trailing slashes, no query params)
- [ ] Lighthouse SEO score ≥ 95
- [ ] LCP < 2.5s (mobile)
- [ ] CLS < 0.1
- [ ] All images use `<Image>` component (grep for `<img` in `/app/ai`)
- [ ] Cache-Control headers present (check Network tab for `/images/` and `/_next/image`)

---

## 📝 Files to Modify

1. `package.json` — Add `sharp` dependency
2. `next.config.js` — Add formats, cache headers, compress
3. `lib/seo.ts` — Add `generateArticleCollectionJsonLd`, `generateBreadcrumbListJsonLd`
4. `app/ai/page.tsx` — Add schemas, fix `<img>` → `<Image>`, optimize metadata
5. `app/ai/[slug]/page.tsx` — Add breadcrumbs, fix `<img>` → `<Image>`

**Total changes:** 5 files, ~150 lines (within your PR size limit)

---

## 🚀 Commands to Run

```bash
# 1. Install dependency
npm install sharp

# 2. Build to test
npm run build

# 3. Check for TypeScript errors
npm run lint

# 4. Test locally
npm run dev
```

---

## ✅ Success Criteria

- ✅ Lighthouse SEO score ≥ 95
- ✅ All schemas validate at validator.schema.org
- ✅ Images automatically convert to AVIF/WebP
- ✅ No duplicate meta tags
- ✅ Canonical URLs normalized
- ✅ Cache headers optimized
- ✅ Zero visible UI/copy changes

---

## 📌 Next Steps (After Phase 1)

Once Phase 1 is validated, proceed to **Phase 2** for content enhancements (FAQ additions, keyword optimization, CTA updates).

