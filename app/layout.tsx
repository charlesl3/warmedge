import type { Metadata, Viewport } from 'next'
import { Inter, Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import ServiceWorkerRegister from './ServiceWorkerRegister'
import './globals.css'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'WarmEdge',
  description: 'AI-powered figure skating assistant.',
  manifest: '/manifest.json',
  icons: {
    apple: '/icon/icon-192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  themeColor: '#2F6BFF',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.className} antialiased`}>
        <ServiceWorkerRegister />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
