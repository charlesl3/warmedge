'use client'

import {
  useEffect,
  useRef,
  useState,
  KeyboardEvent,
} from 'react'

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
        'Hi, I am WarmGPT. Ask me anything about figure skating technique, skates, or test rules.',
    },
  ])
  const [loading, setLoading] = useState(false)

  const bottomRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input
    setInput('')
    setLoading(true)

    setMessages((prev) => [
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
            history: [],
          }),
        }
      )

      const data = await res.json()

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong.' },
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
    <div className="flex flex-col min-h-[100dvh]">

      {/* Scrollable message area */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-32">
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.map((m, i) => (
            <div key={i}>
              <div className="text-xs text-slate-500 mb-1">
                {m.role === 'assistant' ? 'WarmGPT' : 'You'}
              </div>
              <div className="bg-white/40 backdrop-blur rounded-xl p-4 text-slate-900">
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div>
              <div className="text-xs text-slate-500 mb-1">
                WarmGPT
              </div>
              <div className="bg-white/40 rounded-xl p-4">
                Thinking...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Fixed input area */}
      <div
        className="
          fixed
          bottom-0
          left-0
          right-0
          bg-white/70
          backdrop-blur
          border-t
          px-4
          py-4
          pb-[calc(env(safe-area-inset-bottom)+16px)]
        "
      >
        <div className="max-w-2xl mx-auto">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a figure skating question..."
            className="
              w-full
              rounded-xl
              border
              px-4
              py-3
              text-sm
              focus:outline-none
              focus:border-[#2F6BFF]
              resize-none
            "
          />

          <button
            onClick={sendMessage}
            disabled={loading}
            className="
              mt-3
              w-full
              rounded-xl
              bg-[#2F6BFF]
              py-3
              text-white
              font-medium
              disabled:opacity-60
            "
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}