import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { siteUrl } from '@/lib/seo';
import { FEATURE_PUBLIC_MCP } from '@/lib/flags';
import AppNavigation from '@/components/AppNavigation';

export const metadata: Metadata = {
  title: 'Connect Your AI Assistant | TaxProExchange',
  description:
    'Query the TaxProExchange verified tax professional directory straight from Claude Desktop or Cowork. A Firm-plan feature for paid firm accounts.',
  alternates: { canonical: `${siteUrl}/connect-ai` },
};

const EXAMPLE_PROMPTS = [
  'Find me a ProConnect S-corp reviewer in Texas who does TaxDome.',
  'Is there anyone verified who handles crypto tax in California?',
  'I need an EA who works multistate and is currently accepting work.',
];

export default function ConnectAiPage() {
  if (!FEATURE_PUBLIC_MCP) notFound();

  return (
    <>
      <AppNavigation />
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        {/* Hero */}
        <section className="relative overflow-hidden bg-slate-900 text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="max-w-3xl">
              <p className="text-sm font-medium text-blue-300 uppercase tracking-wide mb-3">Firm-plan feature</p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Ask your AI to find a tax pro
              </h1>
              <p className="mt-6 text-xl text-slate-300">
                TaxProExchange is the verified tax directory you can query straight from your AI
                assistant — ask it to find you a vetted CPA or EA and it searches our verified
                bench for you.
              </p>
            </div>
          </div>
        </section>

        {/* What it is */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">What it is</h2>
            <p className="text-slate-600 mb-4">
              A hosted, read-only connection (MCP) that your AI assistant uses to search our
              verified directory in natural language — &ldquo;find me someone who does X.&rdquo;
              It never returns email addresses or phone numbers, only public profile links, and
              contact always happens on-platform through TaxProExchange.
            </p>
            <p className="text-slate-600">
              This is search and discovery, not automation — it finds you the right few people;
              you still reach out and connect the way you always have.
            </p>
          </div>
        </section>

        {/* Setup */}
        <section className="py-12 md:py-16 bg-white border-t border-slate-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">Setup</h2>
            <ol className="space-y-6">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">1</span>
                <div>
                  <p className="font-medium text-slate-900">Generate your API key</p>
                  <p className="text-slate-600 mt-1">
                    From your firm&rsquo;s{' '}
                    <Link href="/team/settings" className="text-blue-600 hover:underline">
                      Settings
                    </Link>{' '}
                    page (firm admin, active subscription required), under &ldquo;Connect your AI
                    assistant.&rdquo; The key is shown once — copy it somewhere safe.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">2</span>
                <div>
                  <p className="font-medium text-slate-900">Add the MCP server to Claude Desktop</p>
                  <p className="text-slate-600 mt-1">
                    In Claude Desktop, go to Settings → Connectors → Add custom connector, and
                    enter:
                  </p>
                  <code className="block bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm mt-2">
                    {siteUrl}/api/public-mcp
                  </code>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">3</span>
                <div>
                  <p className="font-medium text-slate-900">Paste your API key</p>
                  <p className="text-slate-600 mt-1">
                    When prompted for authentication, paste the key from step 1. That&rsquo;s it —
                    ask your assistant to find you a tax pro.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Example prompts */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">Try asking</h2>
            <div className="space-y-3">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <div key={prompt} className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-700 italic">
                  &ldquo;{prompt}&rdquo;
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 md:py-16 bg-slate-900 text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl text-center">
            <h2 className="text-2xl font-semibold mb-4">Not on a firm plan yet?</h2>
            <p className="text-slate-300 mb-6">
              Connect your AI assistant is included with every TaxProExchange firm account.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-xl text-slate-900 bg-white hover:bg-slate-100 shadow-lg transition-all"
            >
              See pricing
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
