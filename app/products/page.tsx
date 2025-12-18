import Link from "next/link"
import Image from "next/image"

export default function Products() {
  return (
    <main className="min-h-screen pt-44 px-8 max-w-6xl mx-auto">
      {/* Header */}
      <h1 className="text-3xl font-medium text-slate-700">
        Products
      </h1>

      <p className="mt-4 text-slate-500 max-w-xl">
        We are building a small set of thoughtfully designed skating products.
        Items are currently in development and will be released gradually.
      </p>

      {/* Main layout */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-24 items-start">
        {/* Left: product categories */}
        <div className="space-y-12">
          <ProductCategory
            title="Rink Photography"
            href="/products/photographing"
            description="Simple tools designed to make filming and sharing skating moments easier at the rink."
          />

          <ProductCategory
            title="Rink Warming"
            href="/products/warming"
            description="Warming accessories focused on comfort, thermal performance, and minimal bulk."
          />

          <ProductCategory
            title="Rink Storage"
            href="/products/storage"
            description="Practical storage solutions to protect and organize skating gear."
          />

          <ProductCategory
            title="Skating Essentials"
            href="/products/essentials"
            description="Everyday skating accessories designed with function, durability, and aesthetics in mind."
          />
        </div>

        {/* Right: concept image */}
        <div className="hidden md:block -translate-y-16">
          <Image
            src="/edea.jpg"
            alt="Concept product image"
            width={700}
            height={1000}
            className="object-cover"
            priority
          />

          <p className="mt-4 text-sm text-slate-400 text-center tracking-wide">
            Conceptual design of WarmEdge skate guards
          </p>
        </div>
      </div>
    </main>
  )
}

function ProductCategory({
  title,
  href,
  description,
}: {
  title: string
  href: string
  description: string
}) {
  return (
    <div className="border-b border-slate-200/70 pb-6">
      <Link
        href={href}
        className="text-xl font-medium text-slate-700 hover:text-slate-900"
      >
        {title}
      </Link>

      <p className="mt-2 text-slate-500 max-w-xl">
        {description}
      </p>
    </div>
  )
}
