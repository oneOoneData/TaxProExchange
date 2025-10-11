/**
 * BenchCard Component
 * 
 * Display and edit individual bench item (team member).
 * Supports inline editing of custom title, note, categories, and visibility.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  credential_type: string;
  slug: string;
  firm_name?: string;
  avatar_url?: string;
  image_url?: string;
  headline?: string;
  is_listed?: boolean;
  visibility_state?: string;
}

interface BenchCardProps {
  item: {
    id: string;
    custom_title?: string;
    categories?: string[];
    note?: string;
    priority: number;
    visibility_public: boolean;
    profiles: Profile;
  };
  onUpdate: (id: string, updates: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export default function BenchCard({
  item,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
}: BenchCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editData, setEditData] = useState({
    custom_title: item.custom_title || '',
    note: item.note || '',
    categories: item.categories || [],
    visibility_public: item.visibility_public,
  });

  const profile = item.profiles;
  const avatarUrl = profile.image_url || profile.avatar_url;
  const isAvailable = profile.is_listed && profile.visibility_state === 'listed';

  const handleSave = async () => {
    await onUpdate(item.id, editData);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Remove this person from your team roster?')) {
      setIsDeleting(true);
      await onDelete(item.id);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${profile.first_name} ${profile.last_name}`}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
              {profile.first_name[0]}{profile.last_name[0]}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name and Credential */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link
                href={`/p/${profile.slug}`}
                className="font-semibold text-gray-900 hover:text-blue-600"
              >
                {profile.first_name} {profile.last_name}, {profile.credential_type}
              </Link>
              {profile.firm_name && (
                <p className="text-sm text-gray-600">{profile.firm_name}</p>
              )}
              {!isAvailable && (
                <span className="inline-block mt-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  Unavailable
                </span>
              )}
            </div>
            
            {/* Priority Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onMoveUp?.(item.id)}
                disabled={isFirst}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move up"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => onMoveDown?.(item.id)}
                disabled={isLast}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move down"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Custom Title */}
          <div className="mt-2">
            {isEditing ? (
              <input
                type="text"
                value={editData.custom_title}
                onChange={(e) => setEditData({ ...editData, custom_title: e.target.value })}
                placeholder="Custom title (e.g., IRS Rep, 1040 Overflow)"
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              />
            ) : (
              editData.custom_title && (
                <p className="text-sm text-blue-600 font-medium">{editData.custom_title}</p>
              )
            )}
          </div>

          {/* Categories */}
          {editData.categories.length > 0 && !isEditing && (
            <div className="mt-2 flex flex-wrap gap-1">
              {editData.categories.map((cat, idx) => (
                <span key={idx} className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  {cat}
                </span>
              ))}
            </div>
          )}

          {/* Note */}
          <div className="mt-2">
            {isEditing ? (
              <textarea
                value={editData.note}
                onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                placeholder="Private notes..."
                rows={2}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              />
            ) : (
              editData.note && (
                <p className="text-sm text-gray-600 italic">{editData.note}</p>
              )
            )}
          </div>

          {/* Actions */}
          <div className="mt-3 flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditData({
                      custom_title: item.custom_title || '',
                      note: item.note || '',
                      categories: item.categories || [],
                      visibility_public: item.visibility_public,
                    });
                    setIsEditing(false);
                  }}
                  className="text-sm font-medium text-gray-600 hover:text-gray-700"
                >
                  Cancel
                </button>
                <label className="flex items-center gap-1.5 text-sm text-gray-700 ml-auto">
                  <input
                    type="checkbox"
                    checked={editData.visibility_public}
                    onChange={(e) => setEditData({ ...editData, visibility_public: e.target.checked })}
                    className="rounded"
                  />
                  Show publicly
                </label>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Removing...' : 'Remove'}
                </button>
                <span className="text-sm text-gray-500 ml-auto">
                  {editData.visibility_public ? '👁️ Public' : '🔒 Private'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

