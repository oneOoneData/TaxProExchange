'use client';

import { useState, useEffect } from 'react';

interface SlackStatus {
  canJoin: boolean;
  isMember: boolean;
  joinedAt: string | null;
  rateLimit: {
    allowed: boolean;
    attemptsToday: number;
    maxAttempts: number;
  };
}

interface SlackIntegrationProps {
  isVerified: boolean;
}

export default function SlackIntegration({ isVerified }: SlackIntegrationProps) {
  const [slackStatus, setSlackStatus] = useState<SlackStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Track if component is mounted to prevent state updates after unmount
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isVerified) {
      if (mounted) {
        setLoading(false);
      }
      return;
    }

    if (mounted) {
      fetchSlackStatus();
    }
  }, [isVerified, mounted]);

  const fetchSlackStatus = async () => {
    if (!mounted) return;
    
    try {
      const response = await fetch('/api/slack/join');
      const data = await response.json();

      if (!mounted) return; // Check again after async operation

      if (response.ok) {
        setSlackStatus(data);
      } else {
        setError(data.error || 'Failed to check Slack status');
      }
    } catch (err) {
      console.error('🔍 SlackIntegration: Error fetching Slack status:', err);
      if (mounted) {
        setError('Failed to check Slack status');
      }
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  };


  const handleBadgeClick = async () => {
    if (!mounted) return;
    
    try {
      if (!slackStatus?.isMember) {
        // Join Slack flow
        if (mounted) {
          setLoading(true);
          setError(null);
        }

        try {
          const response = await fetch('/api/slack/join', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to join Slack');
          }

          if (data.url) {
            // Track analytics event
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'slack_join_success', {
                event_category: 'engagement',
                event_label: 'slack_community'
              });
            }

            // Open Slack in new tab
            const newWindow = window.open(data.url, '_blank', 'noopener,noreferrer');
            if (!newWindow) {
              setError('Popup blocked. Please allow popups for this site.');
              return;
            }
            
            // Refresh status
            setTimeout(() => {
              fetchSlackStatus();
            }, 1000);
          }
        } catch (err) {
          console.error('Error joining Slack:', err);
          if (mounted) {
            setError(err instanceof Error ? err.message : 'Failed to join Slack');
          }
          
          // Track analytics event
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'slack_join_error', {
              event_category: 'engagement',
              event_label: 'slack_community'
            });
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      } else {
        // Open Slack workspace directly
        const workspaceId = process.env.NEXT_PUBLIC_SLACK_WORKSPACE_ID;
        if (workspaceId) {
          const newWindow = window.open(`https://app.slack.com/client/${workspaceId}`, '_blank', 'noopener,noreferrer');
          if (!newWindow && mounted) {
            setError('Popup blocked. Please allow popups for this site.');
          }
        } else if (mounted) {
          setError('Slack workspace not configured');
        }
      }
    } catch (error) {
      console.error('Unexpected error in handleBadgeClick:', error);
      if (mounted) {
        setError('An unexpected error occurred');
      }
    }
  };

  // Don't render anything if not verified or not mounted
  if (!isVerified || !mounted) {
    return null;
  }

  // Show loading state
  if (loading && !slackStatus) {
    return (
      <div className="flex justify-end">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            Join the TPE Slack Community. For verified members only.
          </span>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium bg-gray-400">
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">
          Join the TPE Slack Community. For verified members only.
        </span>
        
        {/* Error state */}
        {error && (
          <span className="text-sm text-red-600">
            {error}
          </span>
        )}
        
        {slackStatus && !slackStatus.isMember && slackStatus.canJoin ? (
          <button
            onClick={handleBadgeClick}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#4A154B' }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52-2.523c0-1.393 1.116-2.52 2.52-2.52h2.52v2.52a2.528 2.528 0 0 1-2.52 2.523zm0-6.75H2.522a2.528 2.528 0 0 1-2.52-2.52c0-1.393 1.116-2.52 2.52-2.52h2.52v2.52a2.528 2.528 0 0 1-2.52 2.52zm6.75 0v-2.52a2.528 2.528 0 0 1 2.523-2.52c1.393 0 2.52 1.127 2.52 2.52v2.52h-2.52a2.528 2.528 0 0 1-2.523 2.52zm0 6.75h2.52a2.528 2.528 0 0 1 2.523 2.52c0 1.393-1.127 2.52-2.52 2.52h-2.52v-2.52a2.528 2.528 0 0 1 2.523-2.52zm-6.75 0a2.528 2.528 0 0 1-2.52-2.523c0-1.393 1.116-2.52 2.52-2.52h2.52v2.52a2.528 2.528 0 0 1-2.52 2.523zm0-6.75H2.522a2.528 2.528 0 0 1-2.52-2.52c0-1.393 1.116-2.52 2.52-2.52h2.52v2.52a2.528 2.528 0 0 1-2.52 2.52z"/>
            </svg>
            {loading ? 'Connecting...' : 'Connect'}
          </button>
        ) : slackStatus?.isMember ? (
          <button
            onClick={handleBadgeClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#4A154B' }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52-2.523c0-1.393 1.116-2.52 2.52-2.52h2.52v2.52a2.528 2.528 0 0 1-2.52 2.523zm0-6.75H2.522a2.528 2.528 0 0 1-2.52-2.52c0-1.393 1.116-2.52 2.52-2.52h2.52v2.52a2.528 2.528 0 0 1-2.52 2.52zm6.75 0v-2.52a2.528 2.528 0 0 1 2.523-2.52c1.393 0 2.52 1.127 2.52 2.52v2.52h-2.52a2.528 2.528 0 0 1-2.523 2.52zm0 6.75h2.52a2.528 2.528 0 0 1 2.523 2.52c0 1.393-1.127 2.52-2.52 2.52h-2.52v-2.52a2.528 2.528 0 0 1 2.523-2.52zm-6.75 0a2.528 2.528 0 0 1-2.52-2.523c0-1.393 1.116-2.52 2.52-2.52h2.52v2.52a2.528 2.528 0 0 1-2.52 2.523zm0-6.75H2.522a2.528 2.528 0 0 1-2.52-2.52c0-1.393 1.116-2.52 2.52-2.52h2.52v2.52a2.528 2.528 0 0 1-2.52 2.52z"/>
            </svg>
            Open Slack
          </button>
        ) : null}
        
        {/* Rate limit warning */}
        {slackStatus && !slackStatus.rateLimit.allowed && (
          <span className="text-xs text-amber-600">
            Daily limit reached
          </span>
        )}
      </div>
    </div>
  );
}
