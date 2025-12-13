'use client'

import { useState } from 'react'

export default function ContactPage() {
  const FORM_ENDPOINT = 'https://formspree.io/f/meoyndbv'

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(e.currentTarget),
      })

      if (res.ok) {
        setStatus('success')
        setFormData({ name: '', email: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className="flex justify-center px-8 pt-44 pb-32">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-800 mb-12 text-center">
          Contact us
        </h1>

        <div className="text-center mb-12">
          <p className="text-slate-700">
            Questions, feedback, or ideas to share?
          </p>
          <p className="text-slate-600 mt-4 text-sm">
            We appreciate thoughtful feedback and ideas. If something feels slightly off, or you wish
            something could be better, do not hesitate to reach out. We read every message.
          </p>
        </div>

        {status === 'success' ? (
          <div className="rounded-md border border-slate-200 bg-white p-6 text-center">
            <p className="text-slate-800 font-medium">
              Message sent. Thank you.
            </p>
            <p className="text-slate-600 text-sm mt-2">
              We will get back to you as soon as we can.
            </p>

            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="mt-6 rounded-md bg-slate-800 px-6 py-3 text-white font-medium hover:bg-slate-700 transition"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="text"
              name="name"
              placeholder="Name (optional)"
              value={formData.name}
              onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              value={formData.email}
              onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />

            <textarea
              name="message"
              placeholder="Message"
              rows={6}
              required
              value={formData.message}
              onChange={(e) => setFormData((d) => ({ ...d, message: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
            />

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full rounded-md bg-slate-800 px-6 py-3 text-white font-medium hover:bg-slate-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'submitting' ? 'Sending...' : 'Send message'}
            </button>

            {status === 'error' && (
              <p className="text-sm text-red-600 text-center">
                Something went wrong. Please try again, or email us directly.
              </p>
            )}
          </form>
        )}

        <p className="text-sm text-slate-500 text-center mt-8">
          Our business is still at its early stage. We read every message, but replies may take time.
        </p>
      </div>
    </main>
  )
}
