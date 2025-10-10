'use client';

import { motion } from 'framer-motion';

export default function BuiltWith() {
  const technologies = [
    {
      name: 'Clerk',
      description: 'Authentication & User Management',
      icon: '🔐',
      url: 'https://clerk.com',
    },
    {
      name: 'Supabase',
      description: 'PostgreSQL Database with RLS',
      icon: '🛡️',
      url: 'https://supabase.com',
    },
    {
      name: 'Vercel',
      description: 'Hosting & HTTPS',
      icon: '🔒',
      url: 'https://vercel.com',
    },
  ];

  return (
    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 text-center">
        Built With
      </h3>
      <div className="flex flex-wrap items-center justify-center gap-6">
        {technologies.map((tech, index) => (
          <motion.a
            key={tech.name}
            href={tech.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white hover:bg-slate-50 transition-all border border-slate-200 hover:border-slate-300 group"
          >
            <div className="text-2xl">{tech.icon}</div>
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-900 group-hover:text-slate-700">
                {tech.name}
              </div>
              <div className="text-xs text-slate-500 max-w-[120px]">
                {tech.description}
              </div>
            </div>
          </motion.a>
        ))}
      </div>
      <p className="text-xs text-slate-500 text-center mt-4">
        Enterprise-grade security and reliability
      </p>
    </div>
  );
}



