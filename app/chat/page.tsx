'use client'

import { useState, KeyboardEvent } from 'react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hi, I’m WarmEdge. Ask me anything about figure skating technique, sharpening, boots, or competition rules.",
    },
  ])
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input
    setInput('')
    setLoading(true)

    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            history: [],
          }),
        }
      )

      const data = await res.json()

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.reply },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <main className="flex justify-center px-8 pt-44 pb-32">
      <div className="w-full max-w-3xl">

        {/* Title */}
        <h1 className="text-4xl font-semibold tracking-tight text-slate-800 mb-14 text-center">
          WarmGPT
        </h1>

        {/* Chat messages */}
        <div className="space-y-8 mb-10">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-6 py-5 text-base leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-sky-500 text-white'
                    : 'bg-sky-50 border border-sky-200 text-slate-800'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <p className="text-base text-slate-500">Thinking…</p>
          )}
        </div>

        {/* Input */}
        <div className="space-y-5">
          <textarea
            rows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question..."
            className="w-full rounded-lg border border-sky-300 bg-transparent px-6 py-5 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
          />

          <button
            onClick={sendMessage}
            disabled={loading}
            className="w-full rounded-lg bg-sky-500 px-6 py-4 text-white text-base font-medium hover:bg-sky-600 transition disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>

      </div>
    </main>
  )
}
