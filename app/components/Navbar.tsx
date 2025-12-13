'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="mx-auto max-w-7xl px-6 py-4 md:px-8 md:py-6 flex items-center justify-between">
        
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center hover:opacity-80 transition"
        >
          <Image
  src="/name2.jpg"
  alt="WarmEdge wordmark"
  width={140}
  height={32}
  priority
  className="
    block relative -top-[1px]
    md:scale-110
    lg:scale-125
    origin-left
  "
/>

        </Link>

        {/* Links */}
        <div className="flex gap-6 text-sm text-slate-600">
          <Link href="/about" className="hover:text-slate-800 transition">
            About
          </Link>
          <Link href="/products" className="hover:text-slate-800 transition">
            Products
          </Link>
          <Link href="/contact" className="hover:text-slate-800 transition">
            Contact
          </Link>
        </div>

      </nav>
    </header>
  )
}
