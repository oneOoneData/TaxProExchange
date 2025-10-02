import { JSDOM } from 'jsdom';

export interface ScrapedEventData {
  title?: string;
  description?: string;
  locationCity?: string;
  locationState?: string;
  organizer?: string;
  startDate?: string;
  endDate?: string;
  success: boolean;
  error?: string;
}

export async function scrapeEventFromUrl(url: string): Promise<ScrapedEventData> {
  try {
    // Validate URL
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { success: false, error: 'Invalid URL protocol' };
    }

    // Fetch the page with timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TaxProExchange/1.0; +https://taxproexchange.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { 
        success: false, 
        error: `Failed to fetch page: ${response.status} ${response.statusText}` 
      };
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract data using multiple strategies
    const scrapedData: ScrapedEventData = { success: true };

    // Extract title
    scrapedData.title = extractTitle(document);
    
    // Extract description
    scrapedData.description = extractDescription(document);
    
    // Extract location
    const location = extractLocation(document);
    scrapedData.locationCity = location.city;
    scrapedData.locationState = location.state;
    
    // Extract organizer
    scrapedData.organizer = extractOrganizer(document);
    
    // Extract dates
    const dates = extractDates(document);
    scrapedData.startDate = dates.startDate;
    scrapedData.endDate = dates.endDate;

    return scrapedData;

  } catch (error) {
    console.error('Error scraping URL:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

function extractTitle(document: Document): string | undefined {
  // Try multiple selectors for title, prioritizing more specific ones
  const selectors = [
    // Very specific event title selectors
    'h1.event-title',
    'h1.event-name',
    'h1.conference-title',
    'h1.conference-name',
    '.event-title h1',
    '.event-name h1',
    '.conference-title h1',
    '.conference-name h1',
    
    // Common title patterns
    '[data-testid*="title"]',
    '[data-testid*="event-title"]',
    '[data-testid*="conference-title"]',
    '[class*="event-title"]',
    '[class*="event-name"]',
    '[class*="conference-title"]',
    '[class*="conference-name"]',
    '[class*="event-heading"]',
    '[class*="event-header"]',
    
    // Generic but specific classes
    '.event-title',
    '.event-name',
    '.conference-title',
    '.conference-name',
    '.event-heading',
    '.event-header',
    '.hero-title',
    '.page-title',
    
    // Generic selectors (last resort)
    'h1',
    'title'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent?.trim()) {
      const title = element.textContent.trim();
      // Filter out very short or generic titles
      if (title.length > 5 && !title.toLowerCase().includes('home') && !title.toLowerCase().includes('welcome')) {
        return title;
      }
    }
  }

  return undefined;
}

function extractDescription(document: Document): string | undefined {
  // Try multiple selectors for description
  const selectors = [
    '[data-testid*="description"]',
    '[class*="description"]',
    '[class*="event-description"]',
    '[class*="about"]',
    '.event-description',
    '.description',
    '.about',
    '.summary',
    'meta[name="description"]'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent?.trim() || element.getAttribute('content')?.trim();
      if (text && text.length > 20) { // Only return substantial descriptions
        return text.slice(0, 4000); // Limit length
      }
    }
  }

  return undefined;
}

function extractLocation(document: Document): { city?: string; state?: string } {
  const location: { city?: string; state?: string } = {};

  // Try multiple selectors for location, including text content search
  const selectors = [
    '[data-testid*="location"]',
    '[data-testid*="venue"]',
    '[class*="location"]',
    '[class*="venue"]',
    '[class*="address"]',
    '[class*="where"]',
    '.location',
    '.venue',
    '.address',
    '.event-location',
    '.conference-location',
    '.event-venue'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent?.trim()) {
      const locationText = element.textContent.trim();
      
      // Try to parse city and state
      const parsed = parseLocationText(locationText);
      if (parsed.city) location.city = parsed.city;
      if (parsed.state) location.state = parsed.state;
      
      if (location.city && location.state) break;
    }
  }

  // If not found with selectors, search for location patterns in the entire document
  if (!location.city || !location.state) {
    const bodyText = document.body.textContent || '';
    const locationMatch = bodyText.match(/([A-Za-z\s]+),\s*([A-Z]{2}|[A-Za-z\s]+)(?:\s+\d{5})?/g);
    
    if (locationMatch) {
      for (const match of locationMatch) {
        const parsed = parseLocationText(match);
        if (parsed.city && parsed.state && parsed.city.length > 2) {
          location.city = parsed.city;
          location.state = parsed.state;
          break;
        }
      }
    }
  }

  return location;
}

function parseLocationText(text: string): { city?: string; state?: string } {
  // Common patterns for location parsing
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
      
      // Validate city and state
      if (city && state && city.length > 1 && state.length > 1) {
        // Filter out common non-city words
        const cityWords = city.toLowerCase().split(' ');
        const invalidWords = ['hotel', 'convention', 'center', 'venue', 'location', 'address'];
        const hasInvalidWord = cityWords.some(word => invalidWords.includes(word));
        
        if (!hasInvalidWord) {
          return { city, state };
        }
      }
    }
  }

  // If no pattern matches, try to extract just the first part as city
  const firstPart = text.split(',')[0]?.trim();
  if (firstPart && firstPart.length > 1) {
    // Check if it looks like a city name (not a venue name)
    const cityWords = firstPart.toLowerCase().split(' ');
    const invalidWords = ['hotel', 'convention', 'center', 'venue', 'location', 'address'];
    const hasInvalidWord = cityWords.some(word => invalidWords.includes(word));
    
    if (!hasInvalidWord) {
      return { city: firstPart };
    }
  }

  return {};
}

function extractOrganizer(document: Document): string | undefined {
  // Try multiple selectors for organizer
  const selectors = [
    '[data-testid*="organizer"]',
    '[data-testid*="host"]',
    '[class*="organizer"]',
    '[class*="host"]',
    '[class*="sponsor"]',
    '[class*="presented-by"]',
    '.organizer',
    '.host',
    '.sponsor',
    '.presented-by',
    '.event-organizer',
    '.conference-organizer'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent?.trim()) {
      return element.textContent.trim();
    }
  }

  return undefined;
}

function extractDates(document: Document): { startDate?: string; endDate?: string } {
  const dates: { startDate?: string; endDate?: string } = {};

  // Try multiple selectors for dates
  const selectors = [
    '[data-testid*="date"]',
    '[data-testid*="when"]',
    '[class*="date"]',
    '[class*="start-date"]',
    '[class*="end-date"]',
    '[class*="event-date"]',
    '[class*="when"]',
    '.date',
    '.start-date',
    '.end-date',
    '.event-date',
    '.conference-date',
    '.event-when'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent?.trim()) {
      const dateText = element.textContent.trim();
      
      // Try to parse dates
      const parsed = parseDateText(dateText);
      if (parsed.startDate) dates.startDate = parsed.startDate;
      if (parsed.endDate) dates.endDate = parsed.endDate;
      
      if (dates.startDate) break; // Found at least start date
    }
  }

  // If not found with selectors, search for date patterns in the entire document
  if (!dates.startDate) {
    const bodyText = document.body.textContent || '';
    
    // Look for date patterns like "5/17/2026 to 5/20/2026" or "May 17-20, 2026"
    const datePatterns = [
      // "M/D/YYYY to M/D/YYYY" or "MM/DD/YYYY to MM/DD/YYYY"
      /(\d{1,2}\/\d{1,2}\/\d{4})\s+to\s+(\d{1,2}\/\d{1,2}\/\d{4})/,
      // "M/D/YYYY - M/D/YYYY" or "MM/DD/YYYY - MM/DD/YYYY"
      /(\d{1,2}\/\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})/,
      // "Month DD-DD, YYYY"
      /([A-Za-z]+)\s+(\d{1,2})-(\d{1,2}),\s+(\d{4})/,
      // "Month DD, YYYY to Month DD, YYYY"
      /([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})\s+to\s+([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/,
      // Single date patterns
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/
    ];

    for (const pattern of datePatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        const parsed = parseDateText(match[0]);
        if (parsed.startDate) {
          dates.startDate = parsed.startDate;
          if (parsed.endDate) dates.endDate = parsed.endDate;
          break;
        }
      }
    }
  }

  return dates;
}

function parseDateText(text: string): { startDate?: string; endDate?: string } {
  // Common date patterns - ordered by specificity
  const patterns = [
    // "M/D/YYYY to M/D/YYYY" (like "5/17/2026 to 5/20/2026")
    /(\d{1,2}\/\d{1,2}\/\d{4})\s+to\s+(\d{1,2}\/\d{1,2}\/\d{4})/,
    // "M/D/YYYY - M/D/YYYY"
    /(\d{1,2}\/\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})/,
    // "MM/DD/YYYY to MM/DD/YYYY"
    /(\d{2}\/\d{2}\/\d{4})\s+to\s+(\d{2}\/\d{2}\/\d{4})/,
    // "MM/DD/YYYY - MM/DD/YYYY"
    /(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})/,
    // "Month DD-DD, YYYY" (like "May 17-20, 2026")
    /([A-Za-z]+)\s+(\d{1,2})-(\d{1,2}),\s+(\d{4})/,
    // "Month DD, YYYY to Month DD, YYYY"
    /([A-Za-z]+\s+\d{1,2},\s+\d{4})\s+to\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/,
    // "Month DD, YYYY - Month DD, YYYY"
    /([A-Za-z]+\s+\d{1,2},\s+\d{4})\s*-\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/,
    // Single date "M/D/YYYY" or "MM/DD/YYYY"
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    // Single date "Month DD, YYYY"
    /([A-Za-z]+\s+\d{1,2},\s+\d{4})/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[0].includes('to') || match[0].includes('-')) {
        // Two dates found
        if (pattern.source.includes('\\d{1,2}-\\d{1,2}')) {
          // Handle "May 17-20, 2026" format
          const month = match[1];
          const startDay = match[2];
          const endDay = match[3];
          const year = match[4];
          return {
            startDate: formatDate(`${month} ${startDay}, ${year}`),
            endDate: formatDate(`${month} ${endDay}, ${year}`)
          };
        } else {
          return {
            startDate: formatDate(match[1]),
            endDate: formatDate(match[2])
          };
        }
      } else {
        // Single date found
        return {
          startDate: formatDate(match[1])
        };
      }
    }
  }

  return {};
}

function formatDate(dateStr: string): string | undefined {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return undefined;
    
    // Return in ISO format
    return date.toISOString();
  } catch {
    return undefined;
  }
}
