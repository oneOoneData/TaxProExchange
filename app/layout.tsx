import type { Metadata } from 'next';
import './globals.css';
import 'stream-chat-react/dist/css/v2/index.css';
import DomainAwareLayout from '@/components/DomainAwareLayout';
import { defaultTitle, defaultDescription, generateOrganizationJsonLd, generateWebSiteJsonLd } from '@/lib/seo';

// This layout will be replaced by DomainAwareLayout
// Keeping minimal metadata for Next.js

export const metadata: Metadata = {
  title: defaultTitle,
  description: defaultDescription,
  keywords: 'tax professionals, CPA, EA, CTEC, tax preparation, collaboration, verified, directory, referrals, overflow work, IRS representation',
  authors: [{ name: 'TaxProExchange' }],
  creator: 'TaxProExchange',
  publisher: 'TaxProExchange',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://www.taxproexchange.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    url: 'https://www.taxproexchange.com',
    siteName: 'TaxProExchange',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TaxProExchange - Tax Professionals Directory',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
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
  return (
    <DomainAwareLayout>{children}</DomainAwareLayout>
  );
}
