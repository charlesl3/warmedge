'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'py-3 bg-white/80 backdrop-blur-md shadow-sm' : 'py-6'
      }`}
    >
      <nav className="mx-auto max-w-7xl px-6 md:px-8 flex items-center justify-between">

        {/* Brand */}
        <Link href="/" className="flex items-center hover:opacity-80 transition">
          <Image
            src="/logo1.jpg"
            alt="WarmEdge wordmark"
            width={scrolled ? 120 : 240}
            height={scrolled ? 30 : 42}
            priority
            className="transition-all duration-300 origin-left"
          />
        </Link>

        {/* Links */}
        <div
          className={`flex gap-8 text-slate-600 transition-all duration-300 ${
            scrolled ? 'text-sm' : 'text-lg'
          }`}
        >
          <Link href="/about" className="hover:text-slate-800 transition">
            About
          </Link>

          <Link href="/chat" className="hover:text-slate-800 transition">
            WarmGPT
          </Link>

          <Link href="/contact" className="hover:text-slate-800 transition">
            Contact
          </Link>
        </div>
      </nav>
    </header>
  )
}
