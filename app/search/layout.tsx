import type { Metadata } from 'next';
import { generateTitle, generateDescription, absoluteCanonical } from '@/lib/seo';

export const metadata: Metadata = {
  title: generateTitle('Search Verified Tax Professionals'),
  description: generateDescription('Filter by credential (CPA, EA, CTEC), state, specialization, and availability to find verified tax professionals.'),
  alternates: {
    canonical: absoluteCanonical('/search'),
  },
  openGraph: {
    title: generateTitle('Search Verified Tax Professionals'),
    description: generateDescription('Filter by credential (CPA, EA, CTEC), state, specialization, and availability to find verified tax professionals.'),
    url: absoluteCanonical('/search'),
    type: 'website',
  },
  twitter: {
    title: generateTitle('Search Verified Tax Professionals'),
    description: generateDescription('Filter by credential (CPA, EA, CTEC), state, specialization, and availability to find verified tax professionals.'),
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
