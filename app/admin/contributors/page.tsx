'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Logo from '@/components/Logo';
import AdminRouteGuard from '@/components/AdminRouteGuard';

interface ContributorSubmission {
  id: string;
  name: string;
  email: string;
  firm: string | null;
  title: string;
  topic: string;
  draft_url: string | null;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  article_slug: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export default function AdminContributorsPage() {
  const [submissions, setSubmissions] = useState<ContributorSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'published'>('pending');

  useEffect(() => {
    loadSubmissions();
  }, [filter]);

  const loadSubmissions = async () => {
    try {
      const response = await fetch(`/api/admin/contributors?status=${filter}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Loaded submissions:', data);
        setSubmissions(data.submissions || []);
      } else {
        const errorData = await response.json();
        console.error('❌ API Error:', response.status, errorData);
        alert(`Error loading submissions: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error loading submissions:', error);
      alert(`Failed to load submissions: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, title: string) => {
    const slug = prompt('Enter article slug (will be used in URL /ai/[slug]):', 
      title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
    
    if (!slug) return;

    setProcessing(id);
    try {
      const response = await fetch('/api/admin/contributors/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: id, slug })
      });

      if (response.ok) {
        alert('Submission approved! Remember to create the article file in content/ai/');
        loadSubmissions();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error approving submission:', error);
      alert('Error approving submission');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason (will be sent to contributor):');
    if (!reason) return;

    setProcessing(id);
    try {
      const response = await fetch('/api/admin/contributors/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: id, reason })
      });

      if (response.ok) {
        alert('Submission rejected and email sent');
        loadSubmissions();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error rejecting submission:', error);
      alert('Error rejecting submission');
    } finally {
      setProcessing(null);
    }
  };

  const handleNotifyPublished = async (submission: ContributorSubmission) => {
    if (!submission.article_slug) {
      alert('No article slug set for this submission');
      return;
    }

    if (!confirm(`Send publication notification to ${submission.email}?`)) {
      return;
    }

    setProcessing(submission.id);
    try {
      const response = await fetch('/api/notify/contributor-published', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contributorName: submission.name,
          contributorEmail: submission.email,
          articleTitle: submission.title,
          articleSlug: submission.article_slug
        })
      });

      if (response.ok) {
        alert('Notification email sent!');
        
        // Update status to published
        await fetch('/api/admin/contributors/mark-published', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId: submission.id })
        });
        
        loadSubmissions();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Error sending notification');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-blue-100 text-blue-800 border-blue-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      published: 'bg-green-100 text-green-800 border-green-200',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <nav className="border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link href="/admin">
              <Logo />
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                ← Back to Admin
              </Link>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Contributor Submissions
            </h1>
            <p className="text-slate-600">
              Review and approve AI article submissions
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-200">
            {(['all', 'pending', 'approved', 'published', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  filter === status
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-600">Loading submissions...</div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
              <p className="text-slate-600">No submissions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {submission.title}
                        </h3>
                        {getStatusBadge(submission.status)}
                      </div>
                      <div className="text-sm text-slate-600 space-y-1">
                        <p>
                          <strong>Author:</strong> {submission.name}
                          {submission.firm && ` (${submission.firm})`}
                        </p>
                        <p>
                          <strong>Email:</strong> {submission.email}
                        </p>
                        <p>
                          <strong>Topic:</strong> {submission.topic}
                        </p>
                        <p>
                          <strong>Submitted:</strong>{' '}
                          {new Date(submission.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        {submission.article_slug && (
                          <p>
                            <strong>Slug:</strong>{' '}
                            <a
                              href={`/ai/${submission.article_slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              /ai/{submission.article_slug}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {submission.draft_url && (
                    <div className="mb-4 p-3 bg-slate-50 rounded">
                      <p className="text-sm text-slate-700">
                        <strong>Draft URL:</strong>{' '}
                        <a
                          href={submission.draft_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {submission.draft_url}
                        </a>
                      </p>
                    </div>
                  )}

                  {submission.message && (
                    <div className="mb-4 p-3 bg-slate-50 rounded">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        <strong>Message:</strong><br />
                        {submission.message}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {submission.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(submission.id, submission.title)}
                          disabled={processing === submission.id}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(submission.id)}
                          disabled={processing === submission.id}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {submission.status === 'approved' && (
                      <button
                        onClick={() => handleNotifyPublished(submission)}
                        disabled={processing === submission.id}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        📧 Send Publication Notification
                      </button>
                    )}

                    {submission.status === 'published' && submission.article_slug && (
                      <a
                        href={`/ai/share-success/${submission.article_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded hover:bg-slate-700"
                      >
                        View Share Page
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </AdminRouteGuard>
  );
}

