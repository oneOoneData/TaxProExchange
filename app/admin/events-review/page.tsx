'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminRouteGuard from '@/components/AdminRouteGuard';

interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location_city?: string;
  location_state?: string;
  candidate_url: string;
  canonical_url?: string;
  url_status?: number;
  link_health_score: number;
  last_checked_at: string;
  review_status: 'pending_review' | 'approved' | 'rejected' | 'needs_edit';
  admin_notes?: string;
  tags: string[];
  organizer?: string;
}

export default function EventsReviewPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending_review' | 'approved' | 'rejected'>('pending_review');
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Event>>({});

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/admin/events-review');
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateEventStatus = async (eventId: string, status: string, notes?: string) => {
    try {
      const response = await fetch('/api/admin/events-review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, status, notes })
      });

      if (response.ok) {
        await loadEvents(); // Reload events
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Error updating event status');
    }
  };

  const startEditing = (event: Event) => {
    setEditingEvent(event.id);
    setEditForm({
      title: event.title,
      description: event.description,
      candidate_url: event.candidate_url,
      canonical_url: event.canonical_url,
      location_city: event.location_city,
      location_state: event.location_state,
      organizer: event.organizer,
      admin_notes: event.admin_notes
    });
  };

  const cancelEditing = () => {
    setEditingEvent(null);
    setEditForm({});
  };

  const saveEventEdit = async (eventId: string) => {
    try {
      const response = await fetch('/api/admin/events-review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          eventId, 
          status: 'needs_edit',
          notes: editForm.admin_notes,
          updates: {
            title: editForm.title,
            description: editForm.description,
            candidate_url: editForm.candidate_url,
            canonical_url: editForm.canonical_url,
            location_city: editForm.location_city,
            location_state: editForm.location_state,
            organizer: editForm.organizer
          }
        })
      });

      if (response.ok) {
        await loadEvents();
        setEditingEvent(null);
        setEditForm({});
        alert('Event updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Error updating event');
    }
  };

  const refreshEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/events/refresh', { method: 'POST' });
      if (response.ok) {
        await loadEvents();
        alert('Events refreshed successfully!');
      } else {
        alert('Error refreshing events');
      }
    } catch (error) {
      console.error('Error refreshing events:', error);
      alert('Error refreshing events');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => 
    filter === 'all' || event.review_status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'needs_edit': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Events Review</h1>
            <p className="mt-2 text-gray-600">
              Review and approve events before they go live. Only approved events are shown to users.
            </p>
          </div>

          {/* Controls */}
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('pending_review')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'pending_review' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Pending Review ({events.filter(e => e.review_status === 'pending_review').length})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'approved' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Approved ({events.filter(e => e.review_status === 'approved').length})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'rejected' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Rejected ({events.filter(e => e.review_status === 'rejected').length})
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'all' 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                All ({events.length})
              </button>
            </div>

            <button
              onClick={refreshEvents}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh Events (Weekly)'}
            </button>
          </div>

          {/* Events List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-600">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No events found for the selected filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg border border-gray-200 p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {event.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>📅 {new Date(event.start_date).toLocaleDateString()}</span>
                        {event.location_city && (
                          <span>📍 {event.location_city}, {event.location_state}</span>
                        )}
                        <span className={getScoreColor(event.link_health_score)}>
                          🔗 Link Score: {event.link_health_score}/100
                        </span>
                        <span>
                          Status: {event.url_status ? event.url_status : 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.review_status)}`}>
                      {event.review_status.replace('_', ' ')}
                    </span>
                  </div>

                  {event.description && (
                    <p className="text-gray-700 mb-4">{event.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* URL Testing */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">Event URL:</p>
                        <a
                          href={event.canonical_url || event.candidate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 text-sm break-all"
                        >
                          {event.canonical_url || event.candidate_url}
                        </a>
                      </div>
                      <button
                        onClick={() => window.open(event.canonical_url || event.candidate_url, '_blank')}
                        className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                      >
                        Test Link
                      </button>
                    </div>
                  </div>

                  {/* Admin Notes */}
                  {event.admin_notes && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-1">Admin Notes:</p>
                      <p className="text-sm text-blue-800">{event.admin_notes}</p>
                    </div>
                  )}

                  {/* Edit Form */}
                  {editingEvent === event.id && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                      <h4 className="text-lg font-medium mb-4">Edit Event Details</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={editForm.title || ''}
                            onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={editForm.description || ''}
                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location City</label>
                            <input
                              type="text"
                              value={editForm.location_city || ''}
                              onChange={(e) => setEditForm({...editForm, location_city: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location State</label>
                            <input
                              type="text"
                              value={editForm.location_state || ''}
                              onChange={(e) => setEditForm({...editForm, location_state: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Event URL</label>
                          <input
                            type="url"
                            value={editForm.candidate_url || ''}
                            onChange={(e) => setEditForm({...editForm, candidate_url: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Organizer</label>
                          <input
                            type="text"
                            value={editForm.organizer || ''}
                            onChange={(e) => setEditForm({...editForm, organizer: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                          <textarea
                            value={editForm.admin_notes || ''}
                            onChange={(e) => setEditForm({...editForm, admin_notes: e.target.value})}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Add notes about your edits..."
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEventEdit(event.id)}
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                          >
                            💾 Save Changes
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {event.review_status === 'pending_review' && !editingEvent && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateEventStatus(event.id, 'approved')}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => updateEventStatus(event.id, 'rejected', 'URL not working or event not relevant')}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                      >
                        ❌ Reject
                      </button>
                      <button
                        onClick={() => startEditing(event)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        ✏️ Edit Event
                      </button>
                    </div>
                  )}

                  {event.review_status === 'approved' && (
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded">
                        ✅ Approved
                      </span>
                      <button
                        onClick={() => updateEventStatus(event.id, 'pending_review')}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                      >
                        Undo Approval
                      </button>
                    </div>
                  )}

                  {event.review_status === 'rejected' && (
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded">
                        ❌ Rejected
                      </span>
                      <button
                        onClick={() => updateEventStatus(event.id, 'pending_review')}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                      >
                        Undo Rejection
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminRouteGuard>
  );
}
