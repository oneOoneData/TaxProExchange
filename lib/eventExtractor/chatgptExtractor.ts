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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const finalUrl = response.url;

    // Truncate HTML to avoid token limits (keep first 50k characters which should include most important content)
    const truncatedHtml = html.substring(0, 50000);
    
    // Debug: Log key content to see what we're sending
    console.log('🔍 DEBUG - URL:', url);
    console.log('🔍 DEBUG - Final URL:', finalUrl);
    console.log('🔍 DEBUG - HTML length:', html.length);
    console.log('🔍 DEBUG - HTML preview (first 500 chars):', html.substring(0, 500));
    console.log('🔍 DEBUG - Looking for 2026:', html.includes('2026') ? 'FOUND' : 'NOT FOUND');
    console.log('🔍 DEBUG - Looking for Cleveland:', html.includes('Cleveland') ? 'FOUND' : 'NOT FOUND');
    console.log('🔍 DEBUG - Looking for Las Vegas:', html.includes('Las Vegas') ? 'FOUND' : 'NOT FOUND');
    console.log('🔍 DEBUG - Looking for Ohio:', html.includes('Ohio') ? 'FOUND' : 'NOT FOUND');
    console.log('🔍 DEBUG - Looking for Nevada:', html.includes('Nevada') ? 'FOUND' : 'NOT FOUND');
    console.log('🔍 DEBUG - Contains "Suggest an Event":', html.includes('Suggest an Event') ? 'WARNING - This looks like a form!' : 'OK');
    console.log('🔍 DEBUG - Contains "TaxProExchange":', html.includes('TaxProExchange') ? 'WARNING - This looks like our form!' : 'OK');
    
    // Look for location patterns near 2026
    const lines = html.split('\n');
    let locationNear2026 = 'NOT FOUND';
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('2026')) {
        // Check lines around the 2026 mention for location info
        for (let j = Math.max(0, i-3); j <= Math.min(lines.length-1, i+3); j++) {
          if (lines[j].includes('Cleveland') || lines[j].includes('Las Vegas')) {
            locationNear2026 = `FOUND: "${lines[j].trim()}" (line ${j+1})`;
            break;
          }
        }
        break;
      }
    }
    console.log('🔍 DEBUG - Location near 2026:', locationNear2026);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Using the more capable model for better accuracy
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

CRITICAL: Return ONLY the JSON object, no markdown formatting, no code blocks, no additional text. Just the raw JSON.

Rules:
- Use ISO datetime format for dates
- If a field cannot be found, use null
- For dates, if only one date is found, use it for both startsAt and endsAt
- Extract the most specific and accurate information available
- Focus on the main event, not side events or workshops
- IGNORE any outdated information (like 2024 dates when 2026 dates are available)
- PRIORITIZE the most current/upcoming event information
- For location: Look for the ACTUAL event location mentioned with the current year (2026), not previous years
- Be very careful about location - if multiple cities are mentioned, choose the one associated with the current/upcoming event
- Double-check that city and state match the same event (don't mix different years' locations)`
        },
        {
          role: "user",
          content: `Extract event information from this HTML content for URL: ${url}

IMPORTANT: Look for the most current/upcoming event information. Focus on dates like 2026, 2025, etc. for future events.

HTML Content:\n${truncatedHtml}`
        }
      ],
      temperature: 0.1, // Low temperature for consistent extraction
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from ChatGPT');
    }

    // Clean the response - remove markdown code blocks if present
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Parse the JSON response
    const extractedData = JSON.parse(cleanedContent);
    
    // Debug: Log what ChatGPT extracted
    console.log('🤖 DEBUG - ChatGPT extracted:', JSON.stringify(extractedData, null, 2));

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
        model: 'gpt-4o',
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
