/**
 * AI Sentiment Analysis for Reddit Reviews
 * Uses OpenAI to summarize Reddit discussions and determine sentiment
 */

import OpenAI from 'openai';

// Initialize OpenAI client lazily to allow env vars to load first
let openaiInstance: OpenAI | null = null;

function getOpenAI() {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY or NEXT_PUBLIC_OPENAI_API_KEY environment variable is required');
    }
    openaiInstance = new OpenAI({
      apiKey,
    });
  }
  return openaiInstance;
}

export interface SentimentAnalysis {
  sentiment_label: 'positive' | 'mixed' | 'negative';
  summary: string;
}

/**
 * Analyze Reddit comments and generate a sentiment summary
 */
export async function analyzeRedditSentiment(
  toolName: string,
  redditComments: Array<{ content: string; upvotes: number }>
): Promise<SentimentAnalysis> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  if (redditComments.length === 0) {
    return {
      sentiment_label: 'mixed',
      summary: 'No Reddit discussions found yet.',
    };
  }

  // Combine comments into a single text (limit to most relevant/recent)
  const sortedComments = redditComments
    .sort((a, b) => b.upvotes - a.upvotes) // Sort by upvotes
    .slice(0, 15); // Top 15 comments

  const commentsText = sortedComments
    .map((comment, idx) => `Comment ${idx + 1} (${comment.upvotes} upvotes): ${comment.content}`)
    .join('\n\n');

  const prompt = `You are analyzing Reddit discussions about an AI tax tool called "${toolName}".
Below are real Reddit comments from tax professionals discussing this tool.

Task:
1. Determine the overall sentiment: "positive", "mixed", or "negative"
2. Summarize the recurring themes and feedback (e.g., accuracy, pricing, support, ease of use, integrations)
3. Keep the tone professional but conversational
4. Output exactly 1 concise paragraph (max 75 words - be comprehensive)
5. Be specific about what tax pros like or dislike

Comments:
${commentsText}

Format your response as JSON:
{
  "sentiment_label": "positive" | "mixed" | "negative",
  "summary": "Your one-paragraph summary here (max 50 words)"
}`;

  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: 'You are a tax technology analyst summarizing Reddit discussions. Be objective and specific.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content) as SentimentAnalysis;
    
    // Validate sentiment label
    if (!['positive', 'mixed', 'negative'].includes(parsed.sentiment_label)) {
      parsed.sentiment_label = 'mixed';
    }

    // Ensure summary is reasonable (allow up to 500 chars for better readability)
    if (parsed.summary.length > 500) {
      parsed.summary = parsed.summary.slice(0, 497) + '...';
    }

    return parsed;
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    throw error;
  }
}

