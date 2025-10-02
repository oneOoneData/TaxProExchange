import Link from 'next/link';
import { Profile } from '@/lib/db/profile';
import Card from '@/components/ui/Card';

interface OnboardingChecklistProps {
  profile: Profile | null;
}

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  href: string;
  description?: string;
}

export default function OnboardingChecklist({ profile }: OnboardingChecklistProps) {
  if (!profile) {
    return (
      <Card title="Complete Your Profile" description="Finish setting up to get started">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  const checklistItems: ChecklistItem[] = [
    {
      id: 'headline',
      label: 'Add professional headline',
      completed: Boolean(profile.headline && profile.headline.length > 10),
      href: '/profile/edit#headline',
      description: 'Describe your expertise in one line'
    },
    {
      id: 'bio',
      label: 'Write detailed bio',
      completed: Boolean(profile.bio && profile.bio.length >= 120),
      href: '/profile/edit#bio',
      description: 'Tell your story (120+ characters)'
    },
    {
      id: 'contact',
      label: 'Add contact information',
      completed: Boolean(profile.phone || profile.public_email),
      href: '/profile/edit#contact',
      description: 'Phone or email for connections'
    },
    {
      id: 'firm',
      label: 'Add firm information',
      completed: Boolean(profile.firm_name),
      href: '/profile/edit#firm',
      description: 'Your company or practice name'
    },
    {
      id: 'specialties',
      label: 'Add specialties',
      completed: false, // TODO: Get from profile_specializations
      href: '/profile/edit#specialties',
      description: 'Show your areas of expertise'
    },
    {
      id: 'states',
      label: 'Add service states',
      completed: false, // TODO: Get from profile_locations
      href: '/profile/edit#locations',
      description: 'Where you can provide services'
    },
    {
      id: 'license',
      label: 'Verify license',
      completed: profile.visibility_state === 'verified',
      href: '/profile/edit#verification',
      description: 'Build trust with verification'
    },
    {
      id: 'connections',
      label: 'Connect with peers',
      completed: false, // TODO: Get from connections count
      href: '/search',
      description: 'Build your professional network'
    }
  ];

  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  const incompleteItems = checklistItems.filter(item => !item.completed);

  return (
    <Card 
      title="Complete Your Profile" 
      description={`${completionPercentage}% complete - ${completedCount}/${totalCount} items done`}
    >
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-3">
        {incompleteItems.slice(0, 4).map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            </div>
            <div className="flex-1">
              <Link 
                href={item.href}
                className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
              >
                {item.label}
              </Link>
              {item.description && (
                <p className="text-xs text-gray-500">{item.description}</p>
              )}
            </div>
            <Link
              href={item.href}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Complete
            </Link>
          </div>
        ))}
      </div>

      {/* Show completed items if any */}
      {completedCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">
            Completed ({completedCount}):
          </div>
          <div className="space-y-2">
            {checklistItems.filter(item => item.completed).slice(0, 2).map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
            ))}
            {completedCount > 2 && (
              <div className="text-xs text-gray-500">
                +{completedCount - 2} more completed
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {completedCount === totalCount && (
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h4 className="font-medium text-gray-900 mb-1">Profile Complete!</h4>
          <p className="text-sm text-gray-600">Your profile is fully set up and ready to go.</p>
        </div>
      )}
    </Card>
  );
}
