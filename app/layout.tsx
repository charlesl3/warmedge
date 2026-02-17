import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import ServiceWorkerRegister from './ServiceWorkerRegister'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'WarmEdge',
  description: 'AI-powered figure skating assistant.',
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
        {/* 🔒 LOCK VIEWPORT */}
        <meta
          name="viewport"
          content="
            width=device-width,
            initial-scale=1,
            maximum-scale=1,
            user-scalable=no,
            viewport-fit=cover
          "
        />

        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="WarmEdge" />
      </head>

      <body className={`${inter.className} antialiased`}>
        <ServiceWorkerRegister />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
