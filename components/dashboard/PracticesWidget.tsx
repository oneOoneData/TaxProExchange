'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ListingSummary {
  id: string;
  state: string;
  annual_revenue_min: number;
  annual_revenue_max: number;
  asking_price_min: number | null;
  asking_price_max: number | null;
  reason_for_sale: string;
}

export default function PracticesWidget() {
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasBuyerAccess, setHasBuyerAccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [listingsRes, accessRes] = await Promise.all([
      fetch('/api/practices'),
      fetch('/api/practice-buyer/status'),
    ]);
    if (listingsRes.ok) {
      const data = await listingsRes.json();
      setListings(data.listings?.slice(0, 3) || []);
    }
    if (accessRes.ok) {
      const data = await accessRes.json();
      setHasBuyerAccess(data.hasAccess);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="h-16 bg-slate-100 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-slate-900">Practices for Sale</h2>
        <Link href="/practices" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Browse All →
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-slate-400 mb-3">No practices listed yet.</p>
          <Link
            href="/practices/list"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            List Your Practice Free
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {listings.map((l) => (
            <Link
              key={l.id}
              href={`/practices/${l.id}`}
              className="block p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-900">{l.state}</span>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{l.reason_for_sale || 'For sale'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>${(l.annual_revenue_min/1000).toFixed(0)}K–${(l.annual_revenue_max/1000).toFixed(0)}K</span>
                {l.asking_price_min && <span>Asking: ${(l.asking_price_min/1000).toFixed(0)}K</span>}
              </div>
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <Link href="/practices/list" className="text-xs text-blue-600 hover:text-blue-700">
              List yours free →
            </Link>
            {!hasBuyerAccess && (
              <Link href="/practices" className="text-xs font-medium text-amber-600 hover:text-amber-700">
                🔒 Unlock contacts $150/year
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
