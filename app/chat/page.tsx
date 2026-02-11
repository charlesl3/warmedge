'use client'

import { useState, useRef, useEffect } from 'react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = input
    setInput('')
    setLoading(true)

    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMessage },
    ])

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            history: history,
          }),
        }
      )

      const data = await res.json()

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.reply },
      ])

      setHistory(data.history)
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-start justify-center pt-56 px-6">
      <div className="w-full max-w-3xl">

        <h1 className="text-3xl font-semibold mb-8 text-gray-900">
          WarmEdge AI Chatbot
        </h1>

        {/* Chat Container */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-4">

          {messages.length === 0 && (
            <p className="text-gray-500 text-sm">
              Ask a figure skating question to get started.
            </p>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="text-sm text-gray-500">Thinking…</div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="mt-6 flex gap-3">
          <textarea
            rows={3}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your skating question…"
            className="flex-1 border border-gray-300 rounded-2xl p-3 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          <button
            onClick={sendMessage}
            disabled={loading}
            className="px-5 py-3 text-sm rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
          >
            Send
          </button>
        </div>

      </div>
    </main>
  )
}
