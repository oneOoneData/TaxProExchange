/**
 * Cron script to fetch Reddit reviews for AI tools and populate ai_reviews table
 * 
 * Usage:
 * - All tools: npx tsx scripts/fetchRedditReviews.ts
 * - Single tool: npx tsx scripts/fetchRedditReviews.ts <tool-name-or-slug>
 * 
 * Examples:
 * - npx tsx scripts/fetchRedditReviews.ts truewind
 * - npx tsx scripts/fetchRedditReviews.ts Truewind
 * - npx tsx scripts/fetchRedditReviews.ts solomon
 * 
 * Vercel Cron: Add to vercel.json cron jobs (daily) - runs for all tools
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { fetchRedditReviews } from '@/lib/reddit';
import { supabaseService } from '@/lib/supabaseService';
import { analyzeRedditSentiment } from '@/lib/aiSentiment';

async function main() {
  // Get tool name from command line args (optional)
  const toolNameArg = process.argv[2];
  
  console.log('🔍 Starting Reddit review fetch...');
  if (toolNameArg) {
    console.log(`🎯 Targeting single tool: ${toolNameArg}`);
  }

  const supabase = supabaseService();

  // Get AI tools - either all tools or just the specified one
  let query = supabase
    .from('ai_tools')
    .select('id, name, slug');

  if (toolNameArg) {
    // Search by name or slug (case-insensitive)
    query = query.or(`name.ilike.%${toolNameArg}%,slug.ilike.%${toolNameArg}%`);
  }

  const { data: tools, error: toolsError } = await query;

  if (toolsError || !tools) {
    console.error('Error fetching tools:', toolsError);
    process.exit(1);
  }

  if (tools.length === 0) {
    console.error(`❌ No tools found matching: ${toolNameArg}`);
    process.exit(1);
  }

  console.log(`📋 Found ${tools.length} tool(s) to process`);

  let totalFetched = 0;
  let totalInserted = 0;

  for (const tool of tools) {
    console.log(`\n🔎 Fetching reviews for: ${tool.name}`);

    try {
      // Fetch Reddit reviews
      console.log(`  🔍 Searching Reddit for: "${tool.name}"`);
      const reviews = await fetchRedditReviews(tool.name, {
        limit: 30, // Increased to account for comments
        subreddits: ['taxpros', 'accounting', 'CPA', 'tax', 'taxpreparation', 'Bookkeeping'],
      });

      console.log(`  ✓ Found ${reviews.length} reviews/mentions`);
      
      if (reviews.length === 0) {
        console.log(`  ⚠️  No reviews found. The tool might not be mentioned on Reddit, or mentions might be in comment threads we haven't indexed yet.`);
      }

      // Insert/upsert reviews into database
      for (const review of reviews) {
        // Only insert if permalink exists (for uniqueness check)
        if (!review.permalink) {
          continue; // Skip reviews without permalinks
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

  console.log(`\n✅ Complete!`);
  console.log(`   Fetched: ${totalFetched} reviews`);
  console.log(`   Inserted/Updated: ${totalInserted} reviews`);
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default main;

