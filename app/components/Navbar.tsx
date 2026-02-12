'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-md shadow-sm py-4'
          : 'bg-transparent py-6'
      }`}
    >
      <nav className="mx-auto max-w-7xl px-6 md:px-8 flex items-center justify-between">

        {/* Brand */}
        <Link href="/" className="flex items-center hover:opacity-80 transition">
          <Image
            src="/logo1.jpg"
            alt="WarmEdge"
            width={scrolled ? 130 : 160}
            height={40}
            priority
            className="transition-all duration-300"
          />
        </Link>

        {/* Links */}
        <div className="flex gap-10 text-base font-medium text-slate-700">
          

          <Link
            href="/chat"
            className="hover:text-slate-900 transition"
          >
            WarmGPT
          </Link>

          <Link
            href="/about"
            className="hover:text-slate-900 transition"
          >
            About
          </Link>

        </div>
      </nav>
    </header>
  )
}
