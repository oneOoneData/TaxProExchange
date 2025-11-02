'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface VoteButtonProps {
  toolId: string;
  initialVotes: number;
  initialVoted?: boolean;
  onVoteChange?: (voted: boolean, newVoteCount: number) => void;
}

export default function VoteButton({
  toolId,
  initialVotes,
  initialVoted = false,
  onVoteChange,
}: VoteButtonProps) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [voted, setVoted] = useState(initialVoted);
  const [votes, setVotes] = useState(initialVotes);
  const [loading, setLoading] = useState(false);

  const handleVote = async () => {
    if (!isSignedIn) {
      // Redirect to sign-in with return URL
      router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_id: toolId }),
      });

      if (!response.ok) {
        throw new Error('Failed to vote');
      }

      const data = await response.json();
      setVoted(data.voted);
      setVotes(data.votes);
      onVoteChange?.(data.voted, data.votes);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has voted on mount
  useEffect(() => {
    if (!isSignedIn) return;

    const checkVoteStatus = async () => {
      try {
        const response = await fetch(`/api/ai-votes/check?tool_id=${toolId}`);
        if (response.ok) {
          const data = await response.json();
          setVoted(data.voted || false);
        }
      } catch (error) {
        // Silently fail - user might not be signed in yet
        console.error('Error checking vote status:', error);
      }
    };

    checkVoteStatus();
  }, [toolId, isSignedIn]);

  // Poll for vote updates (every 30 seconds)
  useEffect(() => {
    if (!isSignedIn) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/ai-tools');
        if (response.ok) {
          const data = await response.json();
          const tool = data.tools.find((t: any) => t.id === toolId);
          if (tool) {
            setVotes(tool.votes);
          }
        }
      } catch (error) {
        console.error('Error polling votes:', error);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [toolId, isSignedIn]);

  return (
    <button
      onClick={handleVote}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
        voted
          ? 'bg-slate-700 text-white hover:bg-slate-600'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={!isSignedIn ? 'Sign in to vote' : voted ? 'Remove vote' : 'Vote'}
    >
      <svg
        className={`w-4 h-4 ${voted ? 'fill-current' : ''}`}
        fill={voted ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
        />
      </svg>
      <span className="text-sm font-medium">{votes}</span>
    </button>
  );
}

