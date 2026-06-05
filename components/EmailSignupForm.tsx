'use client';

import { useState, FormEvent } from 'react';

export function EmailSignupForm({ source }: { source: string }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || undefined }),
      });

      if (res.ok) {
        setStatus('success');
        setMessage('You&apos;re in! Check your inbox for the welcome email.');
      } else {
        const data = await res.json();
        setStatus('error');
        setMessage(data.error || 'Something went wrong.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-3xl mb-2">✅</div>
        <h3 className="text-lg font-semibold text-green-900 mb-1">You&apos;re subscribed!</h3>
        <p className="text-green-700 text-sm">{message}</p>
        <p className="text-green-600 text-xs mt-3">
          Check your inbox for the welcome email. Add support@taxproexchange.com to your contacts so we don&apos;t end up in spam.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 md:p-8 border border-slate-700">
      <div className="flex items-start gap-4 mb-4">
        <div className="text-2xl">✉️</div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Get more AI workflows like this</h3>
          <p className="text-sm text-slate-400">
            Join the AI Tax Pro list. New prompts, templates, and resources — no spam, unsubscribe anytime.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            placeholder="First name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <input
            type="email"
            required
            placeholder="you@firm.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium rounded-lg transition-all text-sm"
        >
          {status === 'loading' ? 'Sending...' : 'Send me the series →'}
        </button>
      </form>

      {status === 'error' && (
        <p className="mt-3 text-sm text-red-400">{message}</p>
      )}

      <p className="text-xs text-slate-500 mt-3">
        No spam. Unsubscribe anytime. TaxProExchange respects your inbox.
      </p>
    </div>
  );
}
