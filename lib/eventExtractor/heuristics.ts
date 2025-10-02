import * as cheerio from "cheerio";
import chrono from "chrono-node";
import { EventPayload } from "./types";

export function extractByHeuristics(html: string, finalUrl: string): Partial<EventPayload> {
  const $ = cheerio.load(html);

  // Better title extraction
  const title = $("h1").first().text().trim() || $("title").first().text().trim();

  // Grab likely event blurb - try multiple selectors
  const descriptionSelectors = [
    'main p',
    '.event-description p',
    '.description p',
    '.content p',
    'p'
  ];
  
  let firstPara = '';
  for (const selector of descriptionSelectors) {
    firstPara = $(selector).first().text().trim();
    if (firstPara && firstPara.length > 50) break;
  }

  // Find date ranges in page text using chrono
  const bodyText = $("main").text() || $.root().text();
  const parsed = chrono.parse(bodyText, new Date(), { forwardDate: true });
  let startsAt: string | undefined;
  let endsAt: string | undefined;
  
  if (parsed?.length) {
    const range = parsed.find(p => p.end) || parsed[0];
    const s = range.start?.date();
    const e = (range as any).end?.date?.();
    startsAt = s?.toISOString();
    endsAt = e?.toISOString();
  }

  // Location hints - try multiple selectors
  const locationSelectors = [
    'address',
    '[class*="venue"]',
    '[class*="location"]',
    '[class*="where"]',
    '[data-testid*="location"]',
    '[data-testid*="venue"]'
  ];
  
  let locText = '';
  for (const selector of locationSelectors) {
    locText = $(selector).first().text().trim();
    if (locText) break;
  }

  // Enhanced city/state extraction
  const cityStatePatterns = [
    // "City, State" format
    /([A-Za-z\s]+),\s*([A-Za-z]{2,})/,
    // "City, State ZipCode" format
    /([A-Za-z\s]+),\s*([A-Za-z]{2,})\s+\d{5}/,
    // "City State" format (no comma)
    /([A-Za-z\s]+)\s+([A-Z]{2})$/,
  ];
  
  let city: string | undefined;
  let state: string | undefined;
  
  for (const pattern of cityStatePatterns) {
    const m = locText?.match(pattern);
    if (m) {
      const candidateCity = m[1]?.trim();
      const candidateState = m[2]?.trim();
      
      // Filter out venue names
      const invalidWords = ['hotel', 'convention', 'center', 'venue', 'location', 'address', 'center'];
      const hasInvalidWord = candidateCity?.toLowerCase().split(' ').some(word => 
        invalidWords.includes(word)
      );
      
      if (candidateCity && candidateState && !hasInvalidWord) {
        city = candidateCity;
        state = candidateState;
        break;
      }
    }
  }

  // If no location found in specific selectors, search entire page text
  if (!city || !state) {
    const fullText = $.root().text();
    for (const pattern of cityStatePatterns) {
      const matches = fullText.match(new RegExp(pattern.source, 'g'));
      if (matches) {
        for (const match of matches) {
          const m = match.match(pattern);
          if (m) {
            const candidateCity = m[1]?.trim();
            const candidateState = m[2]?.trim();
            
            const invalidWords = ['hotel', 'convention', 'center', 'venue', 'location', 'address'];
            const hasInvalidWord = candidateCity?.toLowerCase().split(' ').some(word => 
              invalidWords.includes(word)
            );
            
            if (candidateCity && candidateState && !hasInvalidWord && candidateCity.length > 2) {
              city = candidateCity;
              state = candidateState;
              break;
            }
          }
        }
        if (city && state) break;
      }
    }
  }

  // Organizer extraction - try multiple approaches
  let organizer: string | undefined;
  
  // Try specific organizer selectors
  const organizerSelectors = [
    '[class*="organizer"]',
    '[class*="host"]',
    '[class*="sponsor"]',
    '[class*="presented-by"]',
    '[data-testid*="organizer"]'
  ];
  
  for (const selector of organizerSelectors) {
    const orgText = $(selector).first().text().trim();
    if (orgText && orgText.length > 2) {
      organizer = orgText;
      break;
    }
  }

  return {
    title: title || undefined,
    description: firstPara || undefined,
    startsAt,
    endsAt,
    city,
    state,
    venue: locText || undefined,
    organizer,
    canonicalUrl: $('link[rel="canonical"]').attr("href") || finalUrl
  };
}
