import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getCurrentProfile, isOnboardingComplete } from '@/lib/db/profile';
import { getRecentConnections, getRecentlyVerified } from '@/lib/db/activity';
import { getUserJobs, getRecentJobs, getUserProfileForMatching } from '@/lib/db/jobs';
import QuickActions from '@/components/dashboard/QuickActions';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import AvailabilityToggle from '@/components/dashboard/AvailabilityToggle';
import Opportunities from '@/components/dashboard/Opportunities';
import MessagesPreview from '@/components/dashboard/MessagesPreview';
import JobsPreview from '@/components/dashboard/JobsPreview';
import RecentJobsPreview from '@/components/dashboard/RecentJobsPreview';
import ProfileHealth from '@/components/dashboard/ProfileHealth';
import { DashboardDebug } from '@/components/debug/DashboardDebug';
import NblPromoBanner from '@/components/NblPromoBanner';
import DashboardTopEventCard from '@/components/DashboardTopEventCard';
import SlackIntegration from '@/components/dashboard/SlackIntegration';
import Link from 'next/link';

export default async function DashboardPage() {
  // Check authentication
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Fetch user data
  const [profile, connections, recentlyVerified, userJobs, recentJobs, userProfileForMatching] = await Promise.all([
    getCurrentProfile(),
    getCurrentProfile().then(profile => 
      profile ? getRecentConnections(profile.id) : []
    ),
    getRecentlyVerified(),
    userId ? getUserJobs(userId) : [],
    getRecentJobs(5),
    userId ? getUserProfileForMatching(userId) : null
  ]);
  
  // Note: connections and recentlyVerified are used by ActivityFeed component

  // Note: Messaging is handled via Stream.io, not DB
  const recentMessages: any[] = [];
  // Note: Verification is tracked via profile.visibility_state, not separate table
  const verificationRequest = null;

  const onboardingComplete = isOnboardingComplete(profile);
  
  // Debug logging - server-side only (this is a Server Component)
  console.log('🔍 Dashboard Debug:', {
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

  const canPostJobs = profile?.visibility_state === 'verified' && Boolean(profile?.firm_name);

  return (
    <div className="py-8">
      <NblPromoBanner />
      <DashboardDebug 
        userId={userId} 
        profile={profile} 
        onboardingComplete={onboardingComplete} 
      />
      <div className="container-mobile">
        {/* Clean Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
          <p className="mt-2 text-gray-600">
            Welcome back! Here's what's happening with your profile and connections.
          </p>
        </div>

            {/* Status and Availability */}
            <div className="flex items-center gap-4">
              {/* Status pill */}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                profile?.visibility_state === 'verified' ? 'bg-green-100 text-green-800' :
                profile?.visibility_state === 'pending_verification' ? 'bg-yellow-100 text-yellow-800' :
                profile?.visibility_state === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {profile?.visibility_state === 'verified' ? '✅ Verified' :
                 profile?.visibility_state === 'pending_verification' ? '⏳ Pending' :
                 profile?.visibility_state === 'rejected' ? '❌ Rejected' : '👤 Hidden'}
              </span>
              
              {/* Availability toggle */}
              <AvailabilityToggle profile={profile} />
            </div>
          </div>
        </div>

        {/* Slack Integration - only for verified users */}
        {profile?.visibility_state === 'verified' && (
          <div className="mb-8">
            <div className="container-mobile">
              <SlackIntegration isVerified={true} />
            </div>
          </div>
        )}

        {/* 2. Profile Health and Messages Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ProfileHealth profile={profile} />
          <MessagesPreview />
        </div>

        {/* 3. New Jobs and Events Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {userJobs.length > 0 ? (
            <JobsPreview jobs={userJobs} canPostJobs={canPostJobs} />
          ) : (
            <RecentJobsPreview jobs={recentJobs} userProfile={userProfileForMatching} />
          )}
          <DashboardTopEventCard />
        </div>

        {/* 4. Opportunities Section */}
        <div className="mb-8">
          <Opportunities profile={profile} />
        </div>

        {/* 5. Activity Section */}
        <div className="mt-8">
          <ActivityFeed 
            connections={connections} 
            recentlyVerified={recentlyVerified}
            currentProfileId={profile?.id || ''}
          />
        </div>
      </div>
    </div>
  );
}
