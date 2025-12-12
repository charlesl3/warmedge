'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="mx-auto max-w-7xl px-8 py-6 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-medium tracking-tight text-slate-700 hover:opacity-80 transition"
        >
          <Image
            src="/globe.svg"
            alt="WarmEdge logo"
            width={20}
            height={20}
            priority
          />
          <span>WarmEdge</span>
        </Link>

        {/* Links */}
        <div className="flex gap-8 text-sm text-slate-600">
          <Link href="/products" className="hover:text-slate-800 transition">
            Products
          </Link>
          <Link href="/about" className="hover:text-slate-800 transition">
            About
          </Link>
          <Link href="/contact" className="hover:text-slate-800 transition">
            Contact
          </Link>
        </div>
      </nav>
    </header>
  )
}
