import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'WarmEdge',
  description: 'Designed for the rink. Nothing more.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>

        {/* Global navigation */}
        <Navbar />

        {/* Page content */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* Global footer */}
        <Footer />

        {/* Vercel Analytics (production-safe) */}
        <Analytics />

      </body>
    </html>
  )
}
