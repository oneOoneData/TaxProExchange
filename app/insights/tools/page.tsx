import { Metadata } from 'next';
import Link from 'next/link';
import AppNavigation from '@/components/AppNavigation';
import ToolDirectory from '@/components/ai/ToolDirectory';
import JsonLd from '@/components/seo/JsonLd';
import { siteUrl } from '@/lib/seo';
import { getDirectoryTools, TOOL_CATEGORIES } from '@/lib/aiTools';

// Server-render the directory (crawlable, no "Loading tools…" flash) and refresh every 5 minutes.
export const revalidate = 300;

const TITLE = 'AI Tools for Tax Pros (2026) | TaxProExchange';
const DESCRIPTION =
  'A practitioner-curated directory of AI tools for tax professionals: research, return prep, intake, planning and bookkeeping. Compare tools with real Reddit sentiment and community votes.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${siteUrl}/insights/tools` },
  openGraph: {
    title: TITLE,
    description: 'AI tools for tax pros, rated by the most critical audience on the planet: Reddit.',
    url: `${siteUrl}/insights/tools`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: 'AI tools for tax pros, rated by the most critical audience on the planet: Reddit.',
  },
};

// Dated, sourced headlines. Update when the landscape shifts.
const LANDSCAPE = [
  {
    date: 'Oct 2026',
    text: 'Wolters Kluwer launched agentic tax preparation inside CCH Axcess.',
    href: 'https://www.wolterskluwer.com/en/news/wolters-kluwer-launches-agentic-tax-preparation-in-cch-axcess',
  },
  {
    date: 'Oct 2026',
    text: 'Thomson Reuters shipped a new CoCounsel for tax and accounting with calculations, Excel workpapers and UltraTax integration.',
    href: 'https://www.cpapracticeadvisor.com/2026/10/22/thomson-reuters-releases-next-version-of-cocounsel-for-tax-audit-and-accounting-pros/192280/',
  },
  {
    date: 'Feb 2026',
    text: 'Basis raised $100M to build AI agents that complete accounting and tax work end to end.',
    href: 'https://www.cpapracticeadvisor.com/2026/02/24/basis-raises-100-million-to-deploy-ai-agents-for-accounting-firms/178759/',
  },
];

function formatMonth(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export default async function AIToolsPage() {
  const tools = await getDirectoryTools();

  const present = new Set(tools.map((t) => t.category).filter(Boolean) as string[]);
  const categories = [
    ...TOOL_CATEGORIES.filter((c) => present.has(c)),
    ...Array.from(present).filter((c) => !(TOOL_CATEGORIES as readonly string[]).includes(c)).sort(),
  ];
  const mentions = tools.reduce((n, t) => n + t.reviewCount, 0);
  const lastUpdated = tools.reduce<string | null>(
    (latest, t) => (!latest || t.updated_at > latest ? t.updated_at : latest),
    null
  );

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AI Tools for Tax Professionals',
    numberOfItems: tools.length,
    itemListElement: [...tools]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${siteUrl}/insights/tools/${t.slug}`,
        name: t.name,
      })),
  };

  return (
    <>
      <AppNavigation />
      <JsonLd data={itemList} />
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
          <nav className="mb-6 flex items-center gap-2 text-sm text-slate-600" aria-label="Breadcrumb">
            <Link href="/insights" className="hover:text-slate-900">
              Insights
            </Link>
            <span aria-hidden>→</span>
            <span className="text-slate-900">AI Tools</span>
          </nav>

          <header className="mb-8 grid gap-8 lg:grid-cols-[1fr_minmax(0,380px)]">
            <div>
              <h1 className="mb-3 text-3xl font-bold text-slate-900 md:text-4xl">AI Tools for Tax Pros</h1>
              <p className="mb-3 text-lg text-slate-700 md:text-xl">
                Rated by the most critical audience on the planet: <span className="font-semibold">Reddit.</span>
              </p>
              <p className="max-w-2xl text-slate-600">
                Every tool here is tracked across r/taxpros, r/accounting, r/CPA and r/Bookkeeping. We summarize what
                practitioners actually say, link our own hands-on reviews, and let tax pros vote.
              </p>

              <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                <div>
                  <dt className="text-slate-500">Tools tracked</dt>
                  <dd className="text-2xl font-semibold text-slate-900">{tools.length}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Reddit mentions analyzed</dt>
                  <dd className="text-2xl font-semibold text-slate-900">{mentions}</dd>
                </div>
                {lastUpdated && (
                  <div>
                    <dt className="text-slate-500">Directory updated</dt>
                    <dd className="pt-1.5 font-medium text-slate-900">{formatMonth(lastUpdated)}</dd>
                  </div>
                )}
              </dl>

              <p className="mt-6 text-sm text-slate-500">
                <Link href="/insights/tools/methodology" className="text-blue-600 underline hover:text-blue-700">
                  How we rate tools
                </Link>
                <span className="mx-2" aria-hidden>
                  ·
                </span>
                <Link href="/feedback" className="text-blue-600 underline hover:text-blue-700">
                  Suggest a tool
                </Link>
              </p>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">What changed in 2026</h2>
              <ul className="space-y-3">
                {LANDSCAPE.map((item) => (
                  <li key={item.href} className="text-sm leading-relaxed text-slate-700">
                    <span className="mr-2 font-medium text-slate-900">{item.date}</span>
                    {item.text}{' '}
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whitespace-nowrap text-blue-600 hover:text-blue-700"
                    >
                      Source ↗
                    </a>
                  </li>
                ))}
              </ul>
              <Link
                href="/insights/tax-ai-tools-mid-2026-reality-check"
                className="mt-4 inline-block text-sm font-medium text-slate-900 underline"
              >
                Read: Tax AI tools, mid-2026 reality check →
              </Link>
            </aside>
          </header>

          {tools.length > 0 ? (
            <ToolDirectory tools={tools} categories={categories} />
          ) : (
            <p className="py-12 text-center text-slate-600">The directory is temporarily unavailable. Please check back shortly.</p>
          )}

          <section className="mt-12 rounded-2xl bg-slate-900 px-6 py-8 text-white md:flex md:items-center md:justify-between md:px-10">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-semibold">Built or using a tool we&apos;re missing?</h2>
              <p className="mt-1 text-slate-300">
                Tell us about it. Vendors are welcome to submit, but ratings come from practitioners, not sponsors.
              </p>
            </div>
            <Link
              href="/feedback"
              className="inline-block rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Suggest a tool
            </Link>
          </section>
        </main>
      </div>
    </>
  );
}
