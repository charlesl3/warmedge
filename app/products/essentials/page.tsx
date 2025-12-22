export default function SkatingEssentialsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pt-44 py-24">
      <h1 className="text-2xl font-medium text-slate-900">
        Skating Essentials
      </h1>

      <p className="mt-4 text-slate-600">
        The small things skaters use every day.
        Simple essentials, designed with care.
      </p>

      {/* Internal testing block */}
      <div className="mt-16 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm text-slate-600 mb-4">
          This section is for internal checkout testing only.
          Products are not publicly available yet.
        </p>

        <a
          href="https://warmedge-3.myshopify.com/products/other-example-product-1"
          // 以后用variant改这个
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg bg-slate-900 px-5 py-2.5 text-sm text-white hover:bg-slate-800 transition"
        >
          Test checkout
        </a>
      </div>
    </main>
  )
}
