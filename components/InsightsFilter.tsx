'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Post {
  slug: string;
  data: {
    title: string;
    description: string;
    date: string;
    author: string;
    previewImage?: string;
    image?: string;
    category?: string;
  };
}

const CATEGORIES = ['All', 'AI', 'Practice Management', 'IRS Updates'];
const CATEGORY_COLORS: Record<string, string> = {
  'AI': 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  'Practice Management': 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
  'IRS Updates': 'bg-amber-100 text-amber-700 hover:bg-amber-200',
};

export default function InsightsFilter({ posts }: { posts: Post[] }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredPosts = useMemo(() => {
    if (activeCategory === 'All') return posts;
    return posts.filter(p => p.data.category === activeCategory);
  }, [activeCategory, posts]);

  return (
    <>
      {/* Filter Tags */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map(cat => {
          const isActive = cat === activeCategory;
          const colorClass = cat === 'All' 
            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
            : (CATEGORY_COLORS[cat] || 'bg-slate-100 text-slate-700');
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                isActive 
                  ? `${cat === 'All' ? 'bg-slate-800 text-white' : 'ring-2 ring-offset-1 ring-slate-400'} ${colorClass}`
                  : `${colorClass} opacity-80 hover:opacity-100`
              }`}
            >
              {cat}
              {cat !== 'All' && (
                <span className="ml-1.5 text-xs opacity-60">
                  ({posts.filter(p => p.data.category === cat).length})
                </span>
              )}
            </button>
          );
        })}
        {activeCategory !== 'All' && (
          <button
            onClick={() => setActiveCategory('All')}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Articles */}
      <div className="space-y-6">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-lg mb-2">No articles in this category yet</p>
            <p className="text-sm">Try selecting a different filter</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <article
              key={post.slug}
              className="border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 hover:shadow-md transition-all bg-white"
            >
              <Link href={`/insights/${post.slug}`}>
                {(post.data.previewImage || post.data.image) && (
                  <div className="h-72 overflow-hidden bg-slate-100">
                    <Image
                      src={post.data.previewImage || post.data.image || '/images/placeholder.png'}
                      alt={post.data.title || 'Article image'}
                      width={800}
                      height={450}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div className="p-4">
                  {post.data.category && (
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2 ${
                      CATEGORY_COLORS[post.data.category] || 'bg-slate-100 text-slate-600'
                    }`}>
                      {post.data.category}
                    </span>
                  )}
                  <h3 className="text-lg font-semibold mb-2 text-slate-900 hover:text-slate-700 line-clamp-2">
                    {post.data.title || 'Untitled Article'}
                  </h3>
                  <p className="text-slate-600 mb-3 text-sm line-clamp-2">
                    {post.data.description || ''}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <time dateTime={post.data.date}>
                      {post.data.date ? new Date(post.data.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }) : ''}
                    </time>
                    {post.data.author && (
                      <>
                        <span>•</span>
                        <span>{post.data.author}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            </article>
          ))
        )}
      </div>
    </>
  );
}
