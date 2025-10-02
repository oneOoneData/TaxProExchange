import * as cheerio from "cheerio";
import { EventPayload } from "./types";

export function extractFromMeta(html: string, url: string): Partial<EventPayload> | null {
  const $ = cheerio.load(html);
  const og = (p: string) => $(`meta[property="og:${p}"]`).attr("content") || $(`meta[name="og:${p}"]`).attr("content");
  const tw = (p: string) => $(`meta[name="twitter:${p}"]`).attr("content");
  
  const title = og("title") || $("title").text().trim() || tw("title");
  const description = og("description") || $('meta[name="description"]').attr("content") || tw("description");
  const siteName = og("site_name");
  const canon = $('link[rel="canonical"]').attr("href") || og("url") || url;

  if (!title && !description) return null;
  
  return {
    title,
    description,
    organizer: siteName || undefined,
    canonicalUrl: canon
  };
}
