'use client'

import { useState } from 'react'
import Typewriter from './components/Typewriter'

export default function Home() {
  const [showSubtitle, setShowSubtitle] = useState(false)

  return (
    <main className="min-h-screen flex items-center justify-center text-center px-6">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-sky-50 to-blue-100" />

      {/* Content */}
      <section className="relative">
        <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-slate-700">
          <Typewriter
            text="Designed for the rink"
            speed={200}
            onComplete={() => setShowSubtitle(true)}
          />
        </h1>

        <p className="mt-6 text-lg font-light text-slate-500">
          <Typewriter
            text="Nothing more..."
            speed={300}
            start={showSubtitle}
          />
        </p>
      </section>
    </main>
  )
}
