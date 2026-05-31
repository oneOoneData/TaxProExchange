'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppNavigation from '@/components/AppNavigation';
import Footer from '@/components/Footer';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

const SPECIALTIES = ['Individual','Small business','Real estate','Crypto','Medical','Legal','International','Estate/Trust','Other'];
const SOFTWARE = ['Drake','Lacerte','ProSeries','UltraTax','TaxSlayer','QuickBooks','Xero','Other'];
const REASONS = ['Retirement','Health','Relocation','Career change','Other'];

export default function ListPracticePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    state: '',
    years_established: 0,
    annual_revenue_min: 100000,
    annual_revenue_max: 150000,
    client_count_min: 50,
    client_count_max: 100,
    revenue_pct_tax: 70,
    revenue_pct_bookkeeping: 20,
    revenue_pct_advisory: 10,
    staff_count: 0,
    specialties: [] as string[],
    software_stack: [] as string[],
    asking_price_min: 0,
    asking_price_max: 0,
    reason_for_sale: '',
    remote_friendly: false,
    seller_financing: false,
    additional_notes: '',
    seller_name: '',
    firm_name: '',
    email: '',
    phone: '',
    city: '',
  });

  if (!isLoaded) return null;
  if (!user) { router.push('/sign-in'); return null; }

  const toggleArray = (field: 'specialties' | 'software_stack', value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Validate revenue % add to 100
    const total = form.revenue_pct_tax + form.revenue_pct_bookkeeping + form.revenue_pct_advisory;
    if (total !== 100) {
      alert('Revenue breakdown must add up to 100%');
      setSubmitting(false);
      return;
    }

    const res = await fetch('/api/practices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setSubmitted(true);
    } else {
      alert('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Your listing is under review</h2>
          <p className="text-slate-600 mb-6">We&apos;ll email you when it&apos;s live — usually within 24 hours.</p>
          <Link href="/practices" className="text-blue-600 hover:text-blue-700 font-medium">Back to practices →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <AppNavigation />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">List Your Practice for Sale</h1>
          <p className="text-slate-600">Free to list. Your contact info stays private until a buyer pays to unlock it.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seller Contact (Private) */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-amber-800 mb-3">Your Contact Info — Kept Private</h3>
            <p className="text-xs text-amber-700 mb-4">Only shown to buyers who pay $150/month.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required placeholder="Your name" value={form.seller_name} onChange={e => setForm({...form, seller_name: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <input required placeholder="Firm name" value={form.firm_name} onChange={e => setForm({...form, firm_name: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <input required placeholder="City" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
          </div>

          {/* Practice Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Practice Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">State *</label>
                <select required value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option value="">Select state</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Years established *</label>
                <input required type="number" min={1} value={form.years_established} onChange={e => setForm({...form, years_established: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Annual revenue (min) *</label>
                <select value={form.annual_revenue_min} onChange={e => setForm({...form, annual_revenue_min: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  {[100000,150000,200000,250000,300000,400000,500000,600000,700000,800000,900000,1000000,1250000,1500000,2000000].map(v => (
                    <option key={v} value={v}>${(v/1000).toFixed(0)}K</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Annual revenue (max) *</label>
                <select value={form.annual_revenue_max} onChange={e => setForm({...form, annual_revenue_max: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  {[100000,150000,200000,250000,300000,400000,500000,600000,700000,800000,900000,1000000,1250000,1500000,2000000].map(v => (
                    <option key={v} value={v}>${(v/1000).toFixed(0)}K</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Client count (min)</label>
                <input type="number" min={0} value={form.client_count_min} onChange={e => setForm({...form, client_count_min: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Client count (max)</label>
                <input type="number" min={0} value={form.client_count_max} onChange={e => setForm({...form, client_count_max: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">Revenue breakdown (% must add to 100)</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] text-slate-500">Tax prep</span>
                  <input type="number" min={0} max={100} value={form.revenue_pct_tax} onChange={e => setForm({...form, revenue_pct_tax: parseInt(e.target.value) || 0, revenue_pct_advisory: Math.max(0, 100 - (parseInt(e.target.value) || 0) - form.revenue_pct_bookkeeping)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Bookkeeping</span>
                  <input type="number" min={0} max={100} value={form.revenue_pct_bookkeeping} onChange={e => setForm({...form, revenue_pct_bookkeeping: parseInt(e.target.value) || 0, revenue_pct_advisory: Math.max(0, 100 - form.revenue_pct_tax - (parseInt(e.target.value) || 0))})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Advisory</span>
                  <input type="number" min={0} max={100} value={form.revenue_pct_advisory} onChange={e => setForm({...form, revenue_pct_advisory: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
              </div>
              <p className={`text-xs mt-1 ${form.revenue_pct_tax + form.revenue_pct_bookkeeping + form.revenue_pct_advisory === 100 ? 'text-emerald-600' : 'text-red-600'}`}>
                Total: {form.revenue_pct_tax + form.revenue_pct_bookkeeping + form.revenue_pct_advisory}%
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Staff count (excluding owner)</label>
              <input type="number" min={0} value={form.staff_count} onChange={e => setForm({...form, staff_count: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">Specialties</label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map(s => (
                  <button key={s} type="button" onClick={() => toggleArray('specialties', s)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${form.specialties.includes(s) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >{s}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">Software stack</label>
              <div className="flex flex-wrap gap-2">
                {SOFTWARE.map(s => (
                  <button key={s} type="button" onClick={() => toggleArray('software_stack', s)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${form.software_stack.includes(s) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >{s}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Asking price (min)</label>
                <select value={form.asking_price_min} onChange={e => setForm({...form, asking_price_min: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option value={0}>Not specified</option>
                  {[50000,100000,150000,200000,250000,300000,400000,500000,600000,700000,800000,900000,1000000,1250000,1500000,2000000].map(v => (
                    <option key={v} value={v}>${(v/1000).toFixed(0)}K</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Asking price (max)</label>
                <select value={form.asking_price_max} onChange={e => setForm({...form, asking_price_max: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option value={0}>Not specified</option>
                  {[50000,100000,150000,200000,250000,300000,400000,500000,600000,700000,800000,900000,1000000,1250000,1500000,2000000].map(v => (
                    <option key={v} value={v}>${(v/1000).toFixed(0)}K</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Reason for sale</label>
              <select value={form.reason_for_sale} onChange={e => setForm({...form, reason_for_sale: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="">Select reason</option>
                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.remote_friendly} onChange={e => setForm({...form, remote_friendly: e.target.checked})} className="rounded" />
                Remote-friendly
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.seller_financing} onChange={e => setForm({...form, seller_financing: e.target.checked})} className="rounded" />
                Seller financing available
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Additional notes <span className="text-amber-600">(do NOT include your name or firm name here — this is public)</span>
              </label>
              <textarea rows={3} value={form.additional_notes} onChange={e => setForm({...form, additional_notes: e.target.value})} placeholder="Describe what makes this practice unique..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !form.state || !form.seller_name || !form.firm_name || !form.email}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
          >
            {submitting ? 'Submitting...' : 'List Your Practice — Free'}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
