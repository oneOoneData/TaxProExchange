import { EventPayload } from "./types";
import { extractEventWithChatGPT } from "./chatgptExtractor";
import { fetchFollow } from "./fetchPage";
import { extractFromJsonLd } from "./fromJsonLd";
import { extractFromMeta } from "./fromMeta";
import { extractByHeuristics } from "./heuristics";

export async function extractEvent(url: string): Promise<EventPayload> {
  try {
    // Try ChatGPT first - much more reliable and comprehensive
    return await extractEventWithChatGPT(url);
  } catch (error) {
    console.log('ChatGPT extraction failed, falling back to custom extractor:', error);
    
    // Fallback to custom extractor
    const fetched = await fetchFollow(url);

    if (fetched.status >= 400) {
      return { sourceUrl: url, canonicalUrl: fetched.finalUrl, raw: { status: fetched.status } };
    }

    const html = fetched.text || "";
    const fromJsonLd = extractFromJsonLd(html, fetched.finalUrl);
    const fromMeta   = extractFromMeta(html, fetched.finalUrl);
    const fromHeur   = extractByHeuristics(html, fetched.finalUrl);

    // Merge priority: JSON-LD > Meta > Heuristics
    const merged = {
      sourceUrl: url,
      canonicalUrl: fromJsonLd?.canonicalUrl || fromMeta?.canonicalUrl || fromHeur.canonicalUrl || fetched.finalUrl,
      title: fromJsonLd?.title || fromMeta?.title || fromHeur.title,
      description: fromJsonLd?.description || fromMeta?.description || fromHeur.description,
      startsAt: fromJsonLd?.startsAt || fromHeur.startsAt,
      endsAt: fromJsonLd?.endsAt || fromHeur.endsAt,
      city: fromJsonLd?.city || fromHeur.city,
      state: fromJsonLd?.state || fromHeur.state,
      country: fromJsonLd?.country,
      venue: fromJsonLd?.venue || fromHeur.venue,
      organizer: fromJsonLd?.organizer || fromMeta?.organizer || fromHeur.organizer,
      raw: {
        extractionMethod: 'fallback',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };

    return merged as EventPayload;
  }
}
