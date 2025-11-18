import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { siteUrl, partnerOrganizationLD, jsonLd } from '@/lib/seo';
import AnalyticsPageView from '@/components/analytics/AnalyticsPageView';
import AppNavigation from '@/components/AppNavigation';
import TrussDetailInline from '@/components/ai/TrussDetailInline';
import partnersData from '@/data/partners.json';
import { supabaseService } from '@/lib/supabaseService';

interface PartnerPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return partnersData.map((partner) => ({
    slug: partner.slug,
  }));
}

export async function generateMetadata({ params }: PartnerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const partner = partnersData.find((p) => p.slug === slug);

  if (!partner) {
    return {
      title: 'Partner Not Found | TaxProExchange',
      robots: { index: false, follow: false },
    };
  }

  const title = `${partner.name} – Partner • TaxProExchange`;
  const desc = partner.tagline?.slice(0, 155) || `Partner: ${partner.name} on TaxProExchange.`;
  const canonical = `${siteUrl}/partners/${slug}`;

  return {
    title,
    description: desc,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description: desc,
      url: canonical,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
    },
  };
}

async function getTrussData() {
  try {
    const supabase = supabaseService();

    // Get Truss tool - try slug first (indexed), then name if needed
    let { data: tools, error: toolsError } = await supabase
      .from('ai_tools')
      .select('*')
      .eq('slug', 'truss')
      .limit(1);
    
    // Fallback to name search if slug doesn't match
    if ((!tools || tools.length === 0) && !toolsError) {
      const { data: nameTools, error: nameError } = await supabase
        .from('ai_tools')
        .select('*')
        .ilike('name', '%truss%')
        .limit(1);
      tools = nameTools;
      if (nameError) toolsError = nameError;
    }

    if (toolsError || !tools || tools.length === 0) {
      return null;
    }

    const tool = tools[0];

    // Get vote count
    const { data: votes } = await supabase
      .from('ai_votes')
      .select('tool_id')
      .eq('tool_id', tool.id);
    
    const voteCount = votes?.length || 0;

    // Get reviews - using composite index for optimal ordering
    const { data: reviews } = await supabase
      .from('ai_reviews')
      .select('tool_id, author, content, permalink, upvotes')
      .eq('tool_id', tool.id)
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100); // Reasonable limit to prevent excessive data transfer

    // Get sentiment
    const { data: sentimentData } = await supabase
      .from('ai_sentiments')
      .select('tool_id, sentiment_label, summary, updated_at')
      .eq('tool_id', tool.id)
      .single();

    return {
      tool: {
        id: tool.id,
        name: tool.name,
        slug: tool.slug,
        category: tool.category,
        website_url: tool.website_url,
        logo_url: tool.logo_url,
        short_description: tool.short_description,
        long_description: tool.long_description,
        votes: voteCount,
      },
      reviews: reviews?.map(r => ({
        author: r.author,
        content: r.content,
        permalink: r.permalink,
        upvotes: r.upvotes,
      })) || [],
      collateralLinks: (tool.collateral_links as Array<{ title: string; url: string; type?: string }>) || [],
      sentiment: sentimentData ? {
        label: sentimentData.sentiment_label as 'positive' | 'mixed' | 'negative',
        summary: sentimentData.summary,
        updated_at: sentimentData.updated_at,
      } : null,
    };
  } catch (error) {
    console.error('Error fetching Truss data:', error);
    return null;
  }
}

export default async function PartnerDetailPage({ params }: PartnerPageProps) {
  const { slug } = await params;
  const partner = partnersData.find((p) => p.slug === slug);

  if (!partner) {
    notFound();
  }

  // Fetch Truss data if this is the Truss partner page
  const trussData = partner.slug === 'truss' ? await getTrussData() : null;

  // Generate JSON-LD for Organization schema
  const organizationSchema = partnerOrganizationLD({
    name: partner.name,
    slug: partner.slug,
    tagline: partner.tagline,
    description: partner.description,
    website: partner.website,
    category: partner.category
  });

  return (
    <>
      {/* JSON-LD: Organization */}
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={jsonLd(organizationSchema)} 
      />
      
      <AnalyticsPageView eventName="view_partner_detail" />
      <AppNavigation />

      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-slate-600">
            <Link href="/partners" className="hover:text-slate-900">
              Partners
            </Link>
            <span>→</span>
            <span className="text-slate-900">{partner.name}</span>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="max-w-4xl mx-auto text-center">
              {/* Logo */}
              {partner.slug === 'truss' ? (
                <div className="flex items-center justify-center h-24 w-24 mx-auto mb-6 rounded-2xl bg-white overflow-hidden">
                  <Image
                    src="https://rzbfkdicrhdharyzfmul.supabase.co/storage/v1/object/public/ai-tool-logos/truss.jpg"
                    alt={`${partner.name} logo`}
                    width={96}
                    height={96}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : partner.slug === 'taxgpt' ? (
                <div className="flex items-center justify-center h-24 w-24 mx-auto mb-6 rounded-2xl bg-white overflow-hidden">
                  <Image
                    src="https://rzbfkdicrhdharyzfmul.supabase.co/storage/v1/object/public/ai-tool-logos/taxgpt.jpg"
                    alt={`${partner.name} logo`}
                    width={96}
                    height={96}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : partner.slug === 'bluej' ? (
                <div className="flex items-center justify-center h-24 w-24 mx-auto mb-6 rounded-2xl bg-white overflow-hidden">
                  <Image
                    src="https://rzbfkdicrhdharyzfmul.supabase.co/storage/v1/object/public/ai-tool-logos/bluej.png"
                    alt={`${partner.name} logo`}
                    width={96}
                    height={96}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : partner.logo ? (
                <div className="flex items-center justify-center h-24 w-24 mx-auto mb-6 rounded-2xl bg-white overflow-hidden">
                  <Image
                    src={partner.logo}
                    alt={`${partner.name} logo`}
                    width={96}
                    height={96}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
              <div className="flex items-center justify-center h-24 w-24 mx-auto mb-6 rounded-2xl bg-slate-100">
                <div className="text-3xl font-bold text-slate-400">
                  {partner.name.charAt(0)}
                </div>
              </div>
              )}

              {/* Category Badge */}
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium mb-4">
                {partner.category}
              </div>

              {/* Partner Name */}
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                {partner.name}
              </h1>

              {/* Tagline */}
              <p className="text-xl text-slate-600 mb-6">
                {partner.tagline}
              </p>

              {/* Description */}
              <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
                {partner.description}
              </p>

              {/* Contact Button */}
              {partner.slug === 'bluej' ? (
                <a
                  href="mailto:lara.bean@bluejlegal.com?subject=TaxProExchange Partnership Inquiry&body=Hi Lara,%0D%0A%0D%0AI'm reaching out from TaxProExchange regarding our partnership with BlueJ.%0D%0A%0D%0A[Please add your message here]%0D%0A%0D%0ABest regards,%0D%0A[Your Name]"
                  className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-xl text-white bg-slate-900 hover:bg-slate-800 shadow-lg transition-all"
                >
                  Contact BlueJ
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              ) : partner.slug === 'taxgpt' ? (
                <a
                  href="https://calendly.com/devin-taxgpt/taxproexchange-taxgpt-booknow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 shadow-lg transition-all"
                >
                  Request a Custom Demo
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              ) : partner.slug === 'truss' ? (
                <a
                  href="https://gettruss.link/koen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-xl text-white bg-slate-900 hover:bg-slate-800 shadow-lg transition-all"
                >
                  Book a Demo with Truss
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                partner.website && (
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-xl text-white bg-slate-900 hover:bg-slate-800 shadow-lg transition-all"
                  >
                    Visit {partner.name} Website
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )
              )}
            </div>
          </div>
        </section>

        {/* Quick Navigation to Webinars - TaxGPT only */}
        {partner.slug === 'taxgpt' && (
          <section className="py-8 bg-slate-50 border-b border-slate-200">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href="#webinar-part-1"
                    className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-xl text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm transition-all"
                  >
                    <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Webinar 1: Key Insights + Recording
                  </a>
                  <a
                    href="#webinar-part-2"
                    className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-xl text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm transition-all"
                  >
                    <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Webinar 2: Key Takeaways + Recording
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Special Offer CTA - Only show for non-Truss partners */}
        {partner.slug !== 'truss' && partner.slug !== 'taxgpt' && (
          <section className="py-16 bg-gradient-to-b from-white to-slate-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 p-8 md:p-12 text-white">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                      <span className="text-emerald-100 font-semibold">Exclusive Offer for TaxProExchange Members</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-4">
                      Try {partner.name} Today
                    </h2>
                    <p className="text-emerald-50 text-lg mb-6">
                      TaxProExchange members get exclusive access to {partner.name}&apos;s platform with special pricing and onboarding support.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      {partner.slug === 'bluej' ? (
                        <a
                          href="mailto:lara.bean@bluejlegal.com?subject=TaxProExchange Partnership Inquiry&body=Hi Lara,%0D%0A%0D%0AI'm reaching out from TaxProExchange regarding our partnership with BlueJ.%0D%0A%0D%0A[Please add your message here]%0D%0A%0D%0ABest regards,%0D%0A[Your Name]"
                          className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg transition-all"
                        >
                          Contact BlueJ
                          <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </a>
                      ) : (
                        <button
                          disabled
                          className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Sign Up - Special Offer
                          <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </button>
                      )}
                      <a
                        href={partner.website || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-xl bg-emerald-800 hover:bg-emerald-900 border border-emerald-600 transition-all"
                      >
                        Learn More
                      </a>
                    </div>
                    <p className="mt-4 text-sm text-emerald-100">
                      * Special pricing and offers coming soon
                    </p>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-emerald-500 rounded-full opacity-20 blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-emerald-400 rounded-full opacity-20 blur-3xl"></div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Resources & Collateral Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-900 mb-8">
                Resources & Collateral
              </h2>
              
              {partner.slug === 'truss' ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                  <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
                    <iframe
                      src="https://www.loom.com/embed/67140f8c9fcb4fd1ad745e92c2ebf5ef"
                      frameBorder="0"
                      allowFullScreen
                      className="absolute top-0 left-0 w-full h-full"
                      title="Truss Product Demo"
                    />
                  </div>
                </div>
              ) : partner.slug === 'taxgpt' ? (
                <div className="space-y-8">
                  <article id="webinar-part-1" className="rounded-2xl border border-slate-200 bg-slate-50 p-8 md:p-10 scroll-mt-8">
                    <div className="flex flex-col gap-6">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                          Webinar Recording
                        </p>
                        <h3 className="mt-2 text-2xl font-bold text-slate-900">
                          How to Reclaim Your Competitive Edge in 2026
                        </h3>
                        <p className="mt-4 text-base text-slate-600">
                          The first session in the <span className="italic">AI in Tax Practice</span> series examined the structural challenges reshaping the tax profession and how specialized AI tools can provide practical, risk-aware solutions.
                        </p>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">Key Insights</h4>
                        <ul className="mt-4 space-y-3 text-base text-slate-600">
                          <li>
                            <span className="font-semibold text-slate-900">The Profession Is at a Crossroads:</span> With nearly 70% of CPAs expected to retire within a decade and new entrants declining, firms face mounting workload pressure amid ever-growing code complexity.
                          </li>
                          <li>
                            <span className="font-semibold text-slate-900">Why General AI Falls Short:</span> Broad AI models like ChatGPT can&rsquo;t be trusted for professional use, they frequently &quot;hallucinate,&quot; rely on outdated data, and miss key technical and compliance nuances that matter in tax work.
                          </li>
                          <li>
                            <span className="font-semibold text-slate-900">The Rise of Specialized AI:</span> Tools like <strong>TaxGPT</strong> are trained exclusively on authoritative sources, Code, Regs, Rulings, Court Cases, and provide live citations for every answer so professionals can focus on higher-value advisory work.
                          </li>
                          <li>
                            <span className="font-semibold text-slate-900">The New Model for Productivity:</span> Attendees saw examples of how purpose-built AI can reduce research time by up to 80%, accelerate drafting, and enable document-based analysis of returns, notices, and financial statements while maintaining professional accuracy.
                          </li>
                          <li>
                            <span className="font-semibold text-slate-900">A Glimpse Ahead:</span> The session previewed &quot;agentic&quot; AI workflows that review returns, compare source documents, and flag risk or planning opportunities, signaling how AI may redefine review processes in 2026.
                          </li>
                        </ul>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <a
                          href="https://fathom.video/share/uDmwZ61kuh-Bk1z34qW8MwSnhZzQNetD"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg transition-all"
                        >
                          Watch the Recording
                          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </a>
                        <a
                          href="https://calendly.com/devin-taxgpt/taxproexchange-taxgpt-booknow"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-xl text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 shadow-lg transition-all"
                        >
                          Request a Custom Demo
                          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </a>
                      </div>
                      <p className="text-sm text-slate-500">
                        Access requires a verified email. Submit yours when prompted to unlock the recording.
                      </p>
                    </div>
                  </article>

                  <article id="webinar-part-2" className="rounded-2xl border border-slate-200 bg-white p-8 md:p-10 scroll-mt-8">
                    <div className="flex flex-col gap-6">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                          Webinar Recording
                        </p>
                        <h3 className="mt-2 text-2xl font-bold text-slate-900">
                          Part 2: How to Reclaim Your Competitive Edge in 2026
                        </h3>
                        <p className="mt-4 text-base text-slate-600">
                          The follow-up session dives into detailed examples and applied workflows from firm engagements, helping teams understand how specialized AI augments research, drafting, and review in practice.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <a
                          href="https://fathom.video/share/a79tTvfbuRR1N71CjtcgvjsyXAbsr2ag"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg transition-all"
                        >
                          Watch the Recording
                          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </a>
                        <a
                          href="https://calendly.com/devin-taxgpt/taxproexchange-taxgpt-booknow"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-xl text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 shadow-lg transition-all"
                        >
                          Request a Custom Demo
                          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </a>
                      </div>
                      <p className="text-sm text-slate-500">
                        Access requires a verified email. Submit yours when prompted to unlock the recording.
                      </p>
                      <div className="border-t border-slate-200 pt-6 mt-2">
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">
                          What Were Some Key Takeaways From the Second Session?
                        </h3>
                        <p className="text-base text-slate-600 mb-6">
                          In Part 2, we took a deep dive into the specifics of how firms use TaxGPT to reclaim their competitive edge in 2026. Unlike the broad overview of how firms can use TaxGPT to compete at the beginning of Part 1, the second session involved a walk-through of actual tax workflow examples so participants could see firsthand how firms are using TaxGPT to save time on prep, research, planning and client communications.
                        </p>
                        <p className="text-base text-slate-600 mb-8">
                          If You Are Evaluating an AI Tool to Implement Within Your Firm, Here Are the Insights That Matter:
                        </p>
                      </div>

                      <div className="space-y-8">
                        <div>
                          <h4 className="text-lg font-semibold text-slate-900 mb-3">
                            1. TaxGPT is NOT a search engine - it is a tax research + workflow copilot.
                          </h4>
                          <p className="text-base text-slate-600 mb-3">
                            CPAs generally begin using AI similar to the way they would use Google: asking very narrow questions, providing minimal context and receiving limited depth of response.
                          </p>
                          <p className="text-base text-slate-600 mb-3">
                            In the second session, participants saw how, as soon as you provide TaxGPT with all relevant information about your client (i.e., entities; income sources; fact pattern; states; prior year returns), the model will behave as a consultative research partner to provide assistance with:
                          </p>
                          <ul className="list-disc list-inside space-y-2 text-base text-slate-600 ml-4">
                            <li>documentation related to R&D tax credits</li>
                            <li>look-back years for research purposes</li>
                            <li>reasonable-basis memos</li>
                            <li>research citations</li>
                            <li>tax positions and work paper outlines</li>
                          </ul>
                          <p className="text-base text-slate-600 mt-3">
                            Ultimately, you do not simply receive answers - you also receive drafts of memoranda, client-explained concepts and audit-ready evidence to defend those concepts.
                          </p>
                        </div>

                        <div>
                          <h4 className="text-lg font-semibold text-slate-900 mb-3">
                            2. Document Upload and Analysis Has Become a Competency that Small Firms Must Possess
                          </h4>
                          <p className="text-base text-slate-600 mb-3">
                            Kevin demonstrated how firms are using TaxGPT to analyze prior-year S-Corporation and Partnership Returns; P&Ls and Balance Sheets; Trial Balances; Workpapers; Multi-State Filings Requirements.
                          </p>
                          <p className="text-base text-slate-600 mb-3">
                            Live Use Cases were demonstrated including:
                          </p>
                          <ul className="list-disc list-inside space-y-2 text-base text-slate-600 ml-4 mb-3">
                            <li>Tie-Outs: Finding Discrepancies Between P&Ls Filed in Prior Years and Actual Return (Even Down to Specific Accounts)</li>
                            <li>Documenting R&D Credit Information</li>
                            <li>Automatically Creating Schedules, Notes, and Bullet Points for Workpapers</li>
                            <li>Automatically Creating Lists of Items Clients Need to Provide</li>
                          </ul>
                          <p className="text-base text-slate-600">
                            If you ingest prior year returns before quoting, TaxGPT enables you to establish accurate pricing and mitigate scope creep for engagements.
                          </p>
                        </div>

                        <div>
                          <h4 className="text-lg font-semibold text-slate-900 mb-3">
                            3. Proposal Development and Pricing Will be Done Faster and More Defensively
                          </h4>
                          <p className="text-base text-slate-600 mb-3">
                            Most firms currently price engagements based upon memory, or by utilizing one of the many rigid proposal development tools available today.
                          </p>
                          <p className="text-base text-slate-600 mb-3">
                            TaxGPT demonstrated how to:
                          </p>
                          <ul className="list-disc list-inside space-y-2 text-base text-slate-600 ml-4 mb-3">
                            <li>Estimate Complexity Based Upon Reading Prior Year Returns</li>
                            <li>Identify Scope Items Clients Actually Need</li>
                            <li>Develop Proposal Language</li>
                            <li>Develop Engagement Letter Scope</li>
                            <li>Price Against National Quartiles</li>
                            <li>Defend the Price Justified to Clients</li>
                            <li>Save Approximately 30-60 minutes per New Engagement.</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-lg font-semibold text-slate-900 mb-3">
                            4. The Matrix Feature Will Save Hours of Time Searching for Multistate Rules
                          </h4>
                          <p className="text-base text-slate-600 mb-3">
                            Matrix is one of the features that has been demonstrated as the most powerful tool presented:
                          </p>
                          <ul className="list-disc list-inside space-y-2 text-base text-slate-600 ml-4 mb-3">
                            <li>State Business Income Tax Rules</li>
                            <li>Nexus Triggers</li>
                            <li>Filing Requirements</li>
                            <li>Due Dates & Extended Due Dates</li>
                            <li>Penalty Structures</li>
                            <li>Payment Portals</li>
                            <li>Sales Tax Considerations</li>
                            <li>Apportionment References</li>
                          </ul>
                          <p className="text-base text-slate-600">
                            Each Cell Becomes a Full Research Thread Complete with Sources - Not a Static Table.
                          </p>
                          <p className="text-base text-slate-600 mt-2">
                            Participants Compared it to &quot;Smart Charts, But Actually Useful&quot;.
                          </p>
                        </div>

                        <div>
                          <h4 className="text-lg font-semibold text-slate-900 mb-3">
                            5. The Real-World Tax Planning Scenarios Demonstrated How Far TaxGPT Can Go
                          </h4>
                          <p className="text-base text-slate-600 mb-3">
                            The Group Walked Through Multiple Planning Scenarios Including:
                          </p>
                          <ul className="list-disc list-inside space-y-2 text-base text-slate-600 ml-4 mb-3">
                            <li>Planning Options for Service Providers Who Own an S-Corporation</li>
                            <li>Divorce Planning Where There is a Business and/or Real Estate Split</li>
                            <li>Retirement Planning (tax, property, and estate angles)</li>
                            <li>Choosing Entity Structure When Spouses Operate Businesses</li>
                            <li>Implications of Depreciation, Filing Status, and Section 1041</li>
                            <li>Whether Elderly Clients Need Active Planning</li>
                            <li>Moving Assets From Dormant Schedule C Businesses to Investments</li>
                          </ul>
                          <p className="text-base text-slate-600 mb-3">
                            Findings Included:
                          </p>
                          <ul className="list-disc list-inside space-y-2 text-base text-slate-600 ml-4 mb-3">
                            <li>TaxGPT Can Create Entire Planning Workflows</li>
                            <li>TaxGPT Can Generate First-Draft Strategy List</li>
                            <li>TaxGPT Can Validate Your Own Strategies</li>
                            <li>TaxGPT Will Not Propose Investment Products (Compliance-Safe)</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-lg font-semibold text-slate-900 mb-3">
                            6. AI Does Not Replace Professionals - It Enhances the Work You Already Do
                          </h4>
                          <p className="text-base text-slate-600 mb-3">
                            TaxGPT Clearly Reiterated the Following:
                          </p>
                          <ul className="list-disc list-inside space-y-2 text-base text-slate-600 ml-4 mb-3">
                            <li>No &quot;Upload and Auto-File&quot; Return Generation</li>
                            <li>Professionals Remain Involved</li>
                            <li>AI Accelerates Research, Analysis, and Drafting</li>
                            <li>AI Enables Busywork Reduction, Not Expert Elimination</li>
                          </ul>
                          <p className="text-base text-slate-600">
                            This is Important for Compliance Under §7216 and Trust With Clients.
                          </p>
                        </div>

                        <div>
                          <h4 className="text-lg font-semibold text-slate-900 mb-3">
                            7. Engagement Letters, Client Emails and Documentation Will Be Created Automatically
                          </h4>
                          <p className="text-base text-slate-600 mb-3">
                            Kevin Demonstrated How the Writing Tools:
                          </p>
                          <ul className="list-disc list-inside space-y-2 text-base text-slate-600 ml-4 mb-3">
                            <li>Create Clear Client Request Lists</li>
                            <li>Create Engagement Letter Scopes</li>
                            <li>Create Planning Summaries for Clients</li>
                            <li>Create Internal Memos</li>
                            <li>Create Proposals Tailored to Specific Fact Patterns</li>
                          </ul>
                          <p className="text-base text-slate-600">
                            The More Context You Upload, the Better the Output.
                          </p>
                    </div>

                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                          <h4 className="text-lg font-semibold text-slate-900 mb-3">
                            Why These Concepts Are Important For Firms Entering 2026
                          </h4>
                          <p className="text-base text-slate-600 mb-4">
                            Now firms can:
                          </p>
                          <ul className="list-disc list-inside space-y-2 text-base text-slate-600 ml-4 mb-4">
                            <li>Do Research Faster</li>
                            <li>Have Cleaner Workpapers</li>
                            <li>Have Stronger Documentation</li>
                            <li>Price More Accurately</li>
                            <li>Complete Meaningful Tax Planning</li>
                            <li>Communicate More Confidently With Clients</li>
                            <li>Spend Less Time Digging Through PDFs or State Sites</li>
                          </ul>
                          <p className="text-base text-slate-600 font-semibold">
                            And Most Importantly: There is No Other Tool That Combines Domain-Specific Training with Full Research Threads, Citations, and Document Analysis Like TaxGPT.
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                          <h4 className="text-lg font-semibold text-slate-900 mb-3">
                            See How This Applies to Your Firm
                          </h4>
                          <p className="text-base text-slate-600 mb-4">
                            If you want to understand exactly how TaxGPT fits your workflows - research, planning, prep, proposals, or state work - the fastest way is to walk through your own fact patterns live.
                          </p>
                        <a
                          href="https://calendly.com/devin-taxgpt/taxproexchange-taxgpt-booknow"
                          target="_blank"
                          rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg transition-all"
                        >
                          Request a Custom Demo
                          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </a>
                          <p className="text-sm text-slate-500 mt-3">
                            We&apos;ll tailor it to your firm&apos;s size, tools, service mix, and use cases.
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>

                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PDFs & Documents */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-slate-900">Documents</h3>
                  </div>
                  <p className="text-slate-600 text-sm mb-4">
                    Product sheets, case studies, and integration guides
                  </p>
                  <div className="text-sm text-slate-500 italic">
                    Coming soon
                  </div>
                </div>

                {/* Webinars */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-slate-900">Webinars</h3>
                  </div>
                  <p className="text-slate-600 text-sm mb-4">
                    Live demos and recorded training sessions
                  </p>
                  <div className="text-sm text-slate-500 italic">
                    Coming soon
                  </div>
                </div>

                {/* Recordings */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-slate-900">Video Library</h3>
                  </div>
                  <p className="text-slate-600 text-sm mb-4">
                    Product walkthroughs and customer testimonials
                  </p>
                  <div className="text-sm text-slate-500 italic">
                    Coming soon
                  </div>
                </div>

                {/* One-Pagers */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-slate-900">One-Pagers</h3>
                  </div>
                  <p className="text-slate-600 text-sm mb-4">
                    Quick reference guides and feature summaries
                  </p>
                  <div className="text-sm text-slate-500 italic">
                    Coming soon
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>
        </section>

        {/* Contact Section / AI Review Wall for Truss */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              {partner.slug === 'truss' && trussData ? (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-slate-900">
                      AI Review Wall
                    </h2>
                    <Link
                      href="/ai/tools"
                      className="inline-flex items-center gap-2 text-base font-medium text-[#FF4500] hover:text-[#FF5700] transition-colors"
                    >
                      View Full Wall
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                  <TrussDetailInline
                    tool={trussData.tool}
                    reviews={trussData.reviews}
                    collateralLinks={trussData.collateralLinks}
                    sentiment={trussData.sentiment}
                  />
                </>
              ) : partner.slug === 'truss' ? (
                <div className="text-center py-12">
                  <p className="text-slate-600">Truss tool data not available.</p>
                </div>
              ) : partner.slug === 'taxgpt' ? null : (
            <div className="max-w-4xl mx-auto">
              <div className="rounded-2xl border border-slate-200 bg-white p-8 md:p-12">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0">
                    <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">
                      Get in Touch
                    </h2>
                    <p className="text-slate-600 mb-6">
                      Have questions about {partner.name} or want to learn more about their solutions for tax professionals? Reach out directly.
                    </p>
                    <div className="space-y-4">
                      {partner.slug === 'bluej' ? (
                        <div className="flex items-center gap-3 text-slate-700">
                          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <a 
                            href="mailto:lara.bean@bluejlegal.com?subject=TaxProExchange Partnership Inquiry&body=Hi Lara,%0D%0A%0D%0AI'm reaching out from TaxProExchange regarding our partnership with BlueJ.%0D%0A%0D%0A[Please add your message here]%0D%0A%0D%0ABest regards,%0D%0A[Your Name]"
                            className="hover:text-emerald-600 transition-colors"
                          >
                            lara.bean@bluejlegal.com
                          </a>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 text-slate-700">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            <a href={partner.website} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition-colors">
                              {partner.website.replace('https://', '')}
                            </a>
                          </div>
                          <div className="flex items-center gap-3 text-slate-700">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="text-slate-500 italic">Contact email coming soon</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
              )}
            </div>
          </div>
        </section>

        {/* Related Partners */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">
                Other Technology Partners
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {partnersData
                .filter((p) => p.slug !== partner.slug)
                .map((relatedPartner) => (
                  <Link
                    key={relatedPartner.id}
                    href={`/partners/${relatedPartner.slug}`}
                    className="block rounded-xl border border-slate-200 bg-white p-6 hover:shadow-lg hover:border-slate-300 transition-all"
                  >
                    <h3 className="font-semibold text-slate-900 mb-2">
                      {relatedPartner.name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {relatedPartner.tagline}
                    </p>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

