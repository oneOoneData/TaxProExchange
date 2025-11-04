'use client';

import Image from 'next/image';
import VoteButton from './VoteButton';
import { useUser } from '@clerk/nextjs';

interface Review {
  author?: string;
  content: string;
  permalink?: string;
  upvotes?: number;
}

interface Sentiment {
  label: 'positive' | 'mixed' | 'negative';
  summary: string;
  updated_at?: string;
}

interface Tool {
  id: string;
  name: string;
  slug: string;
  category?: string;
  website_url?: string;
  logo_url?: string;
  short_description?: string;
  long_description?: string;
  affiliate_url?: string;
  collateral_links?: Array<{ title: string; url: string; type?: string }>;
  votes: number;
  reviews: Review[];
  sentiment?: Sentiment | null;
}

interface ToolDetailClientProps {
  tool: Tool;
}

export default function ToolDetailClient({ tool }: ToolDetailClientProps) {
  const { isSignedIn } = useUser();

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Logo */}
          <div className="flex-shrink-0">
            {tool.logo_url ? (
              <div className="relative w-32 h-32">
                <Image
                  src={tool.logo_url}
                  alt={tool.name}
                  fill
                  className="object-contain"
                  sizes="128px"
                />
              </div>
            ) : (
              <div className="w-32 h-32 bg-slate-100 rounded-2xl flex items-center justify-center">
                <span className="text-4xl font-bold text-slate-400">
                  {tool.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{tool.name}</h1>
            {tool.category && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-medium mb-4">
                {tool.category}
              </span>
            )}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <VoteButton
                toolId={tool.id}
                initialVotes={tool.votes}
              />
              {(tool.slug?.toLowerCase().trim() === 'truss' || tool.slug?.toLowerCase().trim() === 'truss-ai' || tool.name?.toLowerCase().trim() === 'truss') ? (
                <a
                  href="https://gettruss.link/koen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium"
                >
                  Book a Demo with Truss
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : tool.website_url ? (
                <a
                  href={tool.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                >
                  Visit Website
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {tool.long_description && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-6">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">About</h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">
              {tool.long_description}
            </p>
          </div>
        </div>
      )}

      {/* Collateral Links */}
      {tool.collateral_links && tool.collateral_links.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-6">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tool.collateral_links.map((link, idx) => {
              const icon = link.type === 'webinar' ? '🎥' : link.type === 'article' ? '🔗' : '🧠';
              return (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-2xl">{icon}</span>
                  <span className="font-medium text-slate-700">{link.title}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Sentiment Summary */}
      {tool.sentiment && (
        <div className="mb-6 p-6 bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  AI Summary
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  tool.sentiment.label === 'positive' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : tool.sentiment.label === 'negative'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {tool.sentiment.label === 'positive' ? 'Positive' : tool.sentiment.label === 'negative' ? 'Negative' : 'Mixed'}
                </span>
              </div>
              <p className="text-base text-slate-700 leading-relaxed">
                {tool.sentiment.summary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reddit Mentions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Reddit Mentions</h2>
        {tool.reviews && tool.reviews.length > 0 ? (
          <div className="space-y-4">
            {tool.reviews.map((review, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex items-start justify-between mb-2">
                  {review.author && (
                    <span className="text-xs font-medium text-slate-600">
                      u/{review.author}
                    </span>
                  )}
                  {review.upvotes !== undefined && review.upvotes > 0 && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      {review.upvotes}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-700 mb-2">{review.content}</p>
                {review.permalink && (
                  <a
                    href={review.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#FF4500] hover:text-[#FF5700] font-medium"
                  >
                    View on Reddit →
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-700 mb-3">
              We couldn't find any Reddit discussions about <strong>{tool.name}</strong> yet, but we're always listening. Did we miss a valuable comment or thread?
            </p>
            <a
              href={`/feedback?tool=${encodeURIComponent(tool.name)}`}
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Let us know →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

