import { createClient } from '@supabase/supabase-js';
import { chromium, Browser } from 'playwright';
import * as cheerio from 'cheerio';

// US State names mapping for normalization
const US_STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

// Normalize state to 2-letter code
function normalizeState(value: string | null | undefined): string | null {
  if (!value) return null;
  let state = value.trim();
  if (!state) return null;
  
  if (state.includes(',')) {
    state = state.split(',')[0].trim();
  }
  
  const upper = state.toUpperCase();
  
  // If it's already a 2-letter code, return it
  if (US_STATE_NAMES[upper]) {
    return upper;
  }
  
  // Try to find by full name
  const match = Object.entries(US_STATE_NAMES).find(
    ([, name]) => name.toUpperCase() === upper
  );
  
  return match ? match[0] : null;
}

// Normalize URL
function normalizeUrl(url: string): string {
  if (!url || url.trim() === '') return '';
  let normalized = url.trim().toLowerCase();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  normalized = normalized.replace(/\/$/, '');
  if (normalized === 'https://' || normalized === 'http://') return '';
  return normalized;
}

// Fetch HTML using Playwright
async function fetchHtml(url: string, browser: Browser): Promise<string> {
  const page = await browser.newPage();
  try {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
    } catch (timeoutError) {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 5000 });
    }
    await page.waitForTimeout(1500);
    const html = await page.content();
    return html;
  } finally {
    await page.close();
  }
}

// Parse location text to extract city and state
function parseLocationText(text: string): { city?: string; state?: string } {
  const patterns = [
    // "City, State" or "City, ST" (most common)
    /([A-Za-z\s]+),\s*([A-Z]{2}|[A-Za-z\s]+)/,
    // "City State" or "City ST" (no comma)
    /([A-Za-z\s]+)\s+([A-Z]{2}|[A-Za-z\s]+)$/,
    // "City, State Country" - extract just city and state
    /([A-Za-z\s]+),\s*([A-Z]{2}|[A-Za-z\s]+),\s*[A-Za-z\s]+/,
    // "City, State ZipCode" - extract city and state
    /([A-Za-z\s]+),\s*([A-Z]{2}|[A-Za-z\s]+)\s+\d{5}/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const city = match[1]?.trim();
      const state = match[2]?.trim();
      
      if (city && state && city.length > 1 && state.length > 1) {
        const cityWords = city.toLowerCase().split(' ');
        const invalidWords = ['hotel', 'convention', 'center', 'venue', 'location', 'address', 'office', 'suite'];
        const hasInvalidWord = cityWords.some(word => invalidWords.includes(word));
        
        if (!hasInvalidWord) {
          return { city, state };
        }
      }
    }
  }

  return {};
}

// Extract location from HTML
function extractLocationFromHtml(html: string): { city?: string; state?: string } | null {
  const $ = cheerio.load(html);
  const location: { city?: string; state?: string } = {};

  // Try multiple selectors for location/address
  const selectors = [
    'address',
    '[class*="address"]',
    '[class*="location"]',
    '[class*="contact"]',
    '[itemprop="address"]',
    '[itemprop="addressLocality"]',
    '.address',
    '.location',
    '.contact-info',
    '.office-location',
    'footer address',
    'footer [class*="address"]'
  ];

  // First, try specific selectors
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length) {
      const text = element.text().trim();
      if (text) {
        const parsed = parseLocationText(text);
        if (parsed.city && parsed.state) {
          location.city = parsed.city;
          location.state = parsed.state;
          break;
        }
      }
    }
  }

  // If not found, search entire page text for location patterns
  if (!location.city || !location.state) {
    const bodyText = $('body').text() || $.root().text();
    
    // Look for common address patterns in the text
    const locationMatches = bodyText.match(/([A-Za-z\s]+),\s*([A-Z]{2}|[A-Za-z\s]+)(?:\s+\d{5})?/g);
    
    if (locationMatches) {
      for (const match of locationMatches) {
        const parsed = parseLocationText(match);
        if (parsed.city && parsed.state && parsed.city.length > 2) {
          // Validate it's not a venue name
          const cityWords = parsed.city.toLowerCase().split(' ');
          const invalidWords = ['hotel', 'convention', 'center', 'venue', 'location', 'address'];
          const hasInvalidWord = cityWords.some(word => invalidWords.includes(word));
          
          if (!hasInvalidWord) {
            location.city = parsed.city;
            location.state = parsed.state;
            break;
          }
        }
      }
    }
  }

  return (location.city && location.state) ? location : null;
}

// Enrich locations for profiles missing city/state
export async function enrichLocations(): Promise<{ updated: number; skipped: number; errors: string[] }> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const startTime = Date.now();
  const errors: string[] = [];
  let updated = 0;
  let skipped = 0;
  const domainsVisited: string[] = [];

  console.log('🔍 [enrichLocations] Starting location enrichment...');

  // Fetch profiles missing city or state in primary_location
  // Query for profiles where primary_location is null, or city is null, or state is null
  const { data: profiles, error: fetchError } = await supabase
    .from('profiles')
    .select('id, website_url, primary_location, firm_name, first_name, last_name')
    .eq('is_listed', true)
    .not('website_url', 'is', null)
    .or('primary_location.is.null,primary_location->>city.is.null,primary_location->>state.is.null');

  if (fetchError) {
    console.error('❌ [enrichLocations] Error fetching profiles:', fetchError);
    throw new Error(`Failed to fetch profiles: ${fetchError.message}`);
  }

  if (!profiles || profiles.length === 0) {
    console.log('✅ [enrichLocations] No profiles need location enrichment');
    return { updated: 0, skipped: 0, errors: [] };
  }

  console.log(`🔍 [enrichLocations] Found ${profiles.length} profiles to check`);

  // Launch browser
  const browser = await chromium.launch({ headless: true });

  try {
    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      const websiteUrl = profile.website_url;

      if (!websiteUrl) {
        skipped++;
        continue;
      }

      const normalizedUrl = normalizeUrl(websiteUrl);
      if (!normalizedUrl) {
        skipped++;
        continue;
      }

      // Check if we already have location data (handle normalized format)
      const currentLocation = profile.primary_location;
      if (currentLocation) {
        let hasCity = false;
        let hasState = false;
        
        // Handle both object format and string format (for edge cases)
        if (typeof currentLocation === 'object' && !Array.isArray(currentLocation)) {
          hasCity = currentLocation.city && String(currentLocation.city).trim() !== '';
          hasState = currentLocation.state && String(currentLocation.state).trim() !== '';
        } else if (typeof currentLocation === 'string') {
          try {
            const parsed = JSON.parse(currentLocation);
            hasCity = parsed.city && String(parsed.city).trim() !== '';
            hasState = parsed.state && String(parsed.state).trim() !== '';
          } catch {
            // Invalid JSON, treat as missing
          }
        }
        
        if (hasCity && hasState) {
          skipped++;
          continue;
        }
      }

      try {
        console.log(`🔍 [enrichLocations] Processing ${i + 1}/${profiles.length}: ${profile.firm_name || `${profile.first_name} ${profile.last_name}`} - ${normalizedUrl}`);
        domainsVisited.push(normalizedUrl);

        // Fetch website HTML
        const html = await fetchHtml(normalizedUrl, browser);

        // Extract location
        const extracted = extractLocationFromHtml(html);

        if (extracted && extracted.city && extracted.state) {
          // Normalize state to 2-letter code
          const normalizedState = normalizeState(extracted.state);
          
          if (normalizedState) {
            // Build normalized primary_location object (lowercase keys, consistent format)
            const newLocation = {
              city: extracted.city.trim(),
              state: normalizedState,
              country: 'US',
              display_name: null
            };

            // Update profile
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ primary_location: newLocation })
              .eq('id', profile.id);

            if (updateError) {
              console.error(`❌ [enrichLocations] Error updating profile ${profile.id}:`, updateError);
              errors.push(`${profile.id}: ${updateError.message}`);
            } else {
              updated++;
              console.log(`✅ [enrichLocations] Updated ${profile.id}: ${extracted.city}, ${normalizedState}`);
            }
          } else {
            skipped++;
            console.log(`⚠️ [enrichLocations] Could not normalize state "${extracted.state}" for profile ${profile.id}`);
          }
        } else {
          skipped++;
          console.log(`⚠️ [enrichLocations] No location found on ${normalizedUrl}`);
        }

        // Delay between requests (700-800ms)
        if (i < profiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 750));
        }
      } catch (error) {
        skipped++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ [enrichLocations] Error processing ${normalizedUrl}:`, errorMsg);
        errors.push(`${normalizedUrl}: ${errorMsg}`);
      }
    }
  } finally {
    await browser.close();
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ [enrichLocations] Complete in ${duration}s - Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors.length}`);
  console.log(`🔍 [enrichLocations] Domains visited: ${domainsVisited.length}`);

  return { updated, skipped, errors };
}

