/**
 * Cron script to fetch Reddit reviews for AI tools and populate ai_reviews table
 * 
 * Usage:
 * - All tools: npx tsx scripts/fetchRedditReviews.ts
 * - Single tool: npx tsx scripts/fetchRedditReviews.ts <tool-name-or-slug>
 * - Generate sentiment only (skip Reddit fetch): npx tsx scripts/fetchRedditReviews.ts <tool-name> --sentiment-only
 * 
 * Examples:
 * - npx tsx scripts/fetchRedditReviews.ts truewind
 * - npx tsx scripts/fetchRedditReviews.ts taxbert --sentiment-only
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
  // Check if we should skip Reddit fetching and only generate sentiment
  const skipFetch = process.argv.includes('--sentiment-only') || process.argv.includes('--skip-fetch');
  
  console.log('🔍 Starting Reddit review fetch...');
  if (toolNameArg) {
    console.log(`🎯 Targeting single tool: ${toolNameArg}`);
  }
  if (skipFetch) {
    console.log(`📊 Mode: Generating sentiment only (skipping Reddit fetch)`);
  }

  const supabase = supabaseService();

  // Get AI tools - either all tools or just the specified one
  let query = supabase
    .from('ai_tools')
    .select('id, name, slug, search_phrase, exclude_phrase');

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
    console.log(`\n🔎 Processing: ${tool.name}`);

    try {
      // Use custom search phrase if provided, otherwise use tool name
      const searchPhrase = (tool as any).search_phrase || tool.name;
      const excludePhrase = (tool as any).exclude_phrase || undefined;
      
      let reviews: any[] = [];
      
      if (!skipFetch) {
        // Fetch Reddit reviews
        if ((tool as any).search_phrase) {
          console.log(`  🔍 Searching Reddit with custom phrase: "${searchPhrase}" (tool: ${tool.name})`);
        } else {
          console.log(`  🔍 Searching Reddit for: "${tool.name}"`);
        }
        
        if (excludePhrase) {
          console.log(`  🚫 Excluding results containing: "${excludePhrase}"`);
        }
        
        reviews = await fetchRedditReviews(tool.name, {
          limit: 30, // Increased to account for comments
          subreddits: ['taxpros', 'accounting', 'CPA', 'tax', 'taxpreparation', 'Bookkeeping'],
          searchPhrase: searchPhrase,
          excludePhrase: excludePhrase,
        });

        console.log(`  ✓ Found ${reviews.length} reviews/mentions`);
        
        if (reviews.length === 0) {
          console.log(`  ⚠️  No new reviews found from Reddit. Checking database for existing reviews...`);
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
        } // End of for loop - inserting reviews
        
        totalFetched += reviews.length;
      } // End of if (!skipFetch) block

      // Generate sentiment summary if we have reviews (either newly fetched OR already in database)
      
      // Always check database for existing reviews to use the full dataset
      const { data: recentReviews } = await supabase
        .from('ai_reviews')
        .select('content, upvotes')
        .eq('tool_id', tool.id)
        .order('upvotes', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(15);

      if (recentReviews && recentReviews.length > 0) {
        try {
          console.log(`  🧠 Generating sentiment summary from ${recentReviews.length} reviews...`);
          
          const sentiment = await analyzeRedditSentiment(
            tool.name,
            recentReviews.map(r => ({ content: r.content, upvotes: r.upvotes || 0 })),
            {
              searchPhrase: searchPhrase, // Pass the search phrase used to find these reviews
            }
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
            console.log(`  📝 Summary preview: ${sentiment.summary.substring(0, 100)}...`);
          }
        } catch (error) {
          console.error(`  ✗ Error generating sentiment for ${tool.name}:`, error);
          // Continue even if sentiment fails
        }
      } else {
        console.log(`  ⚠️  No reviews in database for sentiment analysis. Run again after reviews are fetched.`);
      }

      // Rate limiting between tools (increased significantly to avoid Reddit rate limits)
      if (!skipFetch) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Increased to 5s between tools
      }
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

