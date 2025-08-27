import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SessionProvider } from 'next-auth/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TaxProExchange - Where Tax Professionals Connect and Collaborate',
  description: 'A trusted directory for CPAs, EAs, and CTEC preparers to find each other for handoffs, overflow work, and representation. No payments or file exchange — just verified connections.',
  keywords: 'tax professionals, CPA, EA, CTEC, tax preparers, tax collaboration, verified professionals',
  authors: [{ name: 'TaxProExchange' }],
  creator: 'TaxProExchange',
  publisher: 'TaxProExchange',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://taxproexchange.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'TaxProExchange - Where Tax Professionals Connect and Collaborate',
    description: 'A trusted directory for CPAs, EAs, and CTEC preparers to find each other for handoffs, overflow work, and representation.',
    url: 'https://taxproexchange.com',
    siteName: 'TaxProExchange',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TaxProExchange - Tax Professional Directory',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaxProExchange - Where Tax Professionals Connect and Collaborate',
    description: 'A trusted directory for CPAs, EAs, and CTEC preparers to find each other for handoffs, overflow work, and representation.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
    other: [
      { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' },
      { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png" />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
