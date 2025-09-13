import Link from 'next/link';
import { VerificationRequest } from '@/lib/db/profile';

interface VerificationCardProps {
  verificationRequest: VerificationRequest | null;
  isOnboardingComplete: boolean;
  visibilityState?: 'hidden' | 'pending_verification' | 'verified' | 'rejected';
}

export default function VerificationCard({ verificationRequest, isOnboardingComplete, visibilityState }: VerificationCardProps) {
  const getStatusInfo = () => {
    // If already verified based on visibility_state, show verified status
    if (visibilityState === 'verified') {
      return {
        status: 'approved',
        title: 'Verification approved',
        description: 'Congratulations! Your profile is now verified and visible in the directory.',
        actionText: 'View Profile',
        actionHref: '/profile/edit',
        color: 'bg-blue-50 border-blue-200',
        iconColor: 'text-blue-600',
      };
    }

    if (!verificationRequest) {
      if (!isOnboardingComplete) {
        return {
          status: 'incomplete',
          title: 'Complete your profile first',
          description: 'Finish setting up your profile before submitting for verification.',
          actionText: 'Complete Profile',
          actionHref: '/profile/edit',
          color: 'bg-amber-50 border-amber-200',
          iconColor: 'text-amber-600',
        };
      }
      return {
        status: 'not_submitted',
        title: 'Submit for verification',
        description: 'Get verified to build trust and increase your visibility in the directory.',
        actionText: 'Submit for Verification',
        actionHref: '/profile/verify',
        color: 'bg-slate-50 border-slate-200',
        iconColor: 'text-slate-600',
      };
    }

    switch (verificationRequest.status) {
      case 'pending':
        return {
          status: 'pending',
          title: 'Verification pending',
          description: `We're reviewing your documents. Submitted on ${new Date(verificationRequest.submitted_at).toLocaleDateString()}.`,
          actionText: 'View Status',
          actionHref: '/profile/verify',
          color: 'bg-amber-50 border-amber-200',
          iconColor: 'text-amber-600',
        };
      case 'approved':
        return {
          status: 'approved',
          title: 'Verification approved',
          description: 'Congratulations! Your profile is now verified and visible in the directory.',
          actionText: 'View Profile',
          actionHref: '/profile/edit',
          color: 'bg-blue-50 border-blue-200',
          iconColor: 'text-blue-600',
        };
      case 'rejected':
        return {
          status: 'rejected',
          title: 'Verification needs attention',
          description: verificationRequest.notes || 'Your verification was not approved. Please review and resubmit.',
          actionText: 'Fix and Resubmit',
          actionHref: '/profile/verify',
          color: 'bg-red-50 border-red-200',
          iconColor: 'text-red-600',
        };
      default:
        return {
          status: 'unknown',
          title: 'Verification status unknown',
          description: 'Please contact support if you have questions about your verification status.',
          actionText: 'Contact Support',
          actionHref: '/feedback',
          color: 'bg-gray-50 border-gray-200',
          iconColor: 'text-gray-600',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`rounded-2xl shadow-sm border p-6 ${statusInfo.color}`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${statusInfo.iconColor}`}>
          {statusInfo.status === 'pending' && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          )}
          {statusInfo.status === 'approved' && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          {statusInfo.status === 'rejected' && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          {(statusInfo.status === 'not_submitted' || statusInfo.status === 'incomplete') && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {statusInfo.title}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {statusInfo.description}
          </p>
          
          <Link
            href={statusInfo.actionHref}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusInfo.status === 'approved' 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : statusInfo.status === 'rejected'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {statusInfo.actionText}
          </Link>
        </div>
      </div>
    </div>
  );
}
