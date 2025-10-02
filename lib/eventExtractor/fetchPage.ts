import fetch from "node-fetch";

export type Fetched = {
  finalUrl: string;
  status: number;
  contentType: string | null;
  text?: string;
  buffer?: Buffer;
};

export async function fetchFollow(url: string): Promise<Fetched> {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": "TPE-EventExtractor/1.0 (+https://taxproexchange.com)",
      "Accept": "text/html,application/xhtml+xml,application/json,text/calendar;q=0.9,*/*;q=0.8"
    },
    // @ts-ignore node-fetch timeout
    timeout: 10000
  });
  
  const contentType = res.headers.get("content-type");
  
  if (contentType?.includes("text/calendar")) {
    const buf = Buffer.from(await res.arrayBuffer());
    return { finalUrl: res.url, status: res.status, contentType, buffer: buf };
  } else {
    const text = await res.text();
    return { finalUrl: res.url, status: res.status, contentType, text };
  }
}
