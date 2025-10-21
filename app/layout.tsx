import type { Metadata } from 'next';
import './globals.css';
import 'stream-chat-react/dist/css/v2/index.css';
import DomainAwareLayout from '@/components/DomainAwareLayout';
import { defaultTitle, defaultDescription } from '@/lib/seo';

// This layout will be replaced by DomainAwareLayout
// Keeping minimal metadata for Next.js

export const metadata: Metadata = {
  metadataBase: new URL('https://www.taxproexchange.com'),
  title: {
    default: 'TaxProExchange – Find Verified CPAs, EAs & Tax Pros',
    template: '%s | TaxProExchange',
  },
  description: 'Verified directory of CPAs, EAs, and tax professionals. Find trusted experts by credential, specialty, and state.',
  keywords: 'tax professionals, CPA, EA, CTEC, tax preparation, collaboration, verified, directory, referrals, overflow work, IRS representation',
  authors: [{ name: 'TaxProExchange' }],
  creator: 'TaxProExchange',
  publisher: 'TaxProExchange',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  // Add Google Search Console verification when you get the code
  // verification: {
  //   google: 'YOUR_VERIFICATION_CODE_HERE',
  // },
  openGraph: {
    siteName: 'TaxProExchange',
    type: 'website',
    url: 'https://www.taxproexchange.com',
    title: 'Find Verified CPAs, EAs & Tax Pros',
    description: 'Build your trusted bench. Filter by credential, specialty, and state.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TaxProExchange - Verified Tax Professionals Directory',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaxProExchange – Verified Tax Professionals',
    description: 'Find CPAs, EAs, and tax pros you can trust for handoffs and overflow.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DomainAwareLayout>{children}</DomainAwareLayout>;
}
