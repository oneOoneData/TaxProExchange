import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { siteUrl, partnerOrganizationLD, jsonLd } from '@/lib/seo';
import AnalyticsPageView from '@/components/analytics/AnalyticsPageView';
import AppNavigation from '@/components/AppNavigation';

export const metadata: Metadata = {
  title: 'TaxGPT – AI Tax Research & Document Automation | TaxProExchange',
  description: 'Official partner page for TaxGPT on TaxProExchange. Learn how TaxGPT delivers authoritative research, powerful document analysis, and compliance-safe AI workflows for modern tax firms.',
  alternates: {
    canonical: `${siteUrl}/partners/taxgpt`,
  },
  openGraph: {
    title: 'TaxGPT – AI Tax Research & Document Automation | TaxProExchange',
    description: 'Official partner page for TaxGPT on TaxProExchange. Learn how TaxGPT delivers authoritative research, powerful document analysis, and compliance-safe AI workflows for modern tax firms.',
    url: `${siteUrl}/partners/taxgpt`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaxGPT – AI Tax Research & Document Automation | TaxProExchange',
    description: 'Official partner page for TaxGPT on TaxProExchange.',
  },
};

export default function TaxGPTPartnerPage() {
  const organizationSchema = partnerOrganizationLD({
    name: 'TaxGPT',
    slug: 'taxgpt',
    tagline: 'Conversational AI for tax guidance',
    description: 'TaxGPT provides instant, AI-powered answers to complex tax questions, helping professionals research efficiently and serve clients faster.',
    website: 'https://taxgpt.com',
    category: 'AI Tax Technology',
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
            <span className="text-slate-900">TaxGPT</span>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="max-w-4xl mx-auto text-center">
              {/* Logo */}
              <div className="flex items-center justify-center h-24 w-24 mx-auto mb-6 rounded-2xl bg-white overflow-hidden">
                <Image
                  src="https://rzbfkdicrhdharyzfmul.supabase.co/storage/v1/object/public/ai-tool-logos/taxgpt.jpg"
                  alt="TaxGPT logo"
                  width={96}
                  height={96}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Category Badge */}
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium mb-4">
                AI Tax Technology
              </div>

              {/* Partner Name */}
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                TaxGPT - AI Tax Research & Document Automation
              </h1>

              {/* Tagline */}
              <p className="text-xl text-slate-600 mb-4">
                Conversational AI for tax guidance
              </p>

              {/* SEO Paragraph */}
              <p className="text-base text-slate-600 max-w-3xl mx-auto mb-6">
                TaxGPT is a specialized AI tax research platform used by CPAs, EAs, and tax preparers to accelerate research, strengthen documentation, and safely analyze returns with real citations. Learn more about <Link href="/ai/tools" className="text-emerald-600 hover:text-emerald-700 underline">AI tax tools</Link> and <Link href="/ai/7216" className="text-emerald-600 hover:text-emerald-700 underline">§7216 compliance</Link>.
              </p>

              {/* Description */}
              <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
                TaxGPT provides instant, AI-powered answers to complex tax questions, helping professionals research efficiently and serve clients faster.
              </p>

              {/* CTA Button */}
              <a
                href="https://calendly.com/devin-taxgpt/taxproexchange-taxgpt-booknow"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 shadow-lg transition-all mb-4"
              >
                Request a Custom Demo
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* Quick Navigation to Webinars */}
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

        {/* Main Content */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-12">
              {/* What Is TaxGPT */}
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                  What Is TaxGPT?
                </h2>
                <p className="text-lg text-slate-600 mb-4">
                  TaxGPT is an AI-powered research and document analysis engine built specifically for tax professionals.
                </p>
                <p className="text-lg text-slate-600 mb-4">
                  Unlike general chatbots, TaxGPT is trained exclusively on authoritative tax law sources — the Internal Revenue Code, Treasury Regulations, IRS guidance, court cases, and technical publications. Every answer includes <strong>live citations</strong>, allowing practitioners to verify conclusions instantly.
                </p>
                <p className="text-lg text-slate-600">
                  This makes TaxGPT a practical, compliance-aware tool for research, planning, review, and client communication.
                </p>
              </div>

              <hr className="my-10 border-slate-200" />

              {/* Why TaxProExchange Recommends TaxGPT */}
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                  Why TaxProExchange Recommends TaxGPT
                </h2>
                <p className="text-lg text-slate-600 mb-4">
                  After reviewing dozens of AI tools for accountants and tax professionals, TaxGPT stands out because it:
                </p>
                <ul className="list-disc list-inside space-y-2 text-lg text-slate-600 ml-4 mb-6">
                  <li>Uses domain-specific tax training, not generic internet data</li>
                  <li>Provides <strong>real citations</strong>, never invented sources</li>
                  <li>Analyzes tax documents such as prior-year returns, financial statements, notices, and workpapers</li>
                  <li>Handles multi-state complexity with the <strong>Matrix</strong> feature</li>
                  <li>Generates defensive workpapers, memos, engagement letter language, and client-ready explanations</li>
                  <li>Operates with built-in <Link href="/ai/7216" className="text-emerald-600 hover:text-emerald-700 underline">§7216</Link> awareness and does <strong>not</strong> auto-file returns</li>
                </ul>
                <p className="text-lg text-slate-600 mb-4">
                  If your firm wants to reduce research time while strengthening accuracy and defensibility, TaxGPT is the tool we recommend. Learn more about the <Link href="/ai/state-of-ai-in-tax-firms-2025" className="text-emerald-600 hover:text-emerald-700 underline">state of AI in tax firms</Link>.
                </p>
              </div>

              <hr className="my-10 border-slate-200" />

              {/* Key Capabilities */}
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-8">
                  Key Capabilities
                </h2>
                
                <div className="space-y-8">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">
                      {/* Icon: Research */}
                      Research With Live Citations
                    </h3>
                    <p className="text-base text-slate-600 mb-3">
                      TaxGPT acts as a research copilot, producing:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-base text-slate-600 ml-4">
                      <li>Multi-factor legal analysis</li>
                      <li>Workpaper outlines</li>
                      <li>Reasonable-basis memos</li>
                      <li>Explanation drafts for clients</li>
                      <li>Fully sourced research threads</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">
                      {/* Icon: Document */}
                      Document Upload & Review
                    </h3>
                    <p className="text-base text-slate-600 mb-3">
                      Upload PDFs or spreadsheets to:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-base text-slate-600 ml-4">
                      <li>Analyze prior-year S-corps, partnerships, and 1040s</li>
                      <li>Compare P&Ls vs filed returns</li>
                      <li>Identify discrepancies</li>
                      <li>Generate schedules, bullet points, and client request lists</li>
                      <li>Surface multi-state exposure</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">
                      {/* Icon: Multistate */}
                      Multi-State Matrix (Most Popular Feature)
                    </h3>
                    <p className="text-base text-slate-600 mb-3">
                      A single view showing:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-base text-slate-600 ml-4">
                      <li>Nexus triggers</li>
                      <li>Filing requirements</li>
                      <li>Payment portals</li>
                      <li>Extended due dates</li>
                      <li>Penalty structures</li>
                      <li>Apportionment references</li>
                    </ul>
                    <p className="text-base text-slate-600 mt-3">
                      Every cell expands into a complete research thread with citations.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">
                      {/* Icon: Pricing */}
                      Proposal & Pricing Automation
                    </h3>
                    <p className="text-base text-slate-600 mb-3">
                      TaxGPT helps firms quickly:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-base text-slate-600 ml-4">
                      <li>Identify scope items</li>
                      <li>Estimate complexity</li>
                      <li>Draft engagement letter scopes</li>
                      <li>Price against national quartiles</li>
                      <li>Save 30–60 minutes per new engagement</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">
                      {/* Icon: Planning */}
                      Planning Scenarios
                    </h3>
                    <p className="text-base text-slate-600 mb-3">
                      Supports scenario modeling for:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-base text-slate-600 ml-4">
                      <li>S-corp optimization</li>
                      <li>Divorce planning</li>
                      <li>Real estate splits</li>
                      <li>Retirement planning and §1041</li>
                      <li>Choice of entity</li>
                      <li>Depreciation strategies</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Mid-Page CTA */}
              <div className="mt-10 mb-6">
                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 p-8 md:p-10 text-center">
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">Ready to see TaxGPT on your data?</h2>
                  <p className="text-base text-slate-600 mb-6">
                    Upload a prior-year return, a P&L, or a multistate scenario — we&apos;ll walk through it live.
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
                </div>
              </div>

              <hr className="my-10 border-slate-200" />

              {/* TaxGPT vs ChatGPT */}
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-6">
                  TaxGPT vs ChatGPT (What Tax Pros Need to Know)
                </h2>
                <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Feature</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">TaxGPT</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">ChatGPT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">Training Data</td>
                          <td className="px-6 py-4 text-sm text-slate-600">Authoritative tax law</td>
                          <td className="px-6 py-4 text-sm text-slate-600">General internet</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">Citations</td>
                          <td className="px-6 py-4 text-sm text-slate-600">Always real</td>
                          <td className="px-6 py-4 text-sm text-slate-600">Often fabricated</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">Document Review</td>
                          <td className="px-6 py-4 text-sm text-slate-600">Yes, tax-specific</td>
                          <td className="px-6 py-4 text-sm text-slate-600">Generic OCR</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">Multi-State Rules</td>
                          <td className="px-6 py-4 text-sm text-slate-600">Matrix</td>
                          <td className="px-6 py-4 text-sm text-slate-600">None</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">§7216 Compliance</td>
                          <td className="px-6 py-4 text-sm text-slate-600">Designed for firm workflows</td>
                          <td className="px-6 py-4 text-sm text-slate-600">Not designed for tax practice</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">Output Style</td>
                          <td className="px-6 py-4 text-sm text-slate-600">Workpapers, memos, planning</td>
                          <td className="px-6 py-4 text-sm text-slate-600">Generic explanation</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">Use Case</td>
                          <td className="px-6 py-4 text-sm text-slate-600">Professional tax work</td>
                          <td className="px-6 py-4 text-sm text-slate-600">Brainstorming & drafting</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-base text-slate-900 font-semibold mb-2">Bottom line:</p>
                  <p className="text-base text-slate-600">
                    ChatGPT is great for general writing. <strong>TaxGPT is built for professional tax compliance and defensible research.</strong>
                  </p>
                </div>
              </div>

              <hr className="my-10 border-slate-200" />

              {/* Webinar Recordings */}
              <div className="space-y-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-6">
                  Webinar Recordings
                </h2>

                {/* Webinar 1 */}
                <article id="webinar-part-1" className="rounded-2xl border border-slate-200 bg-slate-50 p-8 md:p-10 scroll-mt-8">
                  <div className="flex flex-col gap-6">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                        Webinar Recording
                      </p>
                      <h3 className="mt-2 text-2xl font-bold text-slate-900">
                        Session 1 — How to Reclaim Your Competitive Edge in 2026
                      </h3>
                      <p className="mt-4 text-base text-slate-600">
                        A strategic overview of workforce shortages, rising complexity, and how specialized AI helps firms increase capacity.
                      </p>
                    </div>
                    <a
                      href="https://fathom.video/share/uDmwZ61kuh-Bk1z34qW8MwSnhZzQNetD"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block border border-emerald-600 text-emerald-700 px-4 py-2 rounded-lg font-medium hover:bg-emerald-50 transition"
                    >
                      Watch the Recording
                    </a>
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                      <p className="text-sm font-medium text-amber-900">
                        Access requires a verified email. Submit yours when prompted to unlock the recording.
                      </p>
                    </div>
                  </div>
                </article>

                {/* Webinar 2 */}
                <article id="webinar-part-2" className="rounded-2xl border border-slate-200 bg-white p-8 md:p-10 scroll-mt-8">
                  <div className="flex flex-col gap-6">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                        Webinar Recording
                      </p>
                      <h3 className="mt-2 text-2xl font-bold text-slate-900">
                        Session 2 — Applied TaxGPT Workflows (Live Walkthroughs)
                      </h3>
                      <p className="mt-4 text-base text-slate-600">
                        Deep-dive demonstrations of how firms use TaxGPT for research, review, planning, and proposals.
                      </p>
                    </div>
                    <a
                      href="https://fathom.video/share/a79tTvfbuRR1N71CjtcgvjsyXAbsr2ag"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block border border-emerald-600 text-emerald-700 px-4 py-2 rounded-lg font-medium hover:bg-emerald-50 transition"
                    >
                      Watch the Recording
                    </a>
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                      <p className="text-sm font-medium text-amber-900">
                        Access requires a verified email. Submit yours when prompted to unlock the recording.
                      </p>
                    </div>
                  </div>
                </article>
              </div>

              <hr className="my-10 border-slate-200" />

              {/* Is TaxGPT Right for Your Firm */}
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                  Is TaxGPT Right for Your Firm?
                </h2>
                <p className="text-lg text-slate-600 mb-4">
                  TaxGPT is a strong fit if your team wants to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-lg text-slate-600 ml-4 mb-6">
                  <li>Reduce research time</li>
                  <li>Improve workpaper quality</li>
                  <li>Strengthen documentation</li>
                  <li>Price more accurately</li>
                  <li>Increase planning capacity</li>
                  <li>Manage multi-state risk</li>
                  <li>Reduce administrative overhead</li>
                </ul>
                <p className="text-lg text-slate-600 mb-6">
                  If your firm interacts with research, planning, or document review, TaxGPT is worth seeing live.
                </p>
              </div>

              {/* Final CTA */}
              <div className="mt-10 mb-6">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 md:p-10">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Request a Custom Demo</h2>
                  <p className="text-base text-slate-600 mb-6">
                    We&apos;ll tailor the walkthrough to your:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-base text-slate-600 ml-4 mb-6">
                    <li>firm size</li>
                    <li>states served</li>
                    <li>client mix</li>
                    <li>workflow needs</li>
                  </ul>
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
                </div>
              </div>

              {/* Link to Deep Dive */}
              <div className="rounded-2xl border border-slate-200 bg-white p-8 md:p-10 text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Want the Full Deep Dive?</h2>
                <p className="text-base text-slate-600 mb-6">
                  For detailed workflows, examples, and advanced use cases, see:
                </p>
                <Link
                  href="/partners/taxgpt/deep-dive"
                  className="inline-block border border-emerald-600 text-emerald-700 px-4 py-2 rounded-lg font-medium hover:bg-emerald-50 transition"
                >
                  TaxGPT Deep Dive →
                </Link>
              </div>
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
              <Link
                href="/partners/bluej"
                className="block rounded-xl border border-slate-200 bg-white p-6 hover:shadow-lg hover:border-slate-300 transition-all"
              >
                <h3 className="font-semibold text-slate-900 mb-2">BlueJ</h3>
                <p className="text-sm text-slate-600">AI-powered tax research and compliance platform</p>
              </Link>
              <Link
                href="/partners/truss"
                className="block rounded-xl border border-slate-200 bg-white p-6 hover:shadow-lg hover:border-slate-300 transition-all"
              >
                <h3 className="font-semibold text-slate-900 mb-2">Truss</h3>
                <p className="text-sm text-slate-600">Intelligent document processing for tax firms</p>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
