import * as cheerio from "cheerio";
import { EventPayload } from "./types";

// Extract first schema.org Event
export function extractFromJsonLd(html: string, url: string): Partial<EventPayload> | null {
  const $ = cheerio.load(html);
  const blocks = $('script[type="application/ld+json"]');
  
  for (let i = 0; i < blocks.length; i++) {
    try {
      const json = JSON.parse($(blocks[i]).contents().text().trim());
      const candidates = Array.isArray(json) ? json : [json, ...(Array.isArray(json["@graph"]) ? json["@graph"] : [])];
      
      for (const node of candidates) {
        const type = (node["@type"] || node.type || "").toString().toLowerCase();
        if (type.includes("event")) {
          const name = node.name || node.headline;
          const start = node.startDate;
          const end = node.endDate;
          const loc = node.location || {};
          const addr = loc.address || {};
          const organizer = node.organizer?.name || node.organizer || node.performer?.name;
          const desc = (node.description || node.abstract || "").toString();
          const canon = node.url || node.mainEntityOfPage || url;
          
          return {
            title: name,
            description: desc,
            startsAt: start,
            endsAt: end,
            city: addr.addressLocality,
            state: addr.addressRegion,
            country: addr.addressCountry,
            venue: loc.name,
            organizer: organizer,
            canonicalUrl: canon
          };
        }
      }
    } catch { /* ignore bad JSON blocks */ }
  }
  
  return null;
}
