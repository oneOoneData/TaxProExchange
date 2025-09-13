/**
 * SEO utilities for the marketing site
 */

/**
 * Generate absolute canonical URL for the marketing site
 * @param pathname - The pathname from usePathname() or similar
 * @returns Absolute canonical URL
 */
export function absoluteCanonicalFromPath(pathname: string): string {
  const baseUrl = 'https://www.taxproexchange.com';
  
  // Ensure pathname starts with /
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  
  // Remove trailing slash except for root
  const finalPath = cleanPath === '/' ? '/' : cleanPath.replace(/\/$/, '');
  
  return `${baseUrl}${finalPath}`;
}

/**
 * Generate JSON-LD structured data for Organization
 */
export function getOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TaxProExchange',
    url: 'https://www.taxproexchange.com',
    description: 'A trusted directory for CPAs, EAs, and CTEC preparers to find each other for handoffs, overflow work, and representation.',
    sameAs: [
      // Add social media URLs when available
      // 'https://linkedin.com/company/taxproexchange',
      // 'https://twitter.com/taxproexchange',
    ],
  };
}

/**
 * Generate JSON-LD structured data for Website
 */
export function getWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TaxProExchange',
    url: 'https://www.taxproexchange.com',
    description: 'A trusted directory for CPAs, EAs, and CTEC preparers to find each other for handoffs, overflow work, and representation.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.taxproexchange.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
