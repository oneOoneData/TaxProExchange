import { EventPayload } from "./types";
import { fetchFollow } from "./fetchPage";
import { extractFromJsonLd } from "./fromJsonLd";
import { extractFromIcs } from "./fromIcs";
import { extractFromMeta } from "./fromMeta";
import { extractByHeuristics } from "./heuristics";

export async function extractEvent(url: string): Promise<EventPayload> {
  const fetched = await fetchFollow(url);

  if (fetched.status >= 400) {
    return { sourceUrl: url, canonicalUrl: fetched.finalUrl, raw: { status: fetched.status } };
  }

  // ICS first
  if (fetched.contentType?.includes("text/calendar") || fetched.finalUrl.endsWith(".ics")) {
    const fromIcs = fetched.buffer ? extractFromIcs(fetched.buffer, fetched.finalUrl) : null;
    return {
      sourceUrl: url,
      canonicalUrl: fromIcs?.canonicalUrl || fetched.finalUrl,
      ...fromIcs
    } as EventPayload;
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
    raw: undefined
  };

  return merged as EventPayload;
}
