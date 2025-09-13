'use client';

import { useEffect } from 'react';

interface DashboardDebugProps {
  userId: string;
  profile: any;
  onboardingComplete: boolean;
}

export function DashboardDebug({ userId, profile, onboardingComplete }: DashboardDebugProps) {
  useEffect(() => {
    console.log('🔍 Client-side Dashboard Debug Component:', {
      userId,
      profile: profile ? {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        onboarding_complete: profile.onboarding_complete,
        clerk_id: profile.clerk_id,
        clerk_user_id: profile.clerk_user_id
      } : null,
      onboardingComplete
    });
  }, [userId, profile, onboardingComplete]);

  return null; // This component doesn't render anything
}
