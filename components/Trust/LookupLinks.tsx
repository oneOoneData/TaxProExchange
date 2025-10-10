'use client';

import { motion } from 'framer-motion';

export default function LookupLinks() {
  const registries = [
    {
      name: 'CPA State Boards',
      description: 'Verify CPA licenses by state',
      url: 'https://nasba.org/licensure/substantially-equivalent/',
      icon: '🏛️',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    },
    {
      name: 'IRS Enrolled Agent Directory',
      description: 'Search for enrolled agents authorized by the IRS',
      url: 'https://www.irs.gov/tax-professionals/enrolled-agents/enrolled-agent-public-search',
      icon: '🇺🇸',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
    },
    {
      name: 'CTEC Registry',
      description: 'California Tax Education Council registered preparers',
      url: 'https://www.ctec.org/consumers/search-for-a-tax-preparer/',
      icon: '🌴',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
    },
    {
      name: 'State Bar Directories',
      description: 'Verify attorney licenses by state',
      url: 'https://www.americanbar.org/groups/legal_services/flh-home/flh-bar-directories-and-lawyer-finders/',
      icon: '⚖️',
      color: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-200">
      <h3 className="text-2xl font-semibold text-slate-900 mb-3">
        Official Registry Lookups
      </h3>
      <p className="text-slate-600 mb-6">
        We verify credentials against these official sources. You can independently check any professional&apos;s license:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {registries.map((registry, index) => (
          <motion.a
            key={registry.name}
            href={registry.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-start gap-4 p-5 rounded-xl border-2 transition-all ${registry.color}`}
          >
            <div className="text-3xl">{registry.icon}</div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 mb-1">
                {registry.name}
              </h4>
              <p className="text-sm text-slate-600">{registry.description}</p>
              <span className="text-xs text-slate-500 mt-1 inline-block">
                Click to visit registry →
              </span>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}

