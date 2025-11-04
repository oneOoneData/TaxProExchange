import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import AppNavigation from '@/components/AppNavigation';
import ToolWall from '@/components/ai/ToolWall';
import { siteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'AI Tools for Tax Pros | TaxProExchange',
  description: 'Discover AI tools trusted by tax professionals. Vote for your favorites, read real Reddit reviews, and explore resources.',
  alternates: { canonical: `${siteUrl}/ai/tools` },
  openGraph: {
    title: 'AI Tools for Tax Pros | TaxProExchange',
    description: 'Reviewed by the most critical audience on the planet: Reddit Users!',
    url: `${siteUrl}/ai/tools`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Tools for Tax Pros | TaxProExchange',
    description: 'Discover AI tools trusted by tax professionals.',
  },
};

export default function AIToolsPage() {
  return (
    <>
      <AppNavigation />
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        <main className="max-w-7xl mx-auto py-8 md:py-12 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <nav className="flex items-center gap-2 text-sm text-slate-600 mb-6">
              <a href="/ai" className="hover:text-slate-900">
                AI
              </a>
              <span>→</span>
              <span className="text-slate-900">Tools</span>
            </nav>
            
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold mb-3 text-slate-900">
                AI Tools for Tax Pros
              </h1>
              <p className="text-lg md:text-xl text-slate-700 mb-2">
                Reviewed by the most critical audience on the planet: <span className="font-semibold">Reddit Users!</span>
              </p>
              <p className="text-slate-600 mb-4">
                Discover AI tools trusted by tax professionals. Vote for your favorites, read real Reddit reviews, and explore resources from the tools themselves.
              </p>
              <div className="text-sm text-slate-500 space-y-2">
                <p>
                  <Link href="/ai/tools/methodology" className="text-blue-600 hover:text-blue-700 underline">
                    Learn about our methodology
                  </Link>
                  {' '}— how we collect Reddit reviews, analyze sentiment, and ensure transparency in our AI tool ratings.
                </p>
                <p>
                  Have feedback or suggestions?{' '}
                  <Link href="/feedback" className="text-blue-600 hover:text-blue-700 underline">
                    Let us know
                  </Link>
                  {' '}what we can improve.
                </p>
              </div>
            </div>
          </div>

          {/* Tools Wall */}
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-500">Loading tools...</div>
            </div>
          }>
            <ToolWall />
          </Suspense>
        </main>
      </div>
    </>
  );
}

