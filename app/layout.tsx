import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TaxProExchange - Find Verified Tax Professionals',
  description: 'A trusted directory for CPAs, EAs, and CTEC preparers to find each other for handoffs, overflow work, and representation. No payments or file exchange — just verified connections.',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'TaxProExchange - Find Verified Tax Professionals',
    description: 'A trusted directory for CPAs, EAs, and CTEC preparers to find each other for handoffs, overflow work, and representation.',
    url: 'https://taxproexchange.com',
    siteName: 'TaxProExchange',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TaxProExchange - Made for Tax Pros, by Tax Pros',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaxProExchange - Find Verified Tax Professionals',
    description: 'A trusted directory for CPAs, EAs, and CTEC preparers to find each other for handoffs, overflow work, and representation.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
