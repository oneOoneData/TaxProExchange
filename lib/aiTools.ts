import { supabaseService } from '@/lib/supabaseService';

export type Sentiment = 'positive' | 'mixed' | 'negative';

export interface DirectoryTool {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  website_url: string | null;
  logo_url: string | null;
  short_description: string | null;
  review_url: string | null;
  votes: number;
  reviewCount: number;
  sentiment: { label: Sentiment; summary: string | null; updated_at: string } | null;
  created_at: string;
  updated_at: string;
}

/** Display order for category chips. Unknown categories are appended. */
export const TOOL_CATEGORIES = [
  'Tax Research',
  'Return Prep & Data Entry',
  'Intake & Workflow',
  'Planning & Advisory',
  'Bookkeeping & Accounting',
] as const;

/**
 * All AI tools with vote counts, Reddit review counts and sentiment.
 * Shared by the /insights/tools page (server-rendered) and /api/ai-tools.
 */
export async function getDirectoryTools(): Promise<DirectoryTool[]> {
  const supabase = supabaseService();

  const [toolsRes, votesRes, reviewsRes, sentimentsRes] = await Promise.all([
    supabase
      .from('ai_tools')
      .select('id, name, slug, category, website_url, logo_url, short_description, review_url, created_at, updated_at'),
    supabase.from('ai_votes').select('tool_id'),
    supabase.from('ai_reviews').select('tool_id'),
    supabase.from('ai_sentiments').select('tool_id, sentiment_label, summary, updated_at'),
  ]);

  if (toolsRes.error || !toolsRes.data) {
    console.error('Error fetching ai_tools:', toolsRes.error);
    return [];
  }

  const count = (rows: { tool_id: string }[] | null) =>
    (rows || []).reduce<Record<string, number>>((acc, r) => {
      acc[r.tool_id] = (acc[r.tool_id] || 0) + 1;
      return acc;
    }, {});

  const votes = count(votesRes.data);
  const reviews = count(reviewsRes.data);
  const sentiments = new Map(
    (sentimentsRes.data || []).map((s: any) => [
      s.tool_id,
      { label: s.sentiment_label as Sentiment, summary: s.summary, updated_at: s.updated_at },
    ])
  );

  return toolsRes.data.map((t: any) => ({
    ...t,
    review_url: t.review_url ?? null,
    votes: votes[t.id] || 0,
    reviewCount: reviews[t.id] || 0,
    sentiment: sentiments.get(t.id) || null,
  }));
}
