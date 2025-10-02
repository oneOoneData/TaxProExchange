import { parseICS } from "ics-parser";
import { EventPayload } from "./types";

export function extractFromIcs(buf: Buffer, sourceUrl: string): Partial<EventPayload> | null {
  try {
    const data = parseICS(buf.toString("utf8"));
    // Take the first VEVENT
    const evt = Object.values<any>(data).find(v => v.type === "VEVENT") as any;
    if (!evt) return null;

    const toIso = (d?: any) => d?.toISOString?.() || (d?.value?.toISOString?.());
    
    return {
      title: evt.summary?.value || evt.summary,
      description: (evt.description?.value || evt.description) as string | undefined,
      startsAt: toIso(evt.start),
      endsAt: toIso(evt.end),
      venue: evt.location?.value || evt.location,
      canonicalUrl: evt.url?.value || evt.url,
      sourceUrl
    };
  } catch { 
    return null; 
  }
}
