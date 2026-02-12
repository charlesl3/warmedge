import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-40 border-t border-sky-300/40 bg-sky-200">
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-20 grid grid-cols-1 md:grid-cols-3 gap-16 text-[15px]">

        {/* Brand */}
        <div>
          <div className="font-semibold text-slate-900 mb-4 tracking-tight text-lg">
            WarmEdge AI
          </div>
          <p className="text-slate-700 leading-relaxed">
            Powered by WarmEdge.
            <br />
            Where engineering and skating meet.
          </p>
        </div>

        {/* Explore */}
        <div>
          <div className="font-medium text-slate-900 mb-4">
            Explore
          </div>
          <ul className="space-y-3">
            <li>
              <Link
                href="https://warmedge.org/collections/all"
                className="text-slate-700 hover:text-slate-900 transition-colors duration-200"
              >
                Products
              </Link>
            </li>
            <li>
              <Link
                href="/chat"
                className="text-slate-700 hover:text-slate-900 transition-colors duration-200"
              >
                WarmGPT
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="text-slate-700 hover:text-slate-900 transition-colors duration-200"
              >
                About
              </Link>
            </li>
          </ul>
        </div>

        {/* Connect */}
        <div>
          <div className="font-medium text-slate-900 mb-4">
            Connect
          </div>

          <p className="text-slate-700 mb-3">
            Instagram:&nbsp;
            <a
              href="https://www.instagram.com/warm_edge_skating"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 transition-colors duration-200"
            >
              @warm_edge_skating
            </a>
          </p>

          <p className="text-slate-700">
            Email:&nbsp;
            <a
              href="mailto:hello@warmedge.org"
              className="hover:text-slate-900 transition-colors duration-200"
            >
              hello@warmedge.org
            </a>
          </p>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="border-t border-sky-300/40">
        <div className="max-w-6xl mx-auto px-8 py-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-700">
          
          <span>
            © {new Date().getFullYear()} WarmEdge
          </span>

          <div className="mt-4 md:mt-0 flex space-x-6">
            <Link
              href="/privacy-policy"
              className="hover:text-slate-900 transition-colors duration-200"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-slate-900 transition-colors duration-200"
            >
              Terms
            </Link>
          </div>

        </div>
      </div>

    </footer>
  )
}
