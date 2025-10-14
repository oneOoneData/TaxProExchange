'use client';

import dynamic from 'next/dynamic';

// Temporarily disable SSR for entire dashboard to isolate hydration issue
const DashboardLayoutClient = dynamic(() => import('./_DashboardLayoutClient'), { ssr: false });

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
