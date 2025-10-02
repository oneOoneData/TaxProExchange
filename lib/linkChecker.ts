/**
 * Link health validation utility for TaxProExchange events
 * Validates URLs, follows redirects, extracts metadata, and scores link health
 */

export type LinkCheckResult = {
  finalUrl: string;
  status: number;
  redirectChain: string[];
  score: number;         // 0..100
  needsJs: boolean;      // true if SPA shell suspected
  canonical?: string | null;
  title?: string | null;
  error?: string;
};

const UA = "TaxProExchange/1.0 (+https://taxproexchange.com)";
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 5;

function normalizeTitle(html: string | null): string | null {
  if (!html) return null;
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  return m[1].replace(/\s+/g, " ").trim().toLowerCase();
}

function extractCanonical(html: string | null): string | null {
  if (!html) return null;
  const m = html.match(/rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function buildKeywords(title?: string | null, organizer?: string | null): string[] {
  const keywords: string[] = [];
  if (title) {
    // Extract meaningful words from title
    const words = title.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5); // Limit to most important words
    keywords.push(...words);
  }
  if (organizer) {
    const orgWords = organizer.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    keywords.push(...orgWords);
  }
  return keywords;
}

export async function checkUrl(url: string, keywords: string[] = []): Promise<LinkCheckResult> {
  let res: Response | null = null;
  let text: string | null = null;
  const redirectChain: string[] = [];
  let status = 0;
  let error: string | undefined;

  const headers = { 
    "User-Agent": UA, 
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1"
  };

  try {
    // Try HEAD first (faster, but some sites block it)
    try {
      res = await fetch(url, { 
        method: "HEAD", 
        redirect: "follow", 
        headers, 
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      status = res.status;
    } catch (headError) {
      // HEAD failed, try GET
      res = null;
    }

    if (!res || res.status >= 400 || !((res.headers.get("content-type") || "").includes("text"))) {
      // Fallback to GET for better content-type detection
      res = await fetch(url, { 
        method: "GET", 
        redirect: "follow", 
        headers,
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      status = res.status;
    }

    const finalUrl = res.url;
    const ct = res.headers.get("content-type") || "";
    const htmlLike = ct.includes("text/html") || ct.includes("text/plain");
    
    if (res.redirected) {
      redirectChain.push(finalUrl);
    }

    if (htmlLike && status < 400) {
      try {
        text = await res.text();
      } catch (textError) {
        // Text parsing failed, but we still have the response
        text = null;
      }
    }

    const title = normalizeTitle(text);
    const canonical = extractCanonical(text);

    // Scoring algorithm (more lenient for AI-generated events)
    let score = 0;
    
    // Base score from HTTP status
    if (status === 200 || status === 203) score += 50; // Increased from 40
    else if ([301, 302, 307, 308].includes(status)) score += 30; // Increased from 20
    else if (status === 404) score = 0;
    else if (status >= 400) score = Math.max(0, 30 - (status - 400) * 2);

    // Penalty for too many redirects (reduced)
    if (redirectChain.length > 0) {
      score -= Math.min(10, redirectChain.length * 2); // Reduced penalty
    }

    // Bonus for matching keywords in title (more generous)
    if (title && keywords.length > 0) {
      const titleMatches = keywords.filter(k => title.includes(k.toLowerCase()));
      if (titleMatches.length > 0) {
        score += Math.min(20, titleMatches.length * 8); // Reduced bonus but still helpful
      }
    }

    // Bonus for canonical URL
    if (canonical) {
      score += 10; // Reduced from 15
    }

    // Check for SPA shell (reduced penalty)
    const needsJs = htmlLike && (text ? text.length < 2000 && text.includes('id="root"') : true);
    if (needsJs) {
      score -= 5; // Reduced penalty
    }

    // Bonus for reasonable content length
    if (text && text.length > 1000) {
      score += 5;
    }

    // Clamp score to 0-100
    score = Math.max(0, Math.min(100, score));

    return { 
      finalUrl, 
      status, 
      redirectChain, 
      score, 
      needsJs, 
      canonical, 
      title 
    };

  } catch (fetchError) {
    error = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
    return {
      finalUrl: url,
      status: 0,
      redirectChain: [],
      score: 0,
      needsJs: false,
      canonical: null,
      title: null,
      error
    };
  }
}

/**
 * Attempts to heal common URL issues (404s, moved pages, etc.)
 */
export function healUrl(url: string): string {
  try {
    const u = new URL(url);
    
    // Remove common problematic query parameters
    const badParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
    badParams.forEach(param => u.searchParams.delete(param));
    
    // Remove hash fragments that might cause 404s
    u.hash = '';
    
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Checks if a URL should be considered a tombstone (permanently dead)
 */
export function shouldTombstone(status: number, redirectChain: string[], score: number): boolean {
  // Tombstone if:
  // 1. 404/410 and low score
  // 2. Too many redirects (likely redirect loop)
  // 3. Score is 0 and we've tried healing
  return (
    ([404, 410].includes(status) && score < 10) ||
    redirectChain.length >= MAX_REDIRECTS ||
    (status >= 500 && score < 5)
  );
}

/**
 * Extracts domain and path for tombstone tracking
 */
export function extractUrlParts(url: string): { domain: string; path: string } | null {
  try {
    const u = new URL(url);
    return {
      domain: u.hostname,
      path: u.pathname + u.search
    };
  } catch {
    return null;
  }
}
