import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';

// Check if we're in build mode (no Clerk environment variables)
const isBuildTime = typeof process !== 'undefined' && !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TaxProExchange - Where Tax Professionals Connect and Collaborate',
  description: 'A trusted directory for CPAs, EAs, and CTEC preparers to find each other for handoffs, overflow work, and representation.',
  keywords: 'tax professionals, CPA, EA, CTEC, tax preparation, collaboration',
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
    title: 'TaxProExchange - Where Tax Professionals Connect and Collaborate',
    description: 'A trusted directory for CPAs, EAs, and CTEC preparers to find each other for handoffs, overflow work, and representation.',
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
      <body className={inter.className}>
        {isBuildTime ? children : (
          <ClerkProvider
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl="/onboarding"
            afterSignUpUrl="/onboarding"
          >
            {children}
          </ClerkProvider>
        )}
      </body>
    </html>
  );
}
