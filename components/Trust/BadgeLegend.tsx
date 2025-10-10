'use client';

import { motion } from 'framer-motion';

export default function BadgeLegend() {
  const badges = [
    {
      name: '✓ Verified',
      color: 'bg-green-100 text-green-800 border-green-300',
      description: 'License verified against official state or IRS registries',
    },
    {
      name: '🎓 CPA',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      description: 'Certified Public Accountant - State Board verified',
    },
    {
      name: '📋 EA',
      color: 'bg-purple-100 text-purple-800 border-purple-300',
      description: 'IRS Enrolled Agent - verified via IRS public directory',
    },
    {
      name: '📊 CTEC',
      color: 'bg-orange-100 text-orange-800 border-orange-300',
      description: 'California Tax Education Council - verified via CTEC registry',
    },
    {
      name: '⚖️ Attorney',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      description: 'Licensed attorney with tax practice - State Bar verified',
    },
    {
      name: '🔍 Pending',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      description: 'Verification in progress - not yet publicly listed',
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-200">
      <h3 className="text-2xl font-semibold text-slate-900 mb-6">
        Badge Legend
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <span
              className={`px-3 py-1 rounded-lg text-sm font-semibold border whitespace-nowrap ${badge.color}`}
            >
              {badge.name}
            </span>
            <p className="text-sm text-slate-600 leading-relaxed">
              {badge.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

