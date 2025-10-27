import { Metadata } from "next";
import { notFound } from "next/navigation";
import AppNavigation from "@/components/AppNavigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { getPostBySlug, getAllSlugs } from "@/lib/blog";
import { siteUrl, articleJsonLd, jsonLd } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found | TaxProExchange",
    };
  }

  const url = `${siteUrl}${post.data.slug || `/ai/${slug}`}`;
  const imageUrl = post.data.image 
    ? `${siteUrl}${post.data.image}` 
    : `${siteUrl}/og-image.png`;

  return {
    title: `${post.data.title} | TaxProExchange`,
    description: post.data.description,
    alternates: { canonical: url },
    openGraph: {
      title: post.data.title,
      description: post.data.description,
      url,
      type: "article",
      publishedTime: post.data.date,
      authors: [post.data.author],
      tags: post.data.keywords,
      images: [imageUrl],
    },
    twitter: {
      card: "summary_large_image",
      title: post.data.title,
      description: post.data.description,
      images: [imageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const url = `${siteUrl}${post.data.slug || `/ai/${slug}`}`;
  const articleSchema = articleJsonLd({
    title: post.data.title,
    description: post.data.description,
    date: post.data.date,
    author: post.data.author,
    image: post.data.image,
    imageCaption: post.data.imageCaption,
    url,
  });

  return (
    <>
      <JsonLd data={articleSchema} />
      <AppNavigation />

      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        <main className="max-w-4xl mx-auto py-16 px-6">
          <article className="prose prose-slate max-w-none">
            <header className="mb-8">
              <h1 className="text-4xl font-bold mb-4 text-slate-900">
                {post.data.title}
              </h1>
              {post.data.description && (
                <p className="text-xl text-slate-700 mb-4">
                  {post.data.description}
                </p>
              )}
              <div className="flex items-center gap-6 text-sm text-slate-600 mb-6">
                <span>By {post.data.author}</span>
                <span>•</span>
                <time dateTime={post.data.date}>
                  {new Date(post.data.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
            </header>

            {post.data.image && (
              <div className="mb-8">
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={post.data.image}
                    alt={post.data.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
                {post.data.imageCaption && (
                  <p className="text-sm text-slate-500 text-center mt-3">
                    {post.data.imageCaption}
                  </p>
                )}
              </div>
            )}

            <div className="prose prose-lg prose-slate max-w-none border-t border-slate-200 pt-8">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Author Section */}
            {(post.data.authorBio || post.data.authorLinkedIn || post.data.authorReddit || post.data.authorTPE) && (
              <div className="mt-8 pt-8">
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">About the Author</h3>
                  <div className="flex items-start gap-4">
                    {post.data.authorImage ? (
                      <img 
                        src={post.data.authorImage} 
                        alt={post.data.author}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : post.data.authorLinkedIn ? (
                      <a
                        href={post.data.authorLinkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                      >
                        <svg className="w-12 h-12 text-slate-400 hover:text-blue-600 transition-colors p-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                      </a>
                    ) : null}
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-slate-900 mb-2">{post.data.author}</p>
                      {post.data.authorBio && (
                        <p className="text-slate-600 text-sm leading-relaxed">{post.data.authorBio}</p>
                      )}
                      {(post.data.authorLinkedIn || post.data.authorReddit) && (
                        <div className="flex items-center gap-3 mt-2">
                          {post.data.authorLinkedIn && (
                            <a
                              href={post.data.authorLinkedIn}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center"
                              title="View on LinkedIn"
                            >
                              <svg className="w-5 h-5 text-blue-600 hover:text-blue-700 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                              </svg>
                            </a>
                          )}
                          {post.data.authorReddit && (
                            <a
                              href={post.data.authorReddit}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center"
                              title="View on Reddit"
                            >
                              <svg className="w-5 h-5 text-orange-600 hover:text-orange-700 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.031 1.031 0 0 1 1.249.689zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                              </svg>
                            </a>
                          )}
                          {post.data.authorTPE && (
                            <a
                              href={post.data.authorTPE}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center"
                              title="View Profile on TaxProExchange"
                            >
                              <img src="/favicon.ico" alt="TaxProExchange" className="w-5 h-5 hover:opacity-70 transition-opacity" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </article>
        </main>
      </div>
    </>
  );
}

