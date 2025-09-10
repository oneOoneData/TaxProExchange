'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import UserMenu from '@/components/UserMenu';
import AdminRouteGuard from '@/components/AdminRouteGuard';

export default function SendEmailsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [testEmail, setTestEmail] = useState('');

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  const sendConnectionEmails = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      const response = await fetch('/api/notifications/send-connection-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to send emails: ' + error });
    } finally {
      setLoading(false);
    }
  };

  const sendReminderEmails = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      const response = await fetch('/api/notifications/connection-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to send reminder emails: ' + error });
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      setResult({ error: 'Please enter an email address' });
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: testEmail }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to send test email: ' + error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="/" className="hover:text-slate-900">Home</a>
            <a href="/search" className="hover:text-slate-900">Search</a>
            <a href="/jobs" className="hover:text-slate-900">Jobs</a>
          </nav>
          <UserMenu 
            userName={user.fullName || undefined}
            userEmail={user.primaryEmailAddress?.emailAddress}
          />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Send Connection Emails</h1>
            <p className="text-slate-600">Test sending connection request notification emails</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Email Actions</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={sendConnectionEmails}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  {loading ? 'Sending...' : 'Send Individual Connection Emails'}
                </button>
                <p className="text-sm text-slate-600">
                  Sends one email per connection request
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={sendReminderEmails}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-green-400 transition-colors"
                >
                  {loading ? 'Sending...' : 'Send Reminder Emails'}
                </button>
                <p className="text-sm text-slate-600">
                  Sends one email per recipient with all their pending requests
                </p>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-slate-900 mb-3">Test Email (Dev Only)</h3>
                <div className="flex items-center gap-4">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter email address to test"
                    className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={sendTestEmail}
                    disabled={loading || !testEmail}
                    className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                  >
                    {loading ? 'Sending...' : 'Send Test Email'}
                  </button>
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  Test if email sending works with your current configuration
                </p>
              </div>
            </div>
          </div>

          {result && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Results</h3>
              <pre className="bg-slate-50 p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </motion.div>
      </div>
    </div>
    </AdminRouteGuard>
  );
}
