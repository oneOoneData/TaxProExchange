import { chromium, Browser, Page } from 'playwright';
import * as cheerio from 'cheerio';
import { createServerClient } from '@/lib/supabase/server';

// Normalize URL to ensure proper format
export function normalizeUrl(url: string): string {
  if (!url) return '';
  let normalized = url.trim().toLowerCase();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');
  return normalized;
}

// Check if a path is allowed by robots.txt
export async function isAllowedByRobots(domainUrl: string, candidatePath: string): Promise<boolean> {
  try {
    const robotsUrl = new URL('/robots.txt', domainUrl).href;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(robotsUrl, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) {
      // No robots.txt found, allow by default
      return true;
    }
    
    const robotsTxt = await response.text();
    const lines = robotsTxt.split('\n');
    let isUserAgentAll = false;
    
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      
      if (trimmed.startsWith('user-agent:')) {
        isUserAgentAll = trimmed.includes('*');
      }
      
      if (isUserAgentAll && trimmed.startsWith('disallow:')) {
        const disallowPath = trimmed.substring('disallow:'.length).trim();
        if (disallowPath && candidatePath.startsWith(disallowPath)) {
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    // On error, allow by default
    return true;
  }
}

// Discover candidate team/about URLs
export function discoverTeamUrls(baseUrl: string, homepage$?: ReturnType<typeof cheerio.load>): string[] {
  const candidates = [
    '/team',
    '/our-team',
    '/who-we-are',
    '/about',
    '/about-us',
    '/staff',
    '/leadership',
    '/company',
    '/meet-the-team',
    '/people'
  ];
  
  const discovered = new Set<string>(candidates);
  
  // Parse homepage for additional team-related links
  if (homepage$) {
    homepage$('a[href]').each((_, el) => {
      const href = homepage$(el).attr('href');
      if (!href) return;
      
      const text = homepage$(el).text().toLowerCase();
      const hrefLower = href.toLowerCase();
      
      const keywords = ['team', 'staff', 'about', 'who we are', 'leadership', 'people', 'company', 'our firm'];
      
      if (keywords.some(k => text.includes(k) || hrefLower.includes(k))) {
        try {
          const url = new URL(href, baseUrl);
          if (url.origin === new URL(baseUrl).origin) {
            discovered.add(url.pathname);
          }
        } catch {
          // Invalid URL, skip
        }
      }
    });
  }
  
  return Array.from(discovered);
}

// Fetch HTML using Playwright
export async function fetchHtml(url: string, browser: Browser): Promise<string> {
  let page: Page | null = null;
  try {
    page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    
    // Wait a bit for JS to render
    await page.waitForTimeout(3000);
    
    const html = await page.content();
    return html;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  } finally {
    if (page) {
      await page.close();
    }
  }
}

// Extract people count from HTML
export function extractPeopleCount(html: string): { count: number; sampleNames: string[] } {
  const $ = cheerio.load(html);
  const names = new Set<string>();
  
  // Look for common selectors
  const selectors = [
    '[itemprop="name"]',
    '.team-member',
    '.staff-member',
    '.team',
    '.staff',
    '.member',
    '.profile',
    '.person',
    '.bio',
    '.employee'
  ];
  
  selectors.forEach(selector => {
    $(selector).each((_, el) => {
      const text = $(el).text().trim();
      const name = extractPersonName(text);
      if (name) names.add(name);
    });
  });
  
  // Look for name patterns in headers and strong tags
  $('h1, h2, h3, h4, strong, .name, .card-title').each((_, el) => {
    const text = $(el).text().trim();
    const name = extractPersonName(text);
    if (name) names.add(name);
  });
  
  return {
    count: names.size,
    sampleNames: Array.from(names).slice(0, 5)
  };
}

// Extract a person name from text (2-4 capitalized words)
function extractPersonName(text: string): string | null {
  // Remove extra whitespace
  text = text.trim().replace(/\s+/g, ' ');
  
  // Skip if too long (likely a paragraph)
  if (text.length > 60) return null;
  
  // Match 2-4 capitalized words with possible middle initials
  const namePattern = /^([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+)+[A-Z][a-z]+$/;
  
  if (namePattern.test(text)) {
    const words = text.split(/\s+/);
    
    // Skip all-caps (likely headers like "OUR TEAM")
    if (words.every(w => w === w.toUpperCase())) return null;
    
    // Skip single words
    if (words.length < 2) return null;
    
    // Skip very long names (likely titles)
    if (words.length > 5) return null;
    
    // Skip common non-names
    const nonNames = ['Tax Preparation', 'Tax Planning', 'Bookkeeping', 'Payroll', 'Our Team', 'Meet Team'];
    if (nonNames.some(nn => text.includes(nn))) return null;
    
    return text;
  }
  
  return null;
}

// Extract specialties from HTML
export function extractSpecialties(html: string): string[] {
  const $ = cheerio.load(html);
  const text = $('body').text().toLowerCase();
  
  const specialtyKeywords: Record<string, string[]> = {
    'Bookkeeping': ['bookkeeping', 'books', 'accounting services'],
    'Payroll': ['payroll', 'payroll services'],
    'Tax Preparation': ['tax preparation', 'tax prep', 'individual tax', 'business tax'],
    'Tax Planning': ['tax planning', 'tax strategy', 'strategic tax'],
    'Sales Tax': ['sales tax', 'sales and use tax'],
    'SALT': ['salt', 'state and local tax'],
    'IRS Representation': ['irs representation', 'tax controversy', 'audit defense', 'audit representation'],
    'Fractional CFO': ['fractional cfo', 'outsourced cfo', 'part-time cfo'],
    'Real Estate': ['real estate', 'real estate tax', 'property tax'],
    'Construction': ['construction', 'construction tax', 'contractors'],
    'Ecommerce': ['ecommerce', 'e-commerce', 'online business'],
    'Cryptocurrency': ['crypto', 'cryptocurrency', 'bitcoin', 'digital assets'],
    'R&D Tax Credit': ['r&d credit', 'r&d tax credit', 'research credit'],
    'Cost Segregation': ['cost segregation', 'cost seg'],
    'Estate Planning': ['estate planning', 'estate tax', 'trust planning'],
    'Financial Planning': ['financial planning', 'wealth management', 'investment']
  };
  
  const found = new Set<string>();
  
  for (const [specialty, keywords] of Object.entries(specialtyKeywords)) {
    if (keywords.some(k => text.includes(k))) {
      found.add(specialty);
    }
  }
  
  return Array.from(found);
}

// Score confidence level
export function scoreConfidence(params: { count: number; urlFound: string; isTeamPage: boolean }): string {
  const { count, urlFound, isTeamPage } = params;
  
  if (count >= 3 && isTeamPage) {
    return 'High';
  } else if (count >= 1 || isTeamPage) {
    return 'Medium';
  } else {
    return 'Low';
  }
}

// Check if URL is a team-related page
function isTeamRelatedUrl(url: string): boolean {
  const teamKeywords = ['team', 'staff', 'leadership', 'people', 'who-we-are', 'our-team'];
  return teamKeywords.some(k => url.toLowerCase().includes(k));
}

// Enrich a single profile
export async function enrichOne(profile: { id: string; website_url: string }, browser: Browser): Promise<{
  id: string;
  updated: boolean;
  reason?: string;
  team_size_verified?: string;
  team_page_url?: string;
  specialty_verified?: string;
  confidence_level?: string;
}> {
  try {
    const websiteUrl = normalizeUrl(profile.website_url);
    if (!websiteUrl) {
      return { id: profile.id, updated: false, reason: 'No website URL' };
    }
    
    // Fetch homepage first
    let homepageHtml: string;
    try {
      homepageHtml = await fetchHtml(websiteUrl, browser);
    } catch (error) {
      return { id: profile.id, updated: false, reason: 'Failed to fetch homepage' };
    }
    
    const homepage$ = cheerio.load(homepageHtml);
    
    // Discover candidate team URLs
    const candidates = discoverTeamUrls(websiteUrl, homepage$);
    
    let bestResult: {
      people: { count: number; sampleNames: string[] };
      specs: string[];
      url: string;
    } | null = null;
    
    // Try each candidate URL
    for (const candidatePath of candidates) {
      const candidateUrl = new URL(candidatePath, websiteUrl).href;
      
      // Check robots.txt
      const allowed = await isAllowedByRobots(websiteUrl, candidatePath);
      if (!allowed) {
        console.log(`Skipping ${candidateUrl} (robots.txt disallow)`);
        continue;
      }
      
      try {
        const html = await fetchHtml(candidateUrl, browser);
        const people = extractPeopleCount(html);
        const specs = extractSpecialties(html);
        
        // If we found people, use this result
        if (people.count > 0) {
          bestResult = { people, specs, url: candidateUrl };
          break;
        }
        
        // Otherwise, keep the first result with specialties
        if (!bestResult && specs.length > 0) {
          bestResult = { people, specs, url: candidateUrl };
        }
      } catch (error) {
        console.log(`Failed to fetch ${candidateUrl}:`, error);
        continue;
      }
    }
    
    // If no candidate worked, try homepage
    if (!bestResult) {
      const people = extractPeopleCount(homepageHtml);
      const specs = extractSpecialties(homepageHtml);
      bestResult = { people, specs, url: websiteUrl };
    }
    
    // Calculate confidence
    const isTeamPage = isTeamRelatedUrl(bestResult.url);
    const confidence = scoreConfidence({
      count: bestResult.people.count,
      urlFound: bestResult.url,
      isTeamPage
    });
    
    // Update database
    const supabase = createServerClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        team_size_verified: bestResult.people.count > 0 ? bestResult.people.count.toString() : null,
        team_page_url: bestResult.url !== websiteUrl ? bestResult.url : null,
        specialty_verified: bestResult.specs.length > 0 ? bestResult.specs.join(', ') : null,
        confidence_level: confidence,
        last_verified_on: new Date().toISOString().split('T')[0]
      })
      .eq('id', profile.id);
    
    if (error) {
      return { id: profile.id, updated: false, reason: `DB error: ${error.message}` };
    }
    
    return {
      id: profile.id,
      updated: true,
      team_size_verified: bestResult.people.count > 0 ? bestResult.people.count.toString() : undefined,
      team_page_url: bestResult.url !== websiteUrl ? bestResult.url : undefined,
      specialty_verified: bestResult.specs.length > 0 ? bestResult.specs.join(', ') : undefined,
      confidence_level: confidence
    };
  } catch (error) {
    return {
      id: profile.id,
      updated: false,
      reason: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Enrich multiple profiles with concurrency control
export async function enrichProfiles(
  profiles: Array<{ id: string; website_url: string }>,
  concurrency: number = 4
): Promise<{
  total: number;
  attempted: number;
  updated: number;
  skipped: number;
  errors: Array<{ id: string; reason: string }>;
}> {
  const browser = await chromium.launch({ headless: true });
  
  try {
    const results: Awaited<ReturnType<typeof enrichOne>>[] = [];
    
    // Process in batches with concurrency limit
    for (let i = 0; i < profiles.length; i += concurrency) {
      const batch = profiles.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(profile => enrichOne(profile, browser))
      );
      results.push(...batchResults);
    }
    
    const updated = results.filter(r => r.updated).length;
    const skipped = results.filter(r => !r.updated && r.reason?.includes('No website')).length;
    const errors = results.filter(r => !r.updated && !r.reason?.includes('No website'))
      .map(r => ({ id: r.id, reason: r.reason || 'Unknown error' }));
    
    return {
      total: profiles.length,
      attempted: profiles.length,
      updated,
      skipped,
      errors
    };
  } finally {
    await browser.close();
  }
}

