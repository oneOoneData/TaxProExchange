'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface ScoreBreakdown {
  signal: string;
  points: number;
}

interface SuggestedMatch {
  profile_id: string;
  first_name: string;
  last_name: string;
  headline?: string;
  credential_type: string;
  slug: string;
  avatar_url?: string;
  firm_name?: string;
  primary_location?: any;
  specializations?: string[];
  match_score: number;
  score_breakdown: ScoreBreakdown[];
}

interface SuggestedMatchesProps {
  isFirmAdmin?: boolean;
  profileId?: string;
}

export default function SuggestedMatches({ isFirmAdmin = false, profileId }: SuggestedMatchesProps) {
  const [matches, setMatches] = useState<SuggestedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/matching/suggestions');
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || []);
        setCreditsRemaining(data.credits_remaining);
      }
    } catch (e) {
      console.error('Failed to fetch matches:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (suggestedProfileId: string) => {
    if (connecting) return;
    setConnecting(true);
    setSelectedProfile(suggestedProfileId);

    try {
      const res = await fetch('/api/matching/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggested_profile_id: suggestedProfileId }),
      });

      if (res.ok) {
        const data = await res.json();
        setCreditsRemaining(data.credits_remaining);
        // Remove connected match from suggestions
        setMatches(prev => prev.filter(m => m.profile_id !== suggestedProfileId));
      } else if (res.status === 402) {
        // Payment required — out of credits
        setCreditsRemaining(0);
      }
    } catch (e) {
      console.error('Failed to connect:', e);
    } finally {
      setConnecting(false);
      setSelectedProfile(null);
    }
  };

  const signalLabels: Record<string, string> = {
    same_city: 'Same city',
    same_state: 'Same state',
    remote_ok: 'Remote OK',
    complementary_skill: 'Complementary skills',
    niche_scarcity: 'Niche expertise',
    same_experience_level: 'Similar experience',
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-slate-200 rounded w-1/3"></div>
          <div className="h-20 bg-slate-100 rounded"></div>
          <div className="h-20 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (matches.length === 0 && creditsRemaining === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Suggested Matches</h2>
          <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
            0 credits left
          </span>
        </div>
        <div className="text-center py-6">
          <p className="text-slate-600 mb-4">You've used all your connection credits.</p>
          {!isFirmAdmin && (
            <Link
              href="/for-firms"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Upgrade to Firm Account — Unlimited Matches
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          )}
          {isFirmAdmin && (
            <p className="text-sm text-slate-500">As a firm, you have unlimited connections.</p>
          )}
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return null; // Don't show if no matches and still have credits
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Suggested Matches</h2>
        {!isFirmAdmin && creditsRemaining !== null && (
          <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${
            (creditsRemaining || 0) <= 2 
              ? 'text-amber-600 bg-amber-50' 
              : 'text-emerald-600 bg-emerald-50'
          }`}>
            {creditsRemaining} / 6 credits left
          </span>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {matches.map((match) => (
            <motion.div
              key={match.profile_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {match.avatar_url ? (
                  <img src={match.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-blue-700 font-semibold text-sm">
                    {match.first_name[0]}{match.last_name[0]}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link href={`/directory/${match.slug}`} className="hover:underline">
                  <p className="text-sm font-semibold text-slate-900">
                    {match.first_name} {match.last_name}
                    {match.firm_name && (
                      <span className="text-xs text-slate-500 font-normal ml-1">
                        · {match.firm_name}
                      </span>
                    )}
                  </p>
                </Link>
                {match.headline && (
                  <p className="text-xs text-slate-500 truncate">{match.headline}</p>
                )}
                <p className="text-xs text-slate-400 mt-0.5">
                  {match.credential_type}
                  {match.primary_location?.city && ` · ${match.primary_location.city}`}
                </p>
                
                {/* Score breakdown */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {match.score_breakdown.map((sb) => (
                    <span
                      key={sb.signal}
                      className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium"
                    >
                      +{sb.points} {signalLabels[sb.signal] || sb.signal}
                    </span>
                  ))}
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                    {match.match_score}% match
                  </span>
                </div>
              </div>

              {/* Connect button */}
              <button
                onClick={() => handleConnect(match.profile_id)}
                disabled={connecting || !isFirmAdmin && (creditsRemaining || 0) <= 0}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  isFirmAdmin
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : (creditsRemaining || 0) > 0
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {connecting && selectedProfile === match.profile_id ? (
                  <span className="flex items-center gap-1">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  'Connect'
                )}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Upgrade prompt if out of credits */}
      {!isFirmAdmin && (creditsRemaining || 0) <= 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <Link
            href="/for-firms"
            className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">Want more matches?</p>
              <p className="text-xs text-slate-500">Build your bench — upgrade to a firm account</p>
            </div>
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
