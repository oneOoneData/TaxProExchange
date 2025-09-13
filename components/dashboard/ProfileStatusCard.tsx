import Link from 'next/link';
import { Profile, VerificationRequest, getProfileDisplayName, getCredentialBadgeColor, getVisibilityBadgeColor, getPublicProfileUrl } from '@/lib/db/profile';

interface ProfileStatusCardProps {
  profile: Profile | null;
  verificationRequest: VerificationRequest | null;
}

export default function ProfileStatusCard({ profile, verificationRequest }: ProfileStatusCardProps) {
  if (!profile) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const displayName = getProfileDisplayName(profile);
  const publicUrl = getPublicProfileUrl(profile.slug);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {displayName}
          </h2>
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCredentialBadgeColor(profile.credential_type)}`}>
              {profile.credential_type}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVisibilityBadgeColor(profile.visibility_state)}`}>
              {profile.visibility_state === 'verified' ? 'Verified' : 
               profile.visibility_state === 'pending_verification' ? 'Pending verification' : 
               profile.visibility_state === 'rejected' ? 'Rejected' : 'Hidden'}
            </span>
          </div>
        </div>
        {profile.avatar_url && (
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="w-12 h-12 rounded-full object-cover"
          />
        )}
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Work availability:</span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            profile.accepting_work ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {profile.accepting_work ? 'Accepting work' : 'Not accepting work'}
          </span>
        </div>

        {profile.firm_name && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Firm:</span>
            <span className="text-sm font-medium text-gray-900">{profile.firm_name}</span>
          </div>
        )}

        {profile.headline && (
          <div className="text-sm text-gray-600">
            {profile.headline}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link
          href="/profile/edit"
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors text-center"
        >
          Edit Profile
        </Link>
        {profile.slug && (
          <Link
            href={publicUrl}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-center"
          >
            View Public Profile
          </Link>
        )}
      </div>

      {!profile.slug && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Complete your profile to get a public listing and start connecting with other tax professionals.
          </p>
        </div>
      )}
    </div>
  );
}
