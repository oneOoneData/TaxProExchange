'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { DEFAULT_WORKING_EXPECTATIONS, suggestDraftEta, addBusinessDays } from '@/lib/constants/working-expectations';

interface WorkingExpectationsEditorProps {
  value: string;
  onChange: (value: string) => void;
  volume?: number;
  onDraftEtaChange?: (date: string) => void;
  onBufferDaysChange?: (days: number) => void;
  onLiabilityChange?: (required: boolean) => void;
  draftEtaDate?: string;
  bufferDays?: number;
  liabilityRequired?: boolean;
  errors?: {
    draftEtaDate?: string;
    bufferDays?: string;
  };
}

export function WorkingExpectationsEditor({
  value,
  onChange,
  volume,
  onDraftEtaChange,
  onBufferDaysChange,
  onLiabilityChange,
  draftEtaDate,
  bufferDays = 3,
  liabilityRequired = false,
  errors = {}
}: WorkingExpectationsEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  const handleInsertTemplate = () => {
    onChange(DEFAULT_WORKING_EXPECTATIONS);
  };

  const handleReset = () => {
    onChange('');
  };

  const handleUseEtaSuggestion = () => {
    if (onDraftEtaChange) {
      const suggestedDate = suggestDraftEta(volume);
      onDraftEtaChange(suggestedDate.toISOString().split('T')[0]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const validateDeadlineBuffer = () => {
    if (draftEtaDate && onDraftEtaChange) {
      const draftDate = new Date(draftEtaDate);
      const bufferDate = addBusinessDays(draftDate, bufferDays);
      return bufferDate;
    }
    return null;
  };

  const bufferDate = validateDeadlineBuffer();

  return (
    <section className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Working expectations (optional)</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleInsertTemplate}
            className="text-sm underline hover:text-blue-600"
          >
            Insert recommended template
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="text-sm underline hover:text-blue-600"
          >
            Reset
          </button>
          <label className="text-sm flex items-center gap-1 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showPreview} 
              onChange={(e) => setShowPreview(e.target.checked)} 
            />
            Preview
          </label>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        Use the template and edit to fit this job. Applicants will see this on the job page.
      </p>

      {!showPreview ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={10}
          placeholder="Add specific expectations about timing, corrections window, communication, and change control…"
          className="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <div className="prose max-w-none border rounded p-3 bg-white">
          <ReactMarkdown>{value || "_(empty)_"}</ReactMarkdown>
        </div>
      )}

      {/* Smart Helpers */}
      <div className="space-y-4 pt-4 border-t">
        {/* ETA Suggestion */}
        {volume && volume > 0 && (
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Suggested Draft ETA: {formatDate(suggestDraftEta(volume).toISOString().split('T')[0])}
                </p>
                <p className="text-xs text-blue-700">
                  Based on ~10 returns/week (volume: {volume} returns)
                </p>
              </div>
              {onDraftEtaChange && (
                <button
                  type="button"
                  onClick={handleUseEtaSuggestion}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Use suggestion
                </button>
              )}
            </div>
          </div>
        )}

        {/* Draft ETA and Buffer Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Draft ETA Date
            </label>
            <input
              type="date"
              value={draftEtaDate || ''}
              onChange={(e) => onDraftEtaChange?.(e.target.value)}
              className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.draftEtaDate ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.draftEtaDate && (
              <p className="mt-1 text-xs text-red-600">{errors.draftEtaDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Review Buffer (business days)
            </label>
            <input
              type="number"
              min="0"
              max="30"
              value={bufferDays}
              onChange={(e) => onBufferDaysChange?.(parseInt(e.target.value) || 3)}
              className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.bufferDays ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.bufferDays && (
              <p className="mt-1 text-xs text-red-600">{errors.bufferDays}</p>
            )}
          </div>
        </div>

        {/* Buffer Validation Warning */}
        {bufferDate && (
          <div className="text-xs text-amber-700 bg-amber-50 rounded p-2">
            <strong>Note:</strong> Draft ETA + {bufferDays} business days = {formatDate(bufferDate.toISOString().split('T')[0])}
            {draftEtaDate && new Date(draftEtaDate) > bufferDate && (
              <span className="text-red-600 font-medium"> - This exceeds your deadline!</span>
            )}
          </div>
        )}

        {/* Liability Required Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={liabilityRequired}
            onChange={(e) => onLiabilityChange?.(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label className="text-sm text-gray-700">
            Professional liability coverage required
          </label>
        </div>
      </div>
    </section>
  );
}
