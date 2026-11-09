'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import VoteButton from './VoteButton';
import type { DirectoryTool, Sentiment } from '@/lib/aiTools';

type SortKey = 'discussed' | 'votes' | 'newest' | 'name';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'discussed', label: 'Most discussed' },
  { key: 'votes', label: 'Most voted' },
  { key: 'newest', label: 'Newest' },
  { key: 'name', label: 'A–Z' },
];

const SENTIMENT_STYLE: Record<Sentiment, { label: string; cls: string }> = {
  positive: { label: 'Positive', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  mixed: { label: 'Mixed', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
  negative: { label: 'Critical', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
};

const NEW_WINDOW_MS = 1000 * 60 * 60 * 24 * 90;

function slugifyCategory(c: string) {
  return c.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function Logo({ tool }: { tool: DirectoryTool }) {
  if (tool.logo_url) {
    return (
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Image src={tool.logo_url} alt="" fill sizes="48px" className="object-contain p-1.5" />
      </div>
    );
  }
  return (
    <div
      aria-hidden
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-lg font-semibold text-white"
    >
      {tool.name.charAt(0)}
    </div>
  );
}

function ToolCard({ tool, now }: { tool: DirectoryTool; now: number }) {
  const isNew = now - new Date(tool.created_at).getTime() < NEW_WINDOW_MS;
  const sentiment = tool.sentiment && tool.reviewCount >= 3 ? SENTIMENT_STYLE[tool.sentiment.label] : null;

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start gap-3">
        <Logo tool={tool} />
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Link href={`/insights/tools/${tool.slug}`} className="truncate hover:underline">
              {tool.name}
            </Link>
            {isNew && (
              <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-medium text-white">New</span>
            )}
          </h3>
          {tool.category && <p className="text-xs text-slate-500">{tool.category}</p>}
        </div>
      </div>

      {tool.short_description && (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{tool.short_description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        {sentiment ? (
          <span className={`rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${sentiment.cls}`}>
            Reddit: {sentiment.label}
          </span>
        ) : (
          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-slate-500 ring-1 ring-inset ring-slate-200">
            Not enough Reddit data yet
          </span>
        )}
        {tool.reviewCount > 0 && (
          <span className="text-slate-500">
            {tool.reviewCount} {tool.reviewCount === 1 ? 'mention' : 'mentions'}
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href={`/insights/tools/${tool.slug}`} className="text-blue-600 hover:text-blue-700">
            Details →
          </Link>
          {tool.review_url && (
            <Link href={tool.review_url} className="text-slate-700 hover:text-slate-900">
              Our review
            </Link>
          )}
        </div>
        <VoteButton toolId={tool.id} initialVotes={tool.votes} />
      </div>
    </article>
  );
}

export default function ToolDirectory({
  tools,
  categories,
}: {
  tools: DirectoryTool[];
  categories: string[];
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('discussed');
  const [now] = useState(() => Date.now());

  // Allow shareable links like /insights/tools?category=tax-research
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('category');
    if (param) {
      const match = categories.find((c) => slugifyCategory(c) === param);
      if (match) setCategory(match);
    }
  }, [categories]);

  const selectCategory = (c: string | null) => {
    setCategory(c);
    const url = new URL(window.location.href);
    if (c) url.searchParams.set('category', slugifyCategory(c));
    else url.searchParams.delete('category');
    window.history.replaceState(null, '', url.toString());
  };

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    tools.forEach((t) => t.category && (m[t.category] = (m[t.category] || 0) + 1));
    return m;
  }, [tools]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = tools.filter(
      (t) =>
        (!category || t.category === category) &&
        (!q || `${t.name} ${t.short_description ?? ''} ${t.category ?? ''}`.toLowerCase().includes(q))
    );
    const byName = (a: DirectoryTool, b: DirectoryTool) => a.name.localeCompare(b.name);
    const sorters: Record<SortKey, (a: DirectoryTool, b: DirectoryTool) => number> = {
      discussed: (a, b) => b.reviewCount - a.reviewCount || b.votes - a.votes || byName(a, b),
      votes: (a, b) => b.votes - a.votes || b.reviewCount - a.reviewCount || byName(a, b),
      newest: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime() || byName(a, b),
      name: byName,
    };
    return [...filtered].sort(sorters[sort]);
  }, [tools, query, category, sort]);

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
      active ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-100'
    }`;

  return (
    <section aria-label="AI tools directory">
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search tools</span>
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools, e.g. K-1, research, intake…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="whitespace-nowrap">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <button type="button" onClick={() => selectCategory(null)} className={chip(!category)}>
            All <span className="opacity-60">{tools.length}</span>
          </button>
          {categories.map((c) => (
            <button key={c} type="button" onClick={() => selectCategory(c)} className={chip(category === c)}>
              {c} <span className="opacity-60">{counts[c] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((tool) => (
            <ToolCard key={tool.id} tool={tool} now={now} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-slate-700">No tools match that search.</p>
          <p className="mt-1 text-sm text-slate-500">
            Know one we&apos;re missing?{' '}
            <Link href="/feedback" className="text-blue-600 underline hover:text-blue-700">
              Suggest it
            </Link>
            .
          </p>
        </div>
      )}
    </section>
  );
}
