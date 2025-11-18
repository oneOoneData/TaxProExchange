import { Metadata } from 'next';
import Link from 'next/link';
import { siteUrl } from '@/lib/seo';
import AnalyticsPageView from '@/components/analytics/AnalyticsPageView';
import AppNavigation from '@/components/AppNavigation';

export const metadata: Metadata = {
  title: 'TaxGPT Deep Dive: Applied Workflows, Research Examples & Real Firm Use Cases | TaxProExchange',
  description: 'A comprehensive deep dive into how TaxGPT supports tax research, document analysis, multistate workflows, pricing, and planning. Learn how CPAs and EAs use TaxGPT to strengthen documentation, reduce research time, and deliver higher-quality advisory work.',
  alternates: {
    canonical: `${siteUrl}/partners/taxgpt/deep-dive`,
  },
  openGraph: {
    title: 'TaxGPT Deep Dive: Applied Workflows, Research Examples & Real Firm Use Cases | TaxProExchange',
    description: 'A comprehensive deep dive into how TaxGPT supports tax research, document analysis, multistate workflows, pricing, and planning. Learn how CPAs and EAs use TaxGPT to strengthen documentation, reduce research time, and deliver higher-quality advisory work.',
    url: `${siteUrl}/partners/taxgpt/deep-dive`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaxGPT Deep Dive: Applied Workflows, Research Examples & Real Firm Use Cases',
    description: 'A comprehensive deep dive into how TaxGPT supports tax research, document analysis, multistate workflows, pricing, and planning.',
  },
};

export default function TaxGPTDeepDivePage() {
  return (
    <>
      <AnalyticsPageView eventName="view_partner_deep_dive" />
      <AppNavigation />

      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-slate-600">
            <Link href="/partners" className="hover:text-slate-900">
              Partners
            </Link>
            <span>→</span>
            <Link href="/partners/taxgpt" className="hover:text-slate-900">
              TaxGPT
            </Link>
            <span>→</span>
            <span className="text-slate-900">Deep Dive</span>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                TaxGPT Deep Dive: How Firms Use AI to Reclaim Their Competitive Edge in 2026
              </h1>
              <p className="text-xl text-slate-600 mb-8">
                This guide expands on the webinar series and walks through detailed examples of how tax firms use TaxGPT to streamline research, planning, document review, and engagement workflows.
              </p>
              
              {/* Quick Navigation */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4">On this page:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <a href="#not-search-engine" className="text-sm text-slate-600 hover:text-emerald-600 transition-colors">
                    Not a Search Engine
                  </a>
                  <a href="#document-upload" className="text-sm text-slate-600 hover:text-emerald-600 transition-colors">
                    Document Upload & Analysis
                  </a>
                  <a href="#proposals" className="text-sm text-slate-600 hover:text-emerald-600 transition-colors">
                    Proposals & Pricing
                  </a>
                  <a href="#matrix" className="text-sm text-slate-600 hover:text-emerald-600 transition-colors">
                    Multi-State Matrix
                  </a>
                  <a href="#planning" className="text-sm text-slate-600 hover:text-emerald-600 transition-colors">
                    Planning Scenarios
                  </a>
                  <a href="#documentation" className="text-sm text-slate-600 hover:text-emerald-600 transition-colors">
                    Documentation
                  </a>
                  <a href="#impact" className="text-sm text-slate-600 hover:text-emerald-600 transition-colors">
                    2026 Impact
                  </a>
                  <a href="#demo" className="text-sm text-slate-600 hover:text-emerald-600 transition-colors">
                    Demo CTA
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-16">
              {/* Section 1 */}
              <div id="not-search-engine" className="scroll-mt-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-6">
                  1. TaxGPT Is Not a Search Engine
                </h2>
                <p className="text-lg text-slate-600 mb-4">
                  Most professionals start by treating AI like Google: <strong>short queries, little context, and surface-level answers</strong>.
                </p>
                <p className="text-lg text-slate-600 mb-6">
                  TaxGPT behaves differently. Once you provide relevant information — entities, states, fact patterns, prior returns, income sources, planning goals — it shifts into a consultative research assistant.
                </p>
                <div className="mt-8">
                  <p className="text-lg text-slate-600 mb-4 font-semibold">
                    Firms use TaxGPT to generate:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-lg text-slate-600 ml-4 mb-6">
                    <li>Workpaper outlines</li>
                    <li>Reasonable-basis memos</li>
                    <li>R&D credit documentation</li>
                    <li>Research citations</li>
                    <li>Tax position summaries</li>
                    <li>Client-ready explanations</li>
                    <li>Draft letters and planning notes</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                  <p className="text-lg text-slate-900 font-semibold">
                    Bottom line: You don&apos;t just receive answers — you receive <strong>defensible, documented analysis</strong>.
                  </p>
                </div>
              </div>

              <hr className="my-10 border-slate-200" />

              {/* Section 2 */}
              <div id="document-upload" className="scroll-mt-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-6">
                  2. Document Upload & Analysis
                </h2>
                <p className="text-lg text-slate-600 mb-4">
                  Firms demonstrated how TaxGPT analyzes:
                </p>
                <ul className="list-disc list-inside space-y-2 text-lg text-slate-600 ml-4 mb-8">
                  <li>Prior-year S-corporation and partnership returns</li>
                  <li>Multi-state filings</li>
                  <li>Trial balances</li>
                  <li>Financial statements</li>
                  <li>Workpapers</li>
                  <li>Client-provided spreadsheets</li>
                  <li>IRS notices</li>
                </ul>

                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Live examples included:</h3>
                  
                  <div className="space-y-6">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Tie-Outs:</h3>
                      <p className="text-base text-slate-600">
                        Finding discrepancies between P&Ls and filed returns, <strong>down to individual accounts</strong>.
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">R&D Credits:</h3>
                      <p className="text-base text-slate-600">
                        Documenting inputs, lookback years, and <strong>audit-ready narratives</strong>.
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Workpaper Generation:</h3>
                      <p className="text-base text-slate-600">
                        Schedules, bullets, and notes <strong>created automatically from a PDF</strong>.
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Client Request Lists:</h3>
                      <p className="text-base text-slate-600">
                        TaxGPT identifies missing documents and <strong>produces a checklist</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                  <p className="text-lg text-slate-600">
                    <strong>Key insight:</strong> When firms ingest prior-year returns <em>before quoting</em>, they dramatically reduce scope creep.
                  </p>
                </div>
              </div>

              <hr className="my-10 border-slate-200" />

              {/* Section 3 */}
              <div id="proposals" className="scroll-mt-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-6">
                  3. Proposal Development & Defensive Pricing
                </h2>
                <p className="text-lg text-slate-600 mb-4">
                  Most firms price engagements based on <strong>memory or rigid proposal tools</strong>.
                </p>
                <p className="text-lg text-slate-600 mb-4">
                  TaxGPT helps teams:
                </p>
                <ul className="list-disc list-inside space-y-2 text-lg text-slate-600 ml-4 mb-6">
                  <li>Analyze complexity by reading prior-year returns</li>
                  <li>Identify what the client truly needs</li>
                  <li>Draft scope language for engagement letters</li>
                  <li>Reference national pricing quartiles</li>
                  <li>Defend the quoted price with logic</li>
                  <li><strong>Save 30–60 minutes per proposal</strong></li>
                </ul>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                  <p className="text-lg text-slate-600">
                    Teams found that pricing became <strong>more accurate and more defensible</strong>.
                  </p>
                </div>
              </div>

              <hr className="my-10 border-slate-200" />

              {/* Section 4 */}
              <div id="matrix" className="scroll-mt-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-6">
                  4. The Multi-State Matrix
                </h2>
                <p className="text-lg text-slate-600 mb-4">
                  One of the <strong>most praised features</strong> in the demonstration.
                </p>
                <p className="text-lg text-slate-600 mb-4">
                  The Matrix provides:
                </p>
                <ul className="list-disc list-inside space-y-2 text-lg text-slate-600 ml-4 mb-6">
                  <li>State business income tax rules</li>
                  <li>Nexus triggers</li>
                  <li>Filing requirements</li>
                  <li>Due dates and extensions</li>
                  <li>Penalty structures</li>
                  <li>Payment portals</li>
                  <li>Apportionment references</li>
                </ul>
                <p className="text-lg text-slate-600 mb-6">
                  Each cell expands into a <em>full research thread</em> supported by citations.
                </p>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                  <p className="text-base text-slate-900 italic">
                    Participants described it as: &quot;Smart Charts, but actually useful.&quot;
                  </p>
                </div>
              </div>

              <hr className="my-10 border-slate-200" />

              {/* Section 5 */}
              <div id="planning" className="scroll-mt-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-6">
                  5. Planning Scenarios
                </h2>
                <p className="text-lg text-slate-600 mb-6">
                  The group walked through multiple real-world planning examples, including:
                </p>

                <div className="space-y-6">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">S-Corporation Optimization</h3>
                    <ul className="list-disc list-inside space-y-2 text-base text-slate-600 ml-4">
                      <li>Reasonable compensation context</li>
                      <li>Dividends, basis, and QBI angles</li>
                      <li>Multi-state considerations</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">Divorce Planning with Business/Real Estate Splits</h3>
                    <ul className="list-disc list-inside space-y-2 text-base text-slate-600 ml-4">
                      <li>§1041</li>
                      <li>Property division modeling</li>
                      <li>Impact on depreciation and filing status</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">Retirement & Wealth Planning</h3>
                    <ul className="list-disc list-inside space-y-2 text-base text-slate-600 ml-4">
                      <li>Tax, estate, and property implications</li>
                      <li>Sequencing strategies</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">Entity Choice for Married Business Owners</h3>
                    <ul className="list-disc list-inside space-y-2 text-base text-slate-600 ml-4">
                      <li>LLC vs S-corp</li>
                      <li>Basis planning</li>
                      <li>Multi-state filing expectations</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">Dormant Schedule C Wind-Down</h3>
                    <ul className="list-disc list-inside space-y-2 text-base text-slate-600 ml-4">
                      <li>When to close</li>
                      <li>Treatment of remaining assets</li>
                      <li>Planning opportunities</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">Findings:</h3>
                  <ul className="list-disc list-inside space-y-2 text-lg text-slate-600 ml-4">
                    <li>TaxGPT can create <strong>full planning workflow outlines</strong></li>
                    <li>Validate your own strategies</li>
                    <li>Produce client-ready explanations</li>
                    <li>Avoid recommending investment products <strong>(compliance-safe)</strong></li>
                  </ul>
                </div>
              </div>

              <hr className="my-10 border-slate-200" />

              {/* Section 6 */}
              <div className="scroll-mt-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-6">
                  6. AI Does Not Replace Professionals
                </h2>
                <p className="text-lg text-slate-600 mb-4">
                  TaxGPT was clear on the boundaries:
                </p>
                <ul className="list-disc list-inside space-y-2 text-lg text-slate-600 ml-4 mb-6">
                  <li><strong>No &quot;upload and auto-file&quot; shortcut</strong></li>
                  <li>Practitioners remain in control</li>
                  <li>AI accelerates research and drafting</li>
                  <li>Human judgment guides conclusions</li>
                </ul>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                  <p className="text-lg text-slate-600">
                    This is essential for <Link href="/ai/7216" className="text-emerald-600 hover:text-emerald-700 underline font-semibold">§7216 compliance</Link> and client trust.
                  </p>
                </div>
              </div>

              <hr className="my-10 border-slate-200" />

              {/* Section 7 */}
              <div id="documentation" className="scroll-mt-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-6">
                  7. Documentation & Client Communications
                </h2>
                <p className="text-lg text-slate-600 mb-4">
                  Kevin demonstrated how TaxGPT automatically generates:
                </p>
                <ul className="list-disc list-inside space-y-2 text-lg text-slate-600 ml-4 mb-6">
                  <li>Client request lists</li>
                  <li>Engagement letter scopes</li>
                  <li>Internal memos</li>
                  <li>Planning summaries</li>
                  <li>Proposal language tied to fact patterns</li>
                </ul>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                  <p className="text-lg text-slate-600">
                    <strong>Key principle:</strong> The more context uploaded, the more precise the outputs.
                  </p>
                </div>
              </div>

              <hr className="my-10 border-slate-200" />

              {/* Section 8 */}
              <div id="impact" className="scroll-mt-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-6">
                  8. What This Means for Firms Entering 2026
                </h2>
                <p className="text-lg text-slate-600 mb-4">
                  Firms can now:
                </p>
                <ul className="list-disc list-inside space-y-2 text-lg text-slate-600 ml-4 mb-8">
                  <li><strong>Perform research dramatically faster</strong></li>
                  <li>Maintain cleaner, more defensible workpapers</li>
                  <li>Strengthen documentation for audit protection</li>
                  <li>Price engagements with confidence</li>
                  <li>Complete real tax planning, not just compliance</li>
                  <li>Communicate more clearly with clients</li>
                  <li>Reduce time spent digging through PDFs or navigating state sites</li>
                </ul>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                  <p className="text-lg text-slate-900 font-semibold mb-2">
                    Most importantly:
                  </p>
                  <p className="text-lg text-slate-600">
                    No other tool combines authoritative training, research threads, citations, document analysis, and workflow support the way TaxGPT does.
                  </p>
                </div>
              </div>

              <hr className="my-10 border-slate-200" />

              {/* Webinar Recordings - Condensed */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-slate-900 mb-6">
                  Webinar Recordings
                </h2>

                {/* Webinar 1 */}
                <article className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Session 1 — How to Reclaim Your Competitive Edge in 2026
                  </h3>
                  <p className="text-base text-slate-600 mb-4">
                    A strategic overview of workforce shortages, rising complexity, and how specialized AI helps firms increase capacity.
                  </p>
                  <a
                    href="https://fathom.video/share/uDmwZ61kuh-Bk1z34qW8MwSnhZzQNetD"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block border border-emerald-600 text-emerald-700 px-4 py-2 rounded-lg font-medium hover:bg-emerald-50 transition"
                  >
                    Watch the Recording
                  </a>
                </article>

                {/* Webinar 2 */}
                <article className="rounded-xl border border-slate-200 bg-white p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Session 2 — Applied TaxGPT Workflows (Live Walkthroughs)
                  </h3>
                  <p className="text-base text-slate-600 mb-4">
                    Deep-dive demonstrations of how firms use TaxGPT for research, review, planning, and proposals.
                  </p>
                  <a
                    href="https://fathom.video/share/a79tTvfbuRR1N71CjtcgvjsyXAbsr2ag"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block border border-emerald-600 text-emerald-700 px-4 py-2 rounded-lg font-medium hover:bg-emerald-50 transition"
                  >
                    Watch the Recording
                  </a>
                </article>
              </div>

              <hr className="my-10 border-slate-200" />

              {/* Final CTA */}
              <div id="demo" className="mt-10 mb-6 scroll-mt-8">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 md:p-10">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">See How This Applies to Your Firm</h2>
                  <p className="text-base text-slate-600 mb-6">
                    If you want a walkthrough tailored to your clients, states, and workflow:
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

              {/* Internal Links & Navigation */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Related Resources</h3>
                <div className="space-y-2">
                  <Link href="/partners/taxgpt" className="block text-base text-emerald-600 hover:text-emerald-700 underline">
                    ← Back to TaxGPT Partner Page
                  </Link>
                  <Link href="/ai/tools" className="block text-base text-emerald-600 hover:text-emerald-700 underline">
                    Explore AI Tax Tools Directory
                  </Link>
                  <Link href="/ai/7216" className="block text-base text-emerald-600 hover:text-emerald-700 underline">
                    Learn About §7216 Compliance
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
