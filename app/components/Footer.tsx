import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-32 bg-gradient-to-b from-sky-100 to-sky-200">
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-12 text-sm">

        {/* Brand */}
        <div>
          <div className="font-medium text-slate-800 mb-3">
            WarmEdge
          </div>
          <p className="text-slate-600">
            Where engineering and skating meet.
          </p>
        </div>

        {/* Navigate */}
        <div>
          <div className="font-medium text-slate-800 mb-3">
            Navigate
          </div>
          <ul className="space-y-2">
            <li>
              <Link
                href="/products"
                className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4 transition-colors duration-200"
              >
                Products
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4 transition-colors duration-200"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4 transition-colors duration-200"
              >
                Contact
              </Link>
            </li>
            <li>
              <Link
                href="/return-policy"
                className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4 transition-colors duration-200"
              >
                Return Policy
              </Link>
            </li>
            <li>
              <Link
                href="/shipping-policy"
                className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4 transition-colors duration-200"
              >
                Shipping Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* Connect */}
        <div>
          <div className="font-medium text-slate-800 mb-3">
            Connect
          </div>

          <p className="text-slate-600 mb-2">
            Email:&nbsp;
            <a
              href="mailto:charlesatlife@gmail.com"
              className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4 transition-colors duration-200"
            >
              charlesatlife@gmail.com
            </a>
          </p>

          <p className="text-slate-600 mb-2">
            Phone:&nbsp;
            <a
              href="tel:+12173051473"
              className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4 transition-colors duration-200"
            >
              +1 (217) 305-1473
            </a>
          </p>

          <p className="text-slate-600">
            Instagram:&nbsp;
            <a
              href="https://www.instagram.com/charles_llliu/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4 transition-colors duration-200"
            >
              @charles_llliu
            </a>
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-300/40">
        <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-slate-500 text-center">
          © {new Date().getFullYear()} WarmEdge. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
