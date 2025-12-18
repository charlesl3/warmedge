'use client'

import { useState } from 'react'
import Typewriter from './components/Typewriter'
import Link from 'next/link'

export default function Home() {
  const [showSubtitle, setShowSubtitle] = useState(false)

  return (
    <main className="min-h-screen flex items-center justify-center text-center px-6">
      <section className="relative">
        {/* Directory bar (position never shifts) */}
        <nav className="mb-8 text-sm md:text-base font-light tracking-wide text-slate-500">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <DirectoryLink href="/products/photographing">
              Photographing
            </DirectoryLink>
            <span className="opacity-40">｜</span>
            <DirectoryLink href="/products/warming">
              Toe Warming 
            </DirectoryLink>
            <span className="opacity-40">｜</span>
            <DirectoryLink href="/products/storage">
              Rink Storage
            </DirectoryLink>
            <span className="opacity-40">｜</span>
            <DirectoryLink href="/products/essentials">
              Skating Essentials
            </DirectoryLink>
          </div>
        </nav>

        {/* Hero text container with fixed height */}
        <div className="flex flex-col items-center justify-start min-h-[8.5rem] md:min-h-[10.5rem]">
          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-slate-800">
            <Typewriter
              text="Built for the ice"
              speed={100}
              onComplete={() => setShowSubtitle(true)}
            />
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-sm md:text-base font-light tracking-wide text-slate-600">
            <Typewriter
              text="Thoughtful tools for skaters"
              speed={80}
              start={showSubtitle}
            />
          </p>
        </div>
      </section>
    </main>
  )
}

function DirectoryLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="hover:text-slate-700 transition-colors duration-200"
    >
      {children}
    </Link>
  )
}
