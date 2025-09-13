import Link from 'next/link';

interface QuickActionsProps {
  canPostJobs?: boolean;
}

export default function QuickActions({ canPostJobs = false }: QuickActionsProps) {
  const actions = [
    {
      title: 'Search Directory',
      description: 'Find other tax professionals',
      href: '/search',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Post a Job',
      description: canPostJobs ? 'Create a new job posting' : 'Get verified to post jobs',
      href: canPostJobs ? '/jobs/new' : '/jobs',
      disabled: !canPostJobs,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      color: canPostJobs ? 'bg-slate-600 hover:bg-slate-700' : 'bg-gray-400 cursor-not-allowed',
    },
    {
      title: 'Refer a Pro',
      description: 'Invite colleagues to join',
      href: '/refer',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      color: 'bg-indigo-600 hover:bg-indigo-700',
    },
    {
      title: 'Update Availability',
      description: 'Manage your work status',
      href: '/profile/edit#availability',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-gray-600 hover:bg-gray-700',
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className={`group relative overflow-hidden rounded-xl p-4 text-white transition-all duration-200 ${
              action.disabled ? 'cursor-not-allowed opacity-60' : 'hover:scale-105 hover:shadow-lg'
            } ${action.color}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate">
                  {action.title}
                </h3>
                <p className="text-xs opacity-90 truncate">
                  {action.description}
                </p>
              </div>
            </div>
            
            {action.disabled && (
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                <span className="text-xs font-medium">Verification Required</span>
              </div>
            )}
          </Link>
        ))}
      </div>

      {!canPostJobs && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Want to post jobs?</strong> Get verified as a firm to create job postings and find qualified tax professionals for your projects.
          </p>
        </div>
      )}
    </div>
  );
}
