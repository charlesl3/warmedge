'use client'

import { useState } from 'react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

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
          headers: {
            'Content-Type': 'application/json',
          },
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
          content: 'Something went wrong.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-6 pt-32 pb-24 text-black">
      <h1 className="text-2xl font-semibold mb-6 text-black">
        WarmEdge Skating Chatbot
      </h1>

      <div className="border border-black rounded-md p-4 mb-4 space-y-3 bg-white">
        {messages.length === 0 && (
          <p className="text-black text-sm">
            Ask a figure skating question to get started.
          </p>
        )}

        {messages.map((m, i) => (
          <div key={i}>
            <p className="text-xs text-gray-600 mb-1">
              {m.role === 'user' ? 'You' : 'Assistant'}
            </p>
            <p className="whitespace-pre-wrap text-black">
              {m.content}
            </p>
          </div>
        ))}

        {loading && (
          <p className="text-gray-600 text-sm">Thinking…</p>
        )}
      </div>

      <div className="flex gap-2">
        <textarea
          rows={3}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your skating question…"
          className="flex-1 border border-black rounded-md p-2 text-sm text-black bg-white placeholder-gray-600"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-4 py-2 text-sm border border-black rounded-md bg-white text-black hover:bg-gray-100 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </main>
  )
}
