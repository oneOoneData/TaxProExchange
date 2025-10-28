import { Metadata } from "next";
import AppNavigation from "@/components/AppNavigation";
import Link from "next/link";
import { siteUrl } from "@/lib/seo";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "AI Thought Leadership | TaxProExchange",
  description: "Exploring how AI can transform tax preparation — local LLMs, automation, and tools for CPAs.",
  alternates: { canonical: `${siteUrl}/ai` },
  openGraph: {
    title: "AI Thought Leadership | TaxProExchange",
    description: "Exploring how AI can transform tax preparation — local LLMs, automation, and tools for CPAs.",
    url: `${siteUrl}/ai`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Thought Leadership | TaxProExchange",
    description: "Exploring how AI can transform tax preparation — local LLMs, automation, and tools for CPAs.",
  },
};

export default function AIPage() {
  const posts = getAllPosts();

  return (
    <>
      <AppNavigation />
      
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        <main className="max-w-4xl mx-auto py-16 px-6">
          <header className="mb-12">
            <h1 className="text-4xl font-bold mb-4 text-slate-900">AI Thought Leadership</h1>
            <div className="text-lg text-slate-700 space-y-4 mb-8">
              <p>
                There are a lot of things we could write about when it comes to tax firms today. The world is changing fast: from new legislation like the "Big, Beautiful Bill" to the shut down and other global developments that ripple through our economy. But nothing will have a bigger impact on tax firms than artificial intelligence.
              </p>
              <p>
                Like every other profession, AI is changing how we work. Some people believe it's coming for tax preparers' jobs. Others think it won't make much sense in taxes. And some imagine a future where every CPA is assisted by a few AI copilots.
              </p>
              <p>
                No matter where you stand, one thing is certain: AI is coming to your firm.
              </p>
              <p>
                In this section, we dig into how AI is already reshaping the work of tax professionals. We'll cover new AI-native technology and ways tax firms can bring AI in house.
              </p>
            </div>
          </header>

          {/* Write for Us CTA */}
          <div className="mb-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-slate-900">Share Your AI Expertise</h3>
                </div>
                <p className="text-slate-700 mb-4">
                  Have insights on how artificial intelligence is reshaping tax and accounting? Contribute to the TaxProExchange AI Hub and be featured as a thought leader among verified professionals.
                </p>
                <p className="text-sm font-medium text-slate-700 mb-2">Contributors receive:</p>
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex items-start gap-2">
                    <span>🧠</span>
                    <span><strong>Contributor badge</strong> — verified "AI Contributor" badge on your profile</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>💬</span>
                    <span><strong>Social media assets</strong> — share your article on LinkedIn and beyond</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>🔗</span>
                    <span><strong>Author credit with a link to your firm's website</strong></span>
                  </div>
                </div>
              </div>
              <div>
                <Link
                  href="/ai/write-for-us"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                >
                  Submit Your Article →
                </Link>
              </div>
            </div>
          </div>

          {posts.length > 0 ? (
            <section>
              <h2 className="text-2xl font-semibold mb-6 text-slate-800">Recent Articles</h2>
              <div className="space-y-6">
                {posts.map((post) => (
                  <article
                    key={post.slug}
                    className="border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 hover:shadow-md transition-all bg-white"
                  >
                    <Link href={`/ai/${post.slug}`}>
                      {(post.data.previewImage || post.data.image) && (
                        <div className="h-72 overflow-hidden bg-slate-100">
                          <img
                            src={post.data.previewImage || post.data.image}
                            alt={post.data.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="text-lg font-semibold mb-2 text-slate-900 hover:text-slate-700 line-clamp-2">
                          {post.data.title}
                        </h3>
                        <p className="text-slate-600 mb-3 text-sm line-clamp-2">
                          {post.data.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <time dateTime={post.data.date}>
                            {new Date(post.data.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </time>
                          <span>•</span>
                          <span>{post.data.author}</span>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <p className="text-slate-600">
              Stay tuned for upcoming articles, tutorials, and tool breakdowns designed for verified tax professionals
              curious about integrating AI into their daily workflows.
            </p>
          )}
        </main>
      </div>
    </>
  );
}

