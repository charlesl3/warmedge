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
          className="flex items-center gap-[2px] hover:opacity-80 transition"
        >
 
          <Image
            src="/name2.jpg"
            alt="WarmEdge wordmark"
            width={200}
            height={200}
            priority
          />
        </Link>

        {/* Links */}
        <div className="flex gap-8 text-sm text-slate-600">
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
