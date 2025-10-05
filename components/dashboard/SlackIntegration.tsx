'use client';

import { useState, useEffect } from 'react';

// Global type declaration for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

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

          if (data.workspaceId || data.url) {
            // Track analytics event
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'slack_join_success', {
                event_category: 'engagement',
                event_label: 'slack_community'
              });
            }

            // Generate the appropriate URL based on device type
            let slackUrl: string;
            if (data.workspaceId) {
              // New format: generate URL based on device
              const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                              window.innerWidth <= 768;
              
              if (isMobile) {
                // For mobile, use the Slack app deep link format
                slackUrl = `slack://workspace?id=${data.workspaceId}`;
              } else {
                // For desktop, use the web URL
                slackUrl = `https://app.slack.com/client/${data.workspaceId}`;
              }
            } else {
              // Fallback to legacy URL format
              slackUrl = data.url!;
            }

            // Open Slack
            const newWindow = window.open(slackUrl, '_blank', 'noopener,noreferrer');
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
          // Generate mobile-aware URL
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                          window.innerWidth <= 768;
          
          const slackUrl = isMobile 
            ? `slack://workspace?id=${workspaceId}`
            : `https://app.slack.com/client/${workspaceId}`;
          
          const newWindow = window.open(slackUrl, '_blank', 'noopener,noreferrer');
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
            <img 
              src="/Slack_icon_2019.svg" 
              alt="Slack" 
              className="w-5 h-5"
            />
            {loading ? 'Connecting...' : 'Connect'}
          </button>
        ) : slackStatus?.isMember ? (
          <button
            onClick={handleBadgeClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#4A154B' }}
          >
            <img 
              src="/Slack_icon_2019.svg" 
              alt="Slack" 
              className="w-5 h-5"
            />
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
