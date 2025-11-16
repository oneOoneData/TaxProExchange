'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface PartnerCardProps {
  partner: {
    id: string;
    name: string;
    slug: string;
    tagline: string;
    description: string;
    logo: string;
    website: string;
    category: string;
  };
}

export default function PartnerCard({ partner }: PartnerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Link
        href={`/partners/${partner.slug}`}
        className="block h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all"
      >
        {/* Logo */}
        {partner.slug === 'truss' ? (
          <div className="flex items-center justify-center h-20 mb-4 rounded-lg bg-white overflow-hidden">
            <Image
              src="https://rzbfkdicrhdharyzfmul.supabase.co/storage/v1/object/public/ai-tool-logos/truss.jpg"
              alt={`${partner.name} logo`}
              width={160}
              height={80}
              className="h-full w-auto object-contain"
            />
          </div>
        ) : partner.slug === 'taxgpt' ? (
          <div className="flex items-center justify-center h-20 mb-4 rounded-lg bg-white overflow-hidden">
            <Image
              src="https://rzbfkdicrhdharyzfmul.supabase.co/storage/v1/object/public/ai-tool-logos/taxgpt.jpg"
              alt={`${partner.name} logo`}
              width={160}
              height={80}
              className="h-full w-auto object-contain"
            />
          </div>
        ) : partner.slug === 'bluej' ? (
          <div className="flex items-center justify-center h-20 mb-4 rounded-lg bg-white overflow-hidden">
            <Image
              src="https://rzbfkdicrhdharyzfmul.supabase.co/storage/v1/object/public/ai-tool-logos/bluej.png"
              alt={`${partner.name} logo`}
              width={160}
              height={80}
              className="h-full w-auto object-contain"
            />
          </div>
        ) : partner.logo ? (
          <div className="flex items-center justify-center h-20 mb-4 rounded-lg bg-white overflow-hidden">
            <Image
              src={partner.logo}
              alt={`${partner.name} logo`}
              width={160}
              height={80}
              className="h-full w-auto object-contain"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-20 mb-4 rounded-lg bg-slate-50">
            <div className="text-2xl font-bold text-slate-400">
              {partner.name}
            </div>
          </div>
        )}

        {/* Category Badge */}
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium mb-3">
          {partner.category}
        </div>

        {/* Partner Name */}
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          {partner.name}
        </h3>

        {/* Tagline */}
        <p className="text-sm font-medium text-slate-700 mb-2">
          {partner.tagline}
        </p>

        {/* Description */}
        <p className="text-sm text-slate-600 line-clamp-3 mb-4">
          {partner.description}
        </p>

        {/* Learn More Link */}
        <div className="text-sm text-blue-600 font-medium group-hover:text-blue-700">
          Learn more →
        </div>
      </Link>
    </motion.div>
  );
}

