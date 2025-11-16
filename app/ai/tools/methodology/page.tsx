import { Metadata } from 'next';
import Link from 'next/link';
import AppNavigation from '@/components/AppNavigation';
import { siteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'AI Tools Methodology | TaxProExchange',
  description: 'Learn how we collect Reddit reviews, analyze sentiment, and ensure transparency in our AI tool ratings for tax professionals.',
  alternates: { canonical: `${siteUrl}/ai/tools/methodology` },
  openGraph: {
    title: 'AI Tools Methodology | TaxProExchange',
    description: 'How we collect Reddit reviews and analyze sentiment for AI tax tools.',
    url: `${siteUrl}/ai/tools/methodology`,
    type: 'website',
  },
};

export default function MethodologyPage() {
  return (
    <>
      <AppNavigation />
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        <main className="max-w-4xl mx-auto py-8 md:py-12 px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-slate-600 mb-6">
            <Link href="/ai" className="hover:text-slate-900">
              AI
            </Link>
            <span>→</span>
            <Link href="/ai/tools" className="hover:text-slate-900">
              Tools
            </Link>
            <span>→</span>
            <span className="text-slate-900">Methodology</span>
          </nav>

          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              How We Review AI Tools
            </h1>
            <p className="text-lg text-slate-700">
              Transparency in how we collect Reddit reviews, analyze sentiment, and present ratings.
            </p>
          </header>

          {/* Content */}
          <div className="prose prose-slate max-w-none space-y-8">
            {/* Reddit Collection */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4 text-slate-900">
                Reddit Review Collection
              </h2>
              
              <h3 className="text-xl font-semibold mb-3 text-slate-800 mt-6">
                Subreddits
              </h3>
              <p className="text-slate-700 mb-4">
                We search these tax and accounting subreddits:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 mb-6 ml-2">
                <li><code className="bg-slate-100 px-2 py-0.5 rounded text-sm">r/taxpros</code></li>
                <li><code className="bg-slate-100 px-2 py-0.5 rounded text-sm">r/accounting</code></li>
                <li><code className="bg-slate-100 px-2 py-0.5 rounded text-sm">r/CPA</code></li>
                <li><code className="bg-slate-100 px-2 py-0.5 rounded text-sm">r/tax</code></li>
                <li><code className="bg-slate-100 px-2 py-0.5 rounded text-sm">r/taxpreparation</code></li>
                <li><code className="bg-slate-100 px-2 py-0.5 rounded text-sm">r/Bookkeeping</code></li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-slate-800 mt-6">
                Collection Process
              </h3>
              <p className="text-slate-700 mb-4">
                We use Reddit&rsquo;s public JSON API to search for posts and comments mentioning each tool. The process:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-slate-700 mb-6 ml-2">
                <li>Query each subreddit for the tool name</li>
                <li>Include only content where the tool name appears (case-insensitive)</li>
                <li>Exclude removed/deleted posts and content shorter than 20 characters</li>
                <li>Remove duplicates based on permalink</li>
                <li>Sort by upvotes (highest first)</li>
              </ol>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-900">
                  We use Reddit&rsquo;s official public API endpoints, permitted under their terms of service.
                </p>
              </div>

              <h3 className="text-xl font-semibold mb-3 text-slate-800 mt-6">
                Data Collected
              </h3>
              <p className="text-slate-700 mb-4">
                For each Reddit mention, we store:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 ml-2">
                <li>Author username</li>
                <li>Post/comment content (truncated to 500 characters)</li>
                <li>Upvote count</li>
                <li>Permalink</li>
                <li>Subreddit name</li>
                <li>Timestamp</li>
              </ul>
            </section>

            {/* Sentiment Analysis */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4 text-slate-900">
                AI Sentiment Analysis
              </h2>

              <p className="text-slate-700 mb-6">
                We use OpenAI&rsquo;s GPT-4o-mini model to analyze Reddit discussions and generate sentiment summaries. This runs daily via an automated script.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-slate-800 mt-6">
                Process
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-700 mb-6 ml-2">
                <li>Collect the top 15 Reddit comments (by upvotes) for each tool</li>
                <li>Submit to OpenAI with our analysis prompt</li>
                <li>AI returns a sentiment label (positive/mixed/negative) and summary paragraph</li>
                <li>Save to database, updated daily</li>
              </ol>

              <h3 className="text-xl font-semibold mb-3 text-slate-800 mt-6">
                Analysis Prompt
              </h3>
              <p className="text-slate-700 mb-4">
                The prompt used for sentiment analysis:
              </p>
              <div className="bg-slate-900 text-slate-100 rounded-lg p-6 font-mono text-sm overflow-x-auto mb-6">
                <pre className="whitespace-pre-wrap">{`You are analyzing Reddit discussions about an AI tax tool called "[Tool Name]".
Below are real Reddit comments from tax professionals discussing this tool.

Task:
1. Determine the overall sentiment: "positive", "mixed", or "negative"
2. Summarize the recurring themes and feedback (e.g., accuracy, pricing, support, ease of use, integrations)
3. Keep the tone professional but conversational
4. Output exactly 1 concise paragraph (max 75 words - be comprehensive)
5. Be specific about what tax pros like or dislike

Comments:
[Top 15 comments with upvote counts]

Format your response as JSON:
{
  "sentiment_label": "positive" | "mixed" | "negative",
  "summary": "Your one-paragraph summary here (max 75 words)"
}`}</pre>
              </div>

              <h3 className="text-xl font-semibold mb-3 text-slate-800 mt-6">
                Model Configuration
              </h3>
              <ul className="list-disc list-inside space-y-2 text-slate-700 mb-6 ml-2">
                <li><strong>Model</strong>: GPT-4o-mini (OpenAI)</li>
                <li><strong>Temperature</strong>: 0.3</li>
                <li><strong>Response Format</strong>: JSON</li>
                <li><strong>Summary Limit</strong>: 75 words max, 500 characters max</li>
              </ul>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-amber-900">
                  <strong>Note:</strong> AI summaries reflect opinions from Reddit discussions, not our assessments. Read the original Reddit mentions for full context.
                </p>
              </div>
            </section>

            {/* Voting */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4 text-slate-900">
                Community Voting
              </h2>
              <p className="text-slate-700 mb-4">
                Tax professionals can vote for tools they use and trust. Voting requires a TaxProExchange account. Each user can vote once per tool, and votes are counted in real-time.
              </p>
              <p className="text-slate-700">
                Tools are sorted by vote count (highest first).
              </p>
            </section>

            {/* Updates */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4 text-slate-900">
                Update Frequency
              </h2>
              <ul className="list-disc list-inside space-y-2 text-slate-700 ml-2">
                <li><strong>Reddit Reviews</strong>: Collected daily</li>
                <li><strong>Sentiment Analysis</strong>: Regenerated daily when new reviews are found</li>
                <li><strong>Vote Counts</strong>: Updated in real-time</li>
              </ul>
            </section>

            {/* Transparency */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4 text-slate-900">
                Our Commitment to Transparency
              </h2>
              <ul className="list-disc list-inside space-y-2 text-slate-700 mb-6 ml-2">
                <li>All Reddit mentions link to the original post/comment</li>
                <li>Sentiment summaries are labeled as &ldquo;AI Summary&rdquo;</li>
                <li>Upvote counts and author names shown when available</li>
                <li>All claims verifiable via source Reddit discussions</li>
                <li>Reddit content presented as found, unedited</li>
              </ul>
            </section>

            {/* Feedback */}
            <section className="bg-blue-50 rounded-2xl border border-blue-200 p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4 text-slate-900">
                Feedback & Questions
              </h2>
              <p className="text-slate-700 mb-4">
                Questions about our methodology? Found a Reddit discussion we missed? Suggestions for improvements?
              </p>
              <Link
                href="/feedback"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Share Your Feedback
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </section>

            {/* Back Link */}
            <div className="pt-6">
              <Link
                href="/ai/tools"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to AI Tools
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

