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

