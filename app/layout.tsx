import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
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
      <body className={montserrat.className}>
        <Navbar />

        <main className="min-h-screen">
          {children}
        </main>

        <Footer />

        <Analytics />
      </body>
    </html>
  )
}
