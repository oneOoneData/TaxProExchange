/**
 * BenchCard Component
 * 
 * Display and edit individual bench item (team member).
 * Supports inline editing of custom title, note, categories, and visibility.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
  primary_location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  years_experience?: string;
  specializations?: string[];
  software?: string[];
  accepting_work?: boolean;
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

// Predefined categories that firms can use
const PREDEFINED_CATEGORIES = [
  'Tax Preparer',
  'Tax Reviewer',
  'Tax Lawyer',
  'Financial Planner',
  'IRS Specialist',
  'S-Corp Specialist',
  'Partnership Specialist',
  'SALT Specialist',
  'International Tax',
  'Bookkeeper',
  'CFO Services',
  'Overflow Support',
];

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
  const [newCategory, setNewCategory] = useState('');
  const [editData, setEditData] = useState({
    custom_title: item.custom_title || '',
    note: item.note || '',
    categories: item.categories || [],
    visibility_public: item.visibility_public,
  });

  const profile = item.profiles;
  const avatarUrl = profile.image_url || profile.avatar_url;
  const isAvailable = profile.is_listed && profile.visibility_state === 'listed';
  const location = profile.primary_location;
  const locationStr = location ? 
    [location.city, location.state].filter(Boolean).join(', ') : null;

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
            <Image
              src={avatarUrl}
              alt={`${profile.first_name} ${profile.last_name}`}
              width={48}
              height={48}
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
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href={`/p/${profile.slug}`}
                  className="font-semibold text-gray-900 hover:text-blue-600"
                >
                  {profile.first_name} {profile.last_name}, {profile.credential_type}
                </Link>
                {profile.accepting_work ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    ✓ Available
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    Not Accepting Work
                  </span>
                )}
              </div>

              {/* Location, License, Experience */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mb-2">
                {locationStr && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {locationStr}
                  </span>
                )}
                {profile.years_experience && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {profile.years_experience} years
                  </span>
                )}
              </div>

              {profile.firm_name && (
                <p className="text-sm text-gray-600 mb-1">{profile.firm_name}</p>
              )}

              {/* Headline */}
              {profile.headline && (
                <p className="text-sm text-gray-600 mb-2">{profile.headline}</p>
              )}

              {/* Specializations */}
              {profile.specializations && profile.specializations.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  <span className="text-xs text-gray-500 font-medium">Specializations:</span>
                  {profile.specializations.slice(0, 4).map((spec, idx) => (
                    <span key={idx} className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                      {spec}
                    </span>
                  ))}
                  {profile.specializations.length > 4 && (
                    <span className="inline-block text-xs text-gray-500">
                      +{profile.specializations.length - 4} more
                    </span>
                  )}
                </div>
              )}

              {/* Software */}
              {profile.software && profile.software.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  <span className="text-xs text-gray-500 font-medium">Software:</span>
                  {profile.software.slice(0, 3).map((sw, idx) => (
                    <span key={idx} className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {sw}
                    </span>
                  ))}
                  {profile.software.length > 3 && (
                    <span className="inline-block text-xs text-gray-500">
                      +{profile.software.length - 3} more
                    </span>
                  )}
                </div>
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
          {isEditing && (
            <div className="mt-2 space-y-2">
              <label className="block text-xs font-medium text-gray-700">
                Team Categories (e.g., Tax Preparer, Reviewer, IRS Specialist)
              </label>
              
              {/* Selected Categories */}
              <div className="flex flex-wrap gap-2 mb-2">
                {editData.categories.map((cat, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {cat}
                    <button
                      type="button"
                      onClick={() => setEditData({
                        ...editData,
                        categories: editData.categories.filter((_, i) => i !== idx)
                      })}
                      className="hover:text-purple-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Category Dropdown */}
              <div className="flex gap-2">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !editData.categories.includes(e.target.value)) {
                      setEditData({
                        ...editData,
                        categories: [...editData.categories, e.target.value]
                      });
                    }
                  }}
                  className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                >
                  <option value="">+ Add category...</option>
                  {PREDEFINED_CATEGORIES.filter(c => !editData.categories.includes(c)).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="or type custom..."
                  className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCategory.trim()) {
                      e.preventDefault();
                      if (!editData.categories.includes(newCategory.trim())) {
                        setEditData({
                          ...editData,
                          categories: [...editData.categories, newCategory.trim()]
                        });
                      }
                      setNewCategory('');
                    }
                  }}
                />
                {newCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      if (newCategory.trim() && !editData.categories.includes(newCategory.trim())) {
                        setEditData({
                          ...editData,
                          categories: [...editData.categories, newCategory.trim()]
                        });
                        setNewCategory('');
                      }
                    }}
                    className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Add
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Categories help you organize your team (e.g., who handles 1040s, who does IRS rep, etc.)
              </p>
            </div>
          )}

          {/* Note */}
          <div className="mt-2">
            {isEditing ? (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Private Notes (only visible to your team)
                </label>
                <textarea
                  value={editData.note}
                  onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                  placeholder="Internal notes about this professional (rates, availability, past projects, etc.)"
                  rows={2}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                />
              </div>
            ) : (
              editData.note && (
                <div className="bg-gray-50 border-l-2 border-gray-300 px-3 py-2 rounded">
                  <p className="text-xs text-gray-500 font-medium mb-0.5">Internal Note:</p>
                  <p className="text-sm text-gray-700">{editData.note}</p>
                </div>
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
                    setNewCategory('');
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

