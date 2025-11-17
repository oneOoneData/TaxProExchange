import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import 'stream-chat-react/dist/css/v2/index.css';
import DomainAwareLayout from '@/components/DomainAwareLayout';
import JsonLd from '@/components/seo/JsonLd';
import { getOrganizationJsonLd, getWebsiteJsonLd } from '@/lib/seo';

const inter = Inter({ subsets: ['latin'] });

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
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={inter.className}>
        {/* JSON-LD Structured Data */}
        <JsonLd data={getOrganizationJsonLd()} />
        <JsonLd data={getWebsiteJsonLd()} />
        {/* Google reCAPTCHA v3 */}
        {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
          <Script
            src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
            strategy="lazyOnload"
          />
        )}
        
        <DomainAwareLayout>
          {children}
        </DomainAwareLayout>
        
        {/* Keak tracking pixel for A/B testing and conversion tracking */}
        <Script
          id="keak-script"
          src="https://zzontar2hsjaawcn.public.blob.vercel-storage.com/scripts/domain-495-httpstaxproexchange.com.js"
          data-domain="495"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
