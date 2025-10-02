import OpenAI from 'openai';
import { EventPayload } from './types';

export async function extractEventWithChatGPT(url: string): Promise<EventPayload> {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    // First, fetch the page content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TPE-EventExtractor/1.0 (+https://taxproexchange.com)',
        'Accept': 'text/html,application/xhtml+xml,application/json,text/calendar;q=0.9,*/*;q=0.8'
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const finalUrl = response.url;

    // Truncate HTML to avoid token limits (keep first 50k characters which should include most important content)
    const truncatedHtml = html.substring(0, 50000);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using the more cost-effective model
      messages: [
        {
          role: "system",
          content: `You are an expert event data extractor. Extract event information from HTML content and return it as a JSON object with these exact fields:

{
  "title": "Event title",
  "description": "Full event description",
  "startsAt": "2024-07-13T00:00:00.000Z", // ISO format
  "endsAt": "2024-07-15T00:00:00.000Z",   // ISO format  
  "city": "City name",
  "state": "State or province",
  "country": "Country name (optional)",
  "venue": "Venue name (optional)",
  "organizer": "Organizer or host organization"
}

Rules:
- Return ONLY valid JSON, no other text
- Use ISO datetime format for dates
- If a field cannot be found, use null
- For dates, if only one date is found, use it for both startsAt and endsAt
- Extract the most specific and accurate information available
- Focus on the main event, not side events or workshops`
        },
        {
          role: "user",
          content: `Extract event information from this HTML content for URL: ${url}\n\nHTML Content:\n${truncatedHtml}`
        }
      ],
      temperature: 0.1, // Low temperature for consistent extraction
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from ChatGPT');
    }

    // Parse the JSON response
    const extractedData = JSON.parse(content);

    // Validate and format the response
    const result: EventPayload = {
      sourceUrl: url,
      canonicalUrl: finalUrl,
      title: extractedData.title || undefined,
      description: extractedData.description || undefined,
      startsAt: extractedData.startsAt || undefined,
      endsAt: extractedData.endsAt || undefined,
      city: extractedData.city || undefined,
      state: extractedData.state || undefined,
      country: extractedData.country || undefined,
      venue: extractedData.venue || undefined,
      organizer: extractedData.organizer || undefined,
      raw: {
        extractionMethod: 'chatgpt',
        model: 'gpt-4o-mini',
        tokensUsed: completion.usage?.total_tokens || 0
      }
    };

    return result;

  } catch (error) {
    console.error('Error extracting event with ChatGPT:', error);
    
    // Return minimal result with error info
    return {
      sourceUrl: url,
      canonicalUrl: url,
      raw: {
        extractionMethod: 'chatgpt',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}
