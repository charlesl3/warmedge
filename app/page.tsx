'use client'

import { useState } from 'react'
import Typewriter from './components/Typewriter'
import Link from 'next/link'

export default function Home() {
  const [showSubtitle, setShowSubtitle] = useState(false)

  return (
    <main className="min-h-screen flex items-center justify-center text-center px-6">
      <section className="flex flex-col items-center">

        {/* Hero */}
        <div className="flex flex-col items-center justify-start min-h-[10rem] md:min-h-[12rem]">
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-slate-800">
            <Typewriter
              text="WarmEdge AI"
              speed={100}
              onComplete={() => setShowSubtitle(true)}
            />
          </h1>

          <p className="mt-6 text-sm md:text-base font-light tracking-wide text-slate-600 max-w-xl">
            <Typewriter
              text="Intelligent figure skating assistant powered by WarmEdge"
              speed={60}
              start={showSubtitle}
            />
          </p>
        </div>

        {/* CTA */}
        <div className="mt-10">
          <Link
            href="/chat"
            className="px-8 py-3 text-sm md:text-base font-medium bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-colors duration-200"
          >
            Try WarmGPT
          </Link>
        </div>

      </section>
    </main>
  )
}
