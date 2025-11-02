import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseService';

export const dynamic = 'force-dynamic';

// GET /api/ai-tools - List all AI tools with vote counts
export async function GET() {
  try {
    const supabase = supabaseService();

    // Get all tools
    const { data: tools, error: toolsError } = await supabase
      .from('ai_tools')
      .select('*')
      .order('created_at', { ascending: false });

    if (toolsError) {
      console.error('Error fetching tools:', toolsError);
      return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
    }

    // Get vote counts for all tools
    const { data: votes, error: votesError } = await supabase
      .from('ai_votes')
      .select('tool_id');

    if (votesError) {
      console.error('Error fetching votes:', votesError);
      return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 });
    }

    // Count votes per tool
    const voteCounts = votes.reduce((acc, vote) => {
      acc[vote.tool_id] = (acc[vote.tool_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get reviews for all tools
    const { data: reviews, error: reviewsError } = await supabase
      .from('ai_reviews')
      .select('tool_id, author, content, permalink, upvotes')
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      // Continue without reviews
    }

    // Get sentiment summaries for all tools
    const { data: sentiments, error: sentimentsError } = await supabase
      .from('ai_sentiments')
      .select('tool_id, sentiment_label, summary, updated_at');

    if (sentimentsError) {
      console.error('Error fetching sentiments:', sentimentsError);
      // Continue without sentiments
    }

    // Group reviews by tool_id
    const reviewsByTool = reviews?.reduce((acc, review) => {
      if (!acc[review.tool_id]) {
        acc[review.tool_id] = [];
      }
      acc[review.tool_id].push({
        author: review.author,
        content: review.content,
        permalink: review.permalink,
        upvotes: review.upvotes,
      });
      return acc;
    }, {} as Record<string, any[]>) || {};

    // Map sentiments by tool_id
    const sentimentsByTool = sentiments?.reduce((acc, sentiment) => {
      acc[sentiment.tool_id] = {
        label: sentiment.sentiment_label,
        summary: sentiment.summary,
        updated_at: sentiment.updated_at,
      };
      return acc;
    }, {} as Record<string, any>) || {};

    // Combine tools with vote counts, reviews, and sentiment
    const toolsWithVotes = tools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      slug: tool.slug,
      category: tool.category,
      website_url: tool.website_url,
      logo_url: tool.logo_url,
      short_description: tool.short_description,
      long_description: tool.long_description,
      affiliate_url: tool.affiliate_url,
      collateral_links: (tool.collateral_links as Array<{ title: string; url: string; type?: string }>) || [],
      votes: voteCounts[tool.id] || 0,
      reviews: reviewsByTool[tool.id]?.slice(0, 3) || [], // Limit to top 3 reviews for list view
      sentiment: sentimentsByTool[tool.id] || null,
    }));

    // Sort by vote count (highest first)
    toolsWithVotes.sort((a, b) => b.votes - a.votes);

    return NextResponse.json({ tools: toolsWithVotes });
  } catch (error) {
    console.error('Error in GET /api/ai-tools:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

