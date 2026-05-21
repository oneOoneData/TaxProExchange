'use client';

import { useState } from 'react';

export default function NewsletterSignup() {
  const [form, setForm] = useState({ name: '', email: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to subscribe');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="mb-12 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 p-8 text-center">
        <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">You&rsquo;re in!</h3>
        <p className="text-slate-600 text-sm">Check your inbox for a welcome email. We&rsquo;ll send new articles as they publish.</p>
      </div>
    );
  }

  return (
    <div className="mb-12 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-8 text-white">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <h3 className="text-lg font-semibold">Get Insights in Your Inbox</h3>
          </div>
          <p className="text-slate-300 text-sm">
            New articles on AI in tax, industry trends, and tools for CPAs — delivered when we publish. No spam.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:min-w-[360px]">
          <input
            type="text"
            placeholder="First name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="flex-none w-full sm:w-28 px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="email"
            required
            placeholder="Work email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="flex-1 px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
          >
            {status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
      </div>
      {status === 'error' && (
        <p className="mt-3 text-sm text-red-300">{errorMsg}</p>
      )}
    </div>
  );
}
