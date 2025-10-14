'use client';

import dynamic from 'next/dynamic';

// Temporarily disable SSR for entire firm layout to isolate hydration issue
const FirmLayoutClient = dynamic(() => import('./_FirmLayoutClient'), { ssr: false });

export default function FirmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FirmLayoutClient>{children}</FirmLayoutClient>;
}

