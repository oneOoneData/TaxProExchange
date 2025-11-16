import { Metadata } from "next";
import AppNavigation from "@/components/AppNavigation";
import Link from "next/link";
import Image from "next/image";
import JsonLd from "@/components/seo/JsonLd";
import { siteUrl, generateArticleCollectionJsonLd, generateFaqJsonLd } from "@/lib/seo";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "AI in Tax: Thought Leadership & Tools for CPAs | TaxProExchange",
  description: "Exploring how AI transforms tax preparation—local LLMs, automation, and trusted tools.",
  alternates: { canonical: `${siteUrl}/ai` },
  openGraph: {
    title: "AI in Tax: Thought Leadership & Tools for CPAs | TaxProExchange",
    description: "Exploring how AI transforms tax preparation—local LLMs, automation, and trusted tools.",
    url: `${siteUrl}/ai`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI in Tax: Thought Leadership & Tools for CPAs | TaxProExchange",
    description: "Exploring how AI transforms tax preparation—local LLMs, automation, and trusted tools.",
  },
};

export default function AIPage() {
  const posts = getAllPosts();
  
  // Generate schemas
  const articleSchema = generateArticleCollectionJsonLd({
    title: 'AI in Tax: Thought Leadership & Tools for CPAs',
    description: 'Exploring how AI transforms tax preparation—local LLMs, automation, and trusted tools.',
    url: `${siteUrl}/ai`,
    dateModified: posts.length > 0 ? posts[0].data.date : new Date().toISOString(),
    author: 'TaxProExchange Editorial',
  });
  
  const faqSchema = generateFaqJsonLd([
    {
      question: 'How does AI help tax professionals?',
      answer: 'AI assists tax pros with document processing, error detection, client communication, and staying current with tax law changes. Local AI tools offer privacy and security advantages.',
    },
    {
      question: 'Is local AI secure for sensitive tax data?',
      answer: 'Yes. Local AI models run on your own infrastructure, ensuring client data never leaves your control. This is critical for CPA firms handling confidential financial information.',
    },
    {
      question: 'Will AI replace CPAs and tax preparers?',
      answer: 'No. AI augments tax professionals by handling repetitive tasks, allowing CPAs and EAs to focus on complex advisory work, client relationships, and strategic planning.',
    },
  ]);

  return (
    <>
      <JsonLd data={articleSchema} />
      <JsonLd data={faqSchema} />
      <AppNavigation />
      
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        <main className="max-w-4xl mx-auto py-16 px-6">
          <header className="mb-12">
            <h1 className="text-4xl font-bold mb-4 text-slate-900">AI Thought Leadership</h1>
            <div className="text-lg text-slate-700 space-y-4 mb-8">
              <p>
                There are a lot of things we could write about when it comes to tax firms today. The world is changing fast: from new legislation like the &ldquo;Big, Beautiful Bill&rdquo; to the shut down and other global developments that ripple through our economy. But nothing will have a bigger impact on tax firms than artificial intelligence.
              </p>
              <p>
                Like every other profession, AI is changing how we work. Some people believe it&rsquo;s coming for tax preparers&rsquo; jobs. Others think it won&rsquo;t make much sense in taxes. And some imagine a future where every CPA is assisted by a few AI copilots.
              </p>
              <p>
                No matter where you stand, one thing is certain: AI is coming to your firm.
              </p>
              <p>
                In this section, we dig into how AI is already reshaping the work of tax professionals. We&rsquo;ll cover new AI-native technology and ways tax firms can bring AI in house.
              </p>
            </div>
          </header>

          <section className="mb-16">
            <h2 className="text-2xl font-semibold mb-6 text-slate-800">Recent Articles</h2>
            <div className="space-y-6">
              {/* AI Tools Wall - Featured Card (Pinned/Evergreen) - First Article */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 hover:border-slate-300 hover:shadow-xl transition-all">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(99, 102, 241, 0.1) 35px, rgba(99, 102, 241, 0.1) 70px)',
                  }} />
                </div>
                
                {/* Pin icon */}
                <div className="absolute top-4 right-4 z-10">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                    <span className="text-xs font-semibold text-slate-700">Pinned</span>
                  </div>
                </div>
                
                <div className="relative p-8 md:p-10">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                          Community Reviews
                        </span>
                      </div>
                      <Link href="/ai/tools">
                        <h2 className="text-2xl md:text-3xl font-bold mb-3 text-slate-900 hover:text-blue-700 transition-colors cursor-pointer">
                          AI Tools for Tax Pros
                        </h2>
                      </Link>
                      <p className="text-lg text-slate-700 mb-2">
                        Reviewed by the most critical audience on the planet: <span className="font-semibold">Reddit Users!</span>
                      </p>
                      <p className="text-slate-600 mb-4">
                        Discover AI tools trusted by tax professionals. Vote for your favorites, read real Reddit reviews, and explore resources from the tools themselves.
                      </p>
                      <div className="text-sm text-slate-500 mb-4 space-y-2">
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
                      <Link href="/ai/tools" className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700">
                        Explore AI Tools
                        <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    </div>
                    <div className="flex-shrink-0">
                      <Link href="/ai/tools">
                        <Image
                          src="/images/tax_tool_reviews.png"
                          alt="AI Tools for Tax Pros - Live Reviews"
                          width={288}
                          height={288}
                          className="w-48 md:w-72 h-auto cursor-pointer"
                          sizes="(max-width: 768px) 192px, 288px"
                        />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Regular Articles */}
              {posts.length > 0 && posts.map((post) => (
                  <article
                    key={post.slug}
                    className="border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 hover:shadow-md transition-all bg-white"
                  >
                    <Link href={`/ai/${post.slug}`}>
                      {(post.data.previewImage || post.data.image) && (
                        <div className="h-72 overflow-hidden bg-slate-100">
                          <Image
                            src={post.data.previewImage || post.data.image || '/images/placeholder.png'}
                            alt={post.data.title}
                            width={800}
                            height={450}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                    <span><strong>Contributor badge</strong> — verified &ldquo;AI Contributor&rdquo; badge on your profile</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>💬</span>
                    <span><strong>Social media assets</strong> — share your article on LinkedIn and beyond</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>🔗</span>
                    <span><strong>Author credit with a link to your firm&rsquo;s website</strong></span>
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
        </main>
      </div>
    </>
  );
}

