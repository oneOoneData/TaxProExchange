/**
 * SEO configuration and utilities for TaxProExchange
 */

export const siteUrl = 'https://www.taxproexchange.com';
export const defaultTitle = 'Find Verified CPAs, EAs, and Tax Preparers – TaxProExchange';
export const defaultDescription = 'A trusted directory where CPAs, EAs, and CTEC preparers connect for referrals, overflow work, and representation. Free to join during beta.';

/**
 * Generate absolute canonical URL for a given pathname
 */
export function absoluteCanonical(pathname: string): string {
  // Ensure pathname starts with / and handle root case
  const normalizedPath = pathname === '/' ? '' : pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${siteUrl}${normalizedPath}`;
}

/**
 * Legacy export for existing components
 */
export const absoluteCanonicalFromPath = absoluteCanonical;

/**
 * Generate page title with site suffix
 */
export function generateTitle(pageTitle?: string): string {
  if (!pageTitle) return defaultTitle;
  return `${pageTitle} – TaxProExchange`;
}

/**
 * Generate page description with fallback
 */
export function generateDescription(pageDescription?: string): string {
  return pageDescription || defaultDescription;
}

/**
 * Generate OpenGraph image URL
 */
export function generateOgImage(imagePath?: string): string {
  if (!imagePath) return `${siteUrl}/og-image.png`;
  return imagePath.startsWith('http') ? imagePath : `${siteUrl}${imagePath}`;
}

/**
 * Generate JSON-LD for Organization schema
 */
export function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TaxProExchange",
    "url": siteUrl,
    "logo": `${siteUrl}/logo-black.png`,
    "sameAs": [
      "https://www.linkedin.com/company/taxproexchange"
    ]
  };
}

/**
 * Generate JSON-LD for WebSite with SearchAction schema
 */
export function generateWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": `${siteUrl}/`,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

/**
 * Legacy exports for existing components
 */
export const getOrganizationJsonLd = generateOrganizationJsonLd;
export const getWebsiteJsonLd = generateWebSiteJsonLd;

/**
 * Generate JSON-LD for ProfessionalService schema
 */
export function generateProfessionalServiceJsonLd(profile: {
  firstName: string;
  lastName: string;
  credentialType: string;
  slug: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  states?: string[];
  linkedinUrl?: string;
  firmName?: string;
}) {
  const name = `${profile.firstName} ${profile.lastName}, ${profile.credentialType}`;
  const url = `${siteUrl}/p/${profile.slug}`;
  const description = profile.headline || profile.bio || `Professional ${profile.credentialType} services`;
  
  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": name,
    "url": url,
    "description": description.substring(0, 160), // Limit description length
  };

  // Add image if available
  if (profile.avatarUrl) {
    jsonLd.image = profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `${siteUrl}${profile.avatarUrl}`;
  }

  // Add service areas
  if (profile.states && profile.states.length > 0) {
    jsonLd.areaServed = profile.states;
  }

  // Add LinkedIn if available
  if (profile.linkedinUrl) {
    jsonLd.sameAs = [profile.linkedinUrl];
  }

  // Add brand/organization if firm exists
  if (profile.firmName) {
    jsonLd.brand = {
      "@type": "Organization",
      "name": profile.firmName
    };
  }

  return jsonLd;
}

/**
 * Generate JSON-LD for BreadcrumbList schema
 */
export function generateBreadcrumbJsonLd(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((breadcrumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": breadcrumb.name,
      "item": breadcrumb.url
    }))
  };
}

/**
 * Generate JSON-LD for FAQPage schema
 */
export function generateFaqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

/**
 * Helper function to safely stringify JSON-LD
 */
export function jsonLd(obj: unknown) {
  return { __html: JSON.stringify(obj) };
}

/**
 * Generate JSON-LD for ProfessionalService schema (enhanced version)
 */
export function professionalServiceLD(p: {
  slug: string;
  first_name: string;
  last_name: string;
  credential_type: string;
  bio?: string | null;
  avatar_url?: string | null;
  locations?: { state?: string | null; city?: string | null }[];
  headline?: string | null;
  firm_name?: string | null;
  linkedin_url?: string | null;
}) {
  const areaServed = (p.locations ?? [])
    .map(l => l?.state)
    .filter(Boolean);
  
  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: `${p.first_name} ${p.last_name}, ${p.credential_type}`,
    description: p.bio ?? p.headline ?? `${p.first_name} ${p.last_name} is a verified ${p.credential_type} on TaxProExchange.`,
    url: `${siteUrl}/p/${p.slug}`,
  };

  if (p.avatar_url) {
    jsonLd.image = p.avatar_url.startsWith('http') ? p.avatar_url : `${siteUrl}${p.avatar_url}`;
  }

  if (areaServed.length > 0) {
    jsonLd.areaServed = areaServed;
  }

  if (p.linkedin_url) {
    jsonLd.sameAs = [p.linkedin_url];
  }

  if (p.firm_name) {
    jsonLd.brand = {
      '@type': 'Organization',
      name: p.firm_name
    };
  }

  return jsonLd;
}

/**
 * Generate JSON-LD for WebSite with SearchAction (enhanced version)
 */
export function websiteSearchLD() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TaxProExchange',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/search?q={query}`,
      'query-input': 'required name=query'
    }
  };
}

/**
 * Generate JSON-LD for BreadcrumbList schema
 */
export function breadcrumbsLD(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: it.url
    }))
  };
}

/**
 * Generate site-wide ProfessionalService JSON-LD for TaxProExchange
 */
export function siteProfessionalServiceLD() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'TaxProExchange',
    url: siteUrl,
    description: defaultDescription,
    logo: `${siteUrl}/logo-black.png`,
    founder: {
      '@type': 'Person',
      name: 'TaxProExchange Team'
    },
    sameAs: [
      'https://www.linkedin.com/company/taxproexchange'
    ]
  };
}

/**
 * Generate Person JSON-LD for individual tax professional profiles
 */
export function personLD(p: {
  slug: string;
  first_name: string;
  last_name: string;
  credential_type: string;
  bio?: string | null;
  avatar_url?: string | null;
  headline?: string | null;
  firm_name?: string | null;
  linkedin_url?: string | null;
  website_url?: string | null;
}) {
  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: `${p.first_name} ${p.last_name}`,
    jobTitle: p.credential_type,
    url: `${siteUrl}/p/${p.slug}`,
  };

  if (p.bio || p.headline) {
    jsonLd.description = p.bio ?? p.headline;
  }

  if (p.avatar_url) {
    jsonLd.image = p.avatar_url.startsWith('http') ? p.avatar_url : `${siteUrl}${p.avatar_url}`;
  }

  if (p.firm_name) {
    jsonLd.worksFor = {
      '@type': 'Organization',
      name: p.firm_name
    };
  }

  // Add sameAs for LinkedIn and website if provided
  const sameAs = [];
  if (p.linkedin_url) sameAs.push(p.linkedin_url);
  if (p.website_url) sameAs.push(p.website_url);
  if (sameAs.length > 0) {
    jsonLd.sameAs = sameAs;
  }

  return jsonLd;
}