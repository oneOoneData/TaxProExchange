import { NextResponse } from "next/server";
import { scrapeEventFromUrl } from "@/lib/eventScraper";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ 
        error: "URL is required" 
      }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ 
        error: "Invalid URL format" 
      }, { status: 400 });
    }

    // Scrape the event data
    const scrapedData = await scrapeEventFromUrl(url);

    if (!scrapedData.success) {
      return NextResponse.json({ 
        error: scrapedData.error || "Failed to scrape event data" 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: scrapedData
    });

  } catch (error) {
    console.error('Error in scrape event API:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
