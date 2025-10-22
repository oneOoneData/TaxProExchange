'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Logo from '@/components/Logo';
import AdminRouteGuard from '@/components/AdminRouteGuard';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface EmailLog {
  id: number;
  from_email: string;
  subject: string;
  recipients: string[];
  sent_at: string;
  emails_sent: number;
  emails_failed: number;
}

export default function MarketingPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [customEmails, setCustomEmails] = useState<string>('');
  const [fromEmail, setFromEmail] = useState('TaxProExchange <support@taxproexchange.com>');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
    loadEmailLogs();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/marketing/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadEmailLogs = async () => {
    try {
      const response = await fetch('/api/admin/marketing/logs');
      if (response.ok) {
        const data = await response.json();
        setEmailLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error loading email logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const getSelectedEmails = () => {
    const userEmails = selectedUsers.map(userId => {
      const user = users.find(u => u.id === userId);
      return user?.email;
    }).filter(Boolean) as string[];

    const customEmailList = customEmails
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));

    return [...userEmails, ...customEmailList];
  };

  const sendMarketingEmail = async () => {
    const recipients = getSelectedEmails();
    
    if (recipients.length === 0) {
      setResult('❌ Please select at least one recipient');
      return;
    }

    if (!subject.trim()) {
      setResult('❌ Please enter a subject');
      return;
    }

    if (!body.trim()) {
      setResult('❌ Please enter email body');
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/send-marketing-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          subject: subject.trim(),
          body: body.trim(),
          recipients
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(`✅ Success! Marketing email sent to ${data.emailsSent} recipients\n` +
          `Failed: ${data.emailsFailed}\n` +
          `Total recipients: ${recipients.length}`);
        
        // Clear form
        setSubject('');
        setBody('');
        setSelectedUsers([]);
        setCustomEmails('');
        
        // Reload email logs
        await loadEmailLogs();
      } else {
        const error = await response.json();
        setResult(`❌ Error: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <AdminRouteGuard>
        <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
            <p className="mt-2 text-slate-600">Loading marketing tools...</p>
          </div>
        </div>
      </AdminRouteGuard>
    );
  }

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Logo />
            <nav className="flex items-center gap-6 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">Home</Link>
              <Link href="/admin" className="hover:text-slate-900">Admin</Link>
              <Link href="/admin/marketing" className="hover:text-slate-900 font-medium">Marketing</Link>
            </nav>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-900 mb-2">Marketing Email Sender</h1>
            <p className="text-slate-600">Send broadcast emails to users via Resend. All sends are logged for tracking.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Email Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Compose Email</h2>
              
              <div className="space-y-4">
                {/* From Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    From Address
                  </label>
                  <input
                    type="text"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="TaxProExchange <support@taxproexchange.com>"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email subject..."
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Body (Plain Text)
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email content here..."
                  />
                </div>

                {/* Recipients Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Recipients ({getSelectedEmails().length} selected)
                  </label>
                  
                  {/* Select All */}
                  <div className="mb-3">
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'} Users
                    </button>
                  </div>

                  {/* User List */}
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3 space-y-2">
                    {users.map(user => (
                      <label key={user.id} className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleUserToggle(user.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-slate-500 truncate">{user.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Custom Emails */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Additional Email Addresses (one per line)
                    </label>
                    <textarea
                      value={customEmails}
                      onChange={(e) => setCustomEmails(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
                    />
                  </div>
                </div>

                {/* Send Button */}
                <div className="pt-4">
                  <button
                    onClick={sendMarketingEmail}
                    disabled={sending}
                    className="w-full inline-flex items-center justify-center rounded-xl bg-blue-600 text-white px-6 py-3 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {sending ? 'Sending...' : `Send to ${getSelectedEmails().length} Recipients`}
                  </button>
                </div>

                {/* Result */}
                {result && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap">{result}</pre>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Email Logs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Email History</h2>
              
              {emailLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>No marketing emails sent yet</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {emailLogs.map(log => (
                    <div key={log.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-slate-900">{log.subject}</h3>
                        <span className="text-sm text-slate-500">{formatDate(log.sent_at)}</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">From: {log.from_email}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-600">✓ {log.emails_sent} sent</span>
                        {log.emails_failed > 0 && (
                          <span className="text-red-600">✗ {log.emails_failed} failed</span>
                        )}
                        <span className="text-slate-500">{log.recipients.length} recipients</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
