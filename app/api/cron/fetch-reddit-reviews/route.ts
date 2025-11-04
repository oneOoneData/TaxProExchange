import { NextResponse } from 'next/server';
import { fetchRedditReviews } from '@/lib/reddit';
import { supabaseService } from '@/lib/supabaseService';
import { analyzeRedditSentiment } from '@/lib/aiSentiment';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Shared function to fetch Reddit reviews for all tools
 */
async function fetchAllRedditReviews() {
  console.log('🔍 Starting Reddit review fetch...');

  const supabase = supabaseService();

    // Get all AI tools with search_phrase and exclude_phrase
  const { data: tools, error: toolsError } = await supabase
    .from('ai_tools')
    .select('id, name, slug, search_phrase, exclude_phrase');

  if (toolsError || !tools) {
    console.error('Error fetching tools:', toolsError);
    throw new Error('Failed to fetch tools');
  }

  console.log(`📋 Found ${tools.length} tools to process`);

  let totalFetched = 0;
  let totalInserted = 0;

  for (const tool of tools) {
    // Use custom search phrase if provided, otherwise fall back to tool name
    const searchPhrase = (tool as any).search_phrase || tool.name;
    const excludePhrase = (tool as any).exclude_phrase || undefined;

    console.log(`\n🔎 Fetching reviews for: ${tool.name}`);
    if ((tool as any).search_phrase) {
      console.log(`  🔍 Using custom search phrase: "${searchPhrase}"`);
    }
    if (excludePhrase) {
      console.log(`  🚫 Excluding results containing: "${excludePhrase}"`);
    }

    try {
      // Fetch Reddit reviews with custom search/exclude phrases
      const reviews = await fetchRedditReviews(tool.name, {
        limit: 20,
        subreddits: ['taxpros', 'accounting', 'CPA', 'tax', 'taxpreparation', 'Bookkeeping'],
        searchPhrase: searchPhrase,
        excludePhrase: excludePhrase,
      });

      console.log(`  ✓ Found ${reviews.length} reviews`);

      // Insert/upsert reviews into database
      for (const review of reviews) {
        // Only insert if permalink exists (for uniqueness check)
        if (!review.permalink) {
          continue;
        }

        // Check if review already exists
        const { data: existing } = await supabase
          .from('ai_reviews')
          .select('id')
          .eq('tool_id', tool.id)
          .eq('permalink', review.permalink)
          .maybeSingle();

        if (existing) {
          // Update existing review
          const { error } = await supabase
            .from('ai_reviews')
            .update({
              author: review.author,
              content: review.content,
              upvotes: review.upvotes,
            })
            .eq('id', existing.id);

          if (error) {
            console.error(`  ✗ Error updating review:`, error);
          } else {
            totalInserted++;
          }
        } else {
          // Insert new review
          const { error } = await supabase
            .from('ai_reviews')
            .insert({
              tool_id: tool.id,
              source: 'reddit',
              author: review.author,
              content: review.content,
              permalink: review.permalink,
              upvotes: review.upvotes,
            });

          if (error) {
            console.error(`  ✗ Error inserting review:`, error);
          } else {
            totalInserted++;
          }
        }
      }

      totalFetched += reviews.length;

      // Generate sentiment summary if we have reviews
      if (reviews.length > 0) {
        try {
          console.log(`  🧠 Generating sentiment summary...`);
          
          // Get recent reviews from database for better context
          const { data: recentReviews } = await supabase
            .from('ai_reviews')
            .select('content, upvotes')
            .eq('tool_id', tool.id)
            .order('upvotes', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(15);

          if (recentReviews && recentReviews.length > 0) {
            const sentiment = await analyzeRedditSentiment(
              tool.name,
              recentReviews.map(r => ({ content: r.content, upvotes: r.upvotes || 0 }))
            );

            // Upsert sentiment summary
            const { error: sentimentError } = await supabase
              .from('ai_sentiments')
              .upsert({
                tool_id: tool.id,
                sentiment_label: sentiment.sentiment_label,
                summary: sentiment.summary,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'tool_id',
              });

            if (sentimentError) {
              console.error(`  ✗ Error saving sentiment:`, sentimentError);
            } else {
              console.log(`  ✓ Sentiment: ${sentiment.sentiment_label}`);
            }
          }
        } catch (error) {
          console.error(`  ✗ Error generating sentiment for ${tool.name}:`, error);
          // Continue even if sentiment fails
        }
      }

      // Rate limiting between tools
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`  ✗ Error processing ${tool.name}:`, error);
      continue;
    }
  }

  const result = {
    success: true,
    toolsProcessed: tools.length,
    reviewsFetched: totalFetched,
    reviewsInserted: totalInserted,
    timestamp: new Date().toISOString(),
  };

  console.log(`\n✅ Complete!`, result);

  return result;
  } catch (error) {
    console.error('Fatal error in Reddit review fetch:', error);
    throw error;
  }
}

/**
 * Vercel Cron endpoint to fetch Reddit reviews daily
 * Protected by Vercel Cron secret header
 */
export async function POST(request: Request) {
  try {
    // Verify this is a Vercel Cron request
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (!process.env.CRON_SECRET) {
      return NextResponse.json(
        { ok: false, error: 'cron_secret_not_configured' },
        { status: 500 }
      );
    }
    
    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 }
      );
    }

    const result = await fetchAllRedditReviews();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Fatal error in Reddit review fetch:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for manual triggering (for testing/debugging)
 * Requires CRON_SECRET for security
 */
export async function GET(request: Request) {
  try {
    // Verify authorization (same as POST)
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (!process.env.CRON_SECRET) {
      return NextResponse.json(
        { ok: false, error: 'cron_secret_not_configured' },
        { status: 500 }
      );
    }
    
    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 }
      );
    }

    const result = await fetchAllRedditReviews();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Fatal error in manual Reddit review fetch:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

