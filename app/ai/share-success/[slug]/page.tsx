"use client";

import { useParams } from "next/navigation";
import AppNavigation from "@/components/AppNavigation";
import { useState, useEffect } from "react";
import { siteUrl } from "@/lib/seo";

interface ArticleData {
  title: string;
  author: string;
  slug: string;
}

export default function ShareSuccessPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [copiedBadge, setCopiedBadge] = useState<string | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch article data (you could make this a real API call)
  useEffect(() => {
    // For now, we'll use a placeholder - in production, fetch from Supabase or file system
    setArticle({
      title: "Sample Article Title",
      author: "Contributor Name",
      slug: slug,
    });
    setLoading(false);
  }, [slug]);

  const badgeCode = {
    light: `<a href="${siteUrl}/ai/${slug}" target="_blank" rel="noopener">
  <img src="${siteUrl}/badges/tpe-ai-featured.svg" alt="Featured AI Contributor - TaxProExchange" />
</a>`,
    dark: `<a href="${siteUrl}/ai/${slug}" target="_blank" rel="noopener">
  <img src="${siteUrl}/badges/tpe-ai-featured-dark.svg" alt="Featured AI Contributor - TaxProExchange" />
</a>`,
    mini: `<a href="${siteUrl}/ai/${slug}" target="_blank" rel="noopener">
  <img src="${siteUrl}/badges/tpe-ai-featured-mini.svg" alt="Featured AI Contributor - TaxProExchange" width="120" />
</a>`,
  };

  const linkedInCaption = article
    ? `🎉 Excited to share that my article "${article.title}" was just published on TaxProExchange's AI Hub!

I explore how tax professionals can leverage AI to transform their practice — from local LLMs to workflow automation.

Read the full article: ${siteUrl}/ai/${slug}

#TaxTech #AI #Accounting #CPA #TaxProfessional #Automation`
    : "";

  const linkedInShareUrl = article
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        `${siteUrl}/ai/${slug}`
      )}`
    : "";

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    if (type === "caption") {
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } else {
      setCopiedBadge(type);
      setTimeout(() => setCopiedBadge(null), 2000);
    }
  };

  const downloadImage = (imageName: string) => {
    // Open in new tab for download
    window.open(`/social/${imageName}`, '_blank');
  };

  if (loading) {
    return (
      <>
        <AppNavigation />
        <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
          <div className="text-slate-600">Loading...</div>
        </div>
      </>
    );
  }

  if (!article) {
    return (
      <>
        <AppNavigation />
        <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Article Not Found</h1>
            <p className="text-slate-600">The article you're looking for doesn't exist.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppNavigation />

      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        <main className="max-w-4xl mx-auto py-16 px-6">
          {/* Congrats Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6 animate-bounce">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4 text-slate-900">Congratulations! 🎉</h1>
            <p className="text-xl text-slate-700 mb-2">
              Your article <span className="font-semibold">"{article.title}"</span> is now live
            </p>
            <p className="text-slate-600">
              on the{" "}
              <a
                href={`${siteUrl}/ai`}
                className="text-blue-600 hover:underline font-medium"
              >
                TaxProExchange AI Hub
              </a>
            </p>
            <a
              href={`${siteUrl}/ai/${slug}`}
              className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
            >
              View Your Article
            </a>
          </div>

          {/* Badge Gallery */}
          <section className="mb-12 bg-white rounded-lg border border-slate-200 p-8">
            <h2 className="text-2xl font-semibold mb-6 text-slate-900">
              Your Contributor Badges
            </h2>
            <p className="text-slate-600 mb-6">
              Display these badges on your website, LinkedIn profile, or email signature to showcase
              your contribution.
            </p>

            <div className="space-y-8">
              {/* Light Badge */}
              <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Light Badge</h3>
                  <span className="text-xs text-slate-500">Best for light backgrounds</span>
                </div>
                <div className="mb-4 p-4 bg-white rounded flex items-center justify-center">
                  <img
                    src="/badges/tpe-ai-featured.svg"
                    alt="Featured AI Contributor Badge - Light"
                    className="w-60"
                  />
                </div>
                <button
                  onClick={() => copyToClipboard(badgeCode.light, "light")}
                  className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  {copiedBadge === "light" ? (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy HTML Code
                    </>
                  )}
                </button>
              </div>

              {/* Dark Badge */}
              <div className="border border-slate-200 rounded-lg p-6 bg-slate-900">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Dark Badge</h3>
                  <span className="text-xs text-slate-400">Best for dark backgrounds</span>
                </div>
                <div className="mb-4 p-4 bg-slate-800 rounded flex items-center justify-center">
                  <img
                    src="/badges/tpe-ai-featured-dark.svg"
                    alt="Featured AI Contributor Badge - Dark"
                    className="w-60"
                  />
                </div>
                <button
                  onClick={() => copyToClipboard(badgeCode.dark, "dark")}
                  className="w-full px-4 py-2 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                >
                  {copiedBadge === "dark" ? (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy HTML Code
                    </>
                  )}
                </button>
              </div>

              {/* Mini Badge */}
              <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Mini Badge</h3>
                  <span className="text-xs text-slate-500">Compact circular design</span>
                </div>
                <div className="mb-4 p-4 bg-white rounded flex items-center justify-center">
                  <img
                    src="/badges/tpe-ai-featured-mini.svg"
                    alt="Featured AI Contributor Badge - Mini"
                    className="w-30"
                  />
                </div>
                <button
                  onClick={() => copyToClipboard(badgeCode.mini, "mini")}
                  className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  {copiedBadge === "mini" ? (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy HTML Code
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Social Media Cards */}
          <section className="mb-12 bg-white rounded-lg border border-slate-200 p-8">
            <h2 className="text-2xl font-semibold mb-6 text-slate-900">
              Social Media Graphics
            </h2>
            <p className="text-slate-600 mb-6">
              Download and share these custom graphics on LinkedIn, Twitter, or anywhere you want to
              promote your article.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map((num) => (
                <div key={num} className="border border-slate-200 rounded-lg overflow-hidden">
                  <img
                    src={`/social/ai-featured-${num}.svg`}
                    alt={`Social media card ${num}`}
                    className="w-full h-auto"
                  />
                  <button
                    onClick={() => downloadImage(`ai-featured-${num}.svg`)}
                    className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 transition-colors text-sm font-medium"
                  >
                    Download Card {num}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* LinkedIn Share */}
          <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-8">
            <h2 className="text-2xl font-semibold mb-6 text-slate-900">
              Share on LinkedIn
            </h2>
            
            <div className="bg-white rounded-lg p-6 mb-6 border border-slate-200">
              <p className="text-sm text-slate-600 mb-2 font-medium">Pre-written caption:</p>
              <p className="text-slate-700 whitespace-pre-line">{linkedInCaption}</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => copyToClipboard(linkedInCaption, "caption")}
                className="flex-1 px-6 py-3 bg-white border border-slate-300 text-slate-900 font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                {copiedCaption ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy Caption
                  </>
                )}
              </button>

              <a
                href={linkedInShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-6 py-3 bg-[#0A66C2] text-white font-semibold rounded-lg hover:bg-[#004182] transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                Share on LinkedIn
              </a>
            </div>
          </section>

          {/* Footer */}
          <div className="mt-12 text-center text-sm text-slate-600">
            <p>
              Thank you for contributing to TaxProExchange! Questions?{" "}
              <a href="mailto:koen@cardifftax.com" className="text-blue-600 hover:underline">
                Contact us
              </a>
            </p>
          </div>
        </main>
      </div>
    </>
  );
}

