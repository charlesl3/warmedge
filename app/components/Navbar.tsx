'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef } from 'react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setOpen(true)
  }

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => {
      setOpen(false)
    }, 150) // 120–200ms 都可以
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="mx-auto max-w-7xl px-6 py-4 md:px-8 md:py-6 flex items-center justify-between">
        
        {/* Brand */}
        <Link href="/" className="flex items-center hover:opacity-80 transition">
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

          {/* Products hover dropdown */}
          <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href="/products"
              className="hover:text-slate-800 transition inline-flex items-center gap-1"
            >
              Products
              <span className="text-xs text-slate-400">▾</span>
            </Link>

            {/* Dropdown (always rendered, animated) */}
            <div
              className={`
                absolute left-0 mt-2 w-56
                bg-sky-300 border border-sky-200 shadow-sm
                transition-all duration-150 ease-out
                ${
                  open
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 -translate-y-1 scale-95 pointer-events-none'
                }
              `}
            >
              <ul className="flex flex-col text-slate-700">
                <li>
                  <Link
                    href="/products/photographing"
                    className="block px-4 py-2 hover:bg-sky-200 hover:text-slate-900 transition"
                  >
                    Rink Photographing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/products/warming"
                    className="block px-4 py-2 hover:bg-sky-200 hover:text-slate-900 transition"
                  >
                    Rink Warming
                  </Link>
                </li>
                <li>
                  <Link
                    href="/products/storage"
                    className="block px-4 py-2 hover:bg-sky-200 hover:text-slate-900 transition"
                  >
                    Rink Storage
                  </Link>
                </li>
                <li>
                  <Link
                    href="/products/fun"
                    className="block px-4 py-2 hover:bg-sky-200 hover:text-slate-900 transition"
                  >
                    Fun Accessories
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <Link href="/contact" className="hover:text-slate-800 transition">
            Contact
          </Link>
        </div>
      </nav>
    </header>
  )
}
