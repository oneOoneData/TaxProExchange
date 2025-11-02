import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AppNavigation from '@/components/AppNavigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabaseService } from '@/lib/supabaseService';
import ToolDetailClient from '@/components/ai/ToolDetailClient';

export const dynamic = 'force-dynamic';

async function getToolBySlug(slug: string) {
  const supabase = supabaseService();
  
  // Get tool
  const { data: tool, error } = await supabase
    .from('ai_tools')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !tool) {
    return null;
  }

  // Get vote count
  const { count: voteCount } = await supabase
    .from('ai_votes')
    .select('*', { count: 'exact', head: true })
    .eq('tool_id', tool.id);

  // Get reviews
  const { data: reviews } = await supabase
    .from('ai_reviews')
    .select('author, content, permalink, upvotes')
    .eq('tool_id', tool.id)
    .order('upvotes', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10);

  // Get sentiment
  const { data: sentiment } = await supabase
    .from('ai_sentiments')
    .select('sentiment_label, summary, updated_at')
    .eq('tool_id', tool.id)
    .maybeSingle();

  return {
    ...tool,
    votes: voteCount || 0,
    reviews: reviews || [],
    sentiment: sentiment ? {
      label: sentiment.sentiment_label as 'positive' | 'mixed' | 'negative',
      summary: sentiment.summary,
      updated_at: sentiment.updated_at,
    } : null,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) {
    return {
      title: 'Tool Not Found',
    };
  }

  return {
    title: `${tool.name} | AI Tools for Tax Pros | TaxProExchange`,
    description: tool.short_description || tool.long_description || `Learn more about ${tool.name} for tax professionals.`,
  };
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  return (
    <>
      <AppNavigation />
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-slate-600">
            <Link href="/ai" className="hover:text-slate-900">
              AI Tools
            </Link>
            <span>→</span>
            <span className="text-slate-900">{tool.name}</span>
          </nav>
        </div>

        {/* Tool Detail */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <ToolDetailClient tool={tool} />
        </div>
      </div>
    </>
  );
}

