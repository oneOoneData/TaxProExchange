'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import VoteButton from './VoteButton';

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
  votes: number;
}

interface ToolDetailPanelProps {
  tool: Tool | null;
  reviews: Review[];
  collateralLinks: Array<{ title: string; url: string; type?: string }>;
  sentiment: Sentiment | null;
  onClose?: () => void;
}

export default function ToolDetailPanel({
  tool,
  reviews,
  collateralLinks,
  sentiment,
  onClose,
}: ToolDetailPanelProps) {
  if (!tool) return null;

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handlePanelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence mode="wait">
        {tool && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/50 z-40"
            />
            
            {/* Bottom Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={handlePanelClick}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[85vh] overflow-y-auto"
            >
              <div className="max-w-7xl mx-auto px-6 sm:px-8 py-6">
                {/* Close Button - Top Right */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors z-10"
                  aria-label="Close panel"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column - Tool Basics */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Tool Basics Section */}
                    <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-6">
                      {/* Logo */}
                      <div className="flex justify-center mb-4">
                        {tool.logo_url ? (
                          <div className="relative w-24 h-24">
                            <Image
                              src={tool.logo_url}
                              alt={tool.name}
                              fill
                              className="object-contain"
                              sizes="96px"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center">
                            <span className="text-3xl font-bold text-slate-400">
                              {tool.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <h2 className="text-2xl font-bold text-slate-900 text-center mb-3">
                        {tool.name}
                      </h2>

                      {/* Category */}
                      {tool.category && (
                        <div className="text-center mb-4">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">
                            {tool.category}
                          </span>
                        </div>
                      )}

                      {/* Website URL */}
                      {tool.website_url && (
                        <div className="text-center">
                          <a
                            href={tool.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Visit Website
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}

                      {/* Vote Button */}
                      <div className="mt-4 flex justify-center">
                        <VoteButton toolId={tool.id} initialVotes={tool.votes} />
                      </div>
                    </div>

                    {/* Long Description (if available) */}
                    {tool.long_description && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                          About
                        </h3>
                        <p className="text-slate-700 leading-relaxed">
                          {tool.long_description}
                        </p>
                      </div>
                    )}

                    {/* Collateral Links */}
                    {collateralLinks && collateralLinks.length > 0 && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                          Resources
                        </h3>
                        <div className="space-y-2">
                          {collateralLinks.map((link, idx) => {
                            const icon =
                              link.type === 'webinar' ? '🎥' :
                              link.type === 'article' ? '📄' :
                              link.type === 'video' ? '▶️' :
                              '🔗';
                            return (
                              <a
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                              >
                                <span className="text-xl">{icon}</span>
                                <span className="text-sm font-medium text-slate-700 flex-1">{link.title}</span>
                                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - AI Summary & Reddit Mentions */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* AI Summary */}
                    {sentiment && (
                      <div className="bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-50 rounded-2xl border border-amber-200 p-6 lg:p-8">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                                AI Summary
                              </span>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                sentiment.label === 'positive' 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : sentiment.label === 'negative'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {sentiment.label === 'positive' ? 'Positive' : sentiment.label === 'negative' ? 'Negative' : 'Mixed'}
                              </span>
                            </div>
                            <p className="text-lg text-slate-800 leading-relaxed break-words">
                              {sentiment.summary}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reddit Mentions */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">
                        Reddit Mentions
                      </h3>
                      {reviews.length > 0 ? (
                        <div className="space-y-4">
                          {reviews.map((review, idx) => (
                            <div
                              key={idx}
                              className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  {review.author && (
                                    <span className="text-xs font-medium text-slate-600">
                                      u/{review.author}
                                    </span>
                                  )}
                                  {review.upvotes !== undefined && review.upvotes > 0 && (
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a1 1 0 001.364.97l5.108-2.233a1 1 0 00.628-.97v-4.34a1 1 0 00-.628-.97l-5.108-2.234a1 1 0 00-1.364.97z" />
                                      </svg>
                                      {review.upvotes}
                                    </span>
                                  )}
                                </div>
                                {review.permalink && (
                                  <a
                                    href={review.permalink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-[#FF4500] hover:text-[#FF5700] flex items-center gap-1 font-medium"
                                  >
                                    View on Reddit
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                )}
                              </div>
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {review.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 px-4">
                          <p className="text-slate-600 mb-3">
                            We couldn't find any Reddit discussions about <strong>{tool.name}</strong> yet, but we're always listening. Did we miss a valuable comment or thread?
                          </p>
                          <a
                            href={`/feedback?tool=${encodeURIComponent(tool.name)}`}
                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Let us know!
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
