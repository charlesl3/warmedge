import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import Image from 'next/image'
import Link from 'next/link'
import ServiceWorkerRegister from './ServiceWorkerRegister'
import Footer from './components/Footer'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'WarmEdge',
  description: 'Designed for the rink. Nothing more.',
  manifest: '/manifest.json',
  themeColor: '#2F6BFF',
  icons: {
    apple: '/icon/icon-192.png',
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
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="WarmEdge" />
      </head>

      <body className={`${inter.className} antialiased`}>

        <ServiceWorkerRegister />

        {/* Top Center Logo (Clickable → Home) */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <Link href="/">
            <Image
              src="/logo1.jpg"  // adjust if needed
              alt="WarmEdge"
              width={220}
              height={80}
              priority
              className="cursor-pointer"
            />
          </Link>
        </div>

        {/* Main Content */}
        <main className="min-h-screen pt-20">
          {children}
        </main>

        <Footer />
        <Analytics />

      </body>
    </html>
  )
}
