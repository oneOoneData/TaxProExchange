import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AppNavigation from '@/components/AppNavigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabaseService } from '@/lib/supabaseService';
import ToolDetailClient from '@/components/ai/ToolDetailClient';
import JsonLd from '@/components/seo/JsonLd';
import { siteUrl } from '@/lib/seo';

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

function generateSoftwareApplicationJsonLd(tool: {
  name: string;
  slug: string;
  short_description?: string;
  long_description?: string;
  category?: string;
  website_url?: string;
  logo_url?: string;
}) {
  const url = `${siteUrl}/ai/tools/${tool.slug}`;
  const description = tool.short_description || tool.long_description || `Learn more about ${tool.name} for tax professionals.`;
  const image = tool.logo_url ? (tool.logo_url.startsWith('http') ? tool.logo_url : `${siteUrl}${tool.logo_url}`) : undefined;

  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: description.substring(0, 160),
    url: url,
    applicationCategory: 'BusinessApplication',
  };

  if (image) {
    jsonLd.image = image;
  }

  if (tool.category) {
    jsonLd.keywords = tool.category;
  }

  if (tool.website_url) {
    jsonLd.offers = {
      '@type': 'Offer',
      url: tool.website_url,
    };
  }

  return jsonLd;
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
      title: 'Tool Not Found | TaxProExchange',
    };
  }

  const url = `${siteUrl}/ai/tools/${slug}`;
  const description = tool.short_description || tool.long_description || `Learn more about ${tool.name} for tax professionals.`;
  const imageUrl = tool.logo_url 
    ? (tool.logo_url.startsWith('http') ? tool.logo_url : `${siteUrl}${tool.logo_url}`)
    : `${siteUrl}/og-image.png`;

  return {
    title: `${tool.name}${tool.category ? ` – ${tool.category}` : ''} | AI Tools for Tax Pros | TaxProExchange`,
    description: description.substring(0, 160),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: tool.name,
      description: description.substring(0, 160),
      url: url,
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${tool.name} logo`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: tool.name,
      description: description.substring(0, 160),
      images: [imageUrl],
    },
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

  const softwareApplicationSchema = generateSoftwareApplicationJsonLd(tool);

  return (
    <>
      <JsonLd data={softwareApplicationSchema} />
      <AppNavigation />
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-slate-600 mb-4">
            <Link href="/ai" className="hover:text-slate-900">
              AI
            </Link>
            <span>→</span>
            <Link href="/ai/tools" className="hover:text-slate-900">
              Tools
            </Link>
            <span>→</span>
            <span className="text-slate-900">{tool.name}</span>
          </nav>
          
          {/* Back to the Wall Button */}
          <Link
            href="/ai/tools"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to the Wall
          </Link>
        </div>

        {/* Tool Detail */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <ToolDetailClient tool={tool} />
        </div>
      </div>
    </>
  );
}

