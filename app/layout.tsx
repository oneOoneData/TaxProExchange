import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TaxProExchange - Find Verified Tax Professionals',
  description: 'A trusted directory for CPAs, EAs, and CTEC preparers to find each other for handoffs, overflow work, and representation. No payments or file exchange — just verified connections.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
