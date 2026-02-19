'use client'

import {
  useEffect,
  useRef,
  useState,
  KeyboardEvent,
} from 'react'
import Typewriter from '../components/Typewriter'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

function ThinkingDots() {
  return (
    <div className="flex items-end gap-2 h-5">
      <div className="dot" />
      <div className="dot delay-150" />
      <div className="dot delay-300" />
    </div>
  )
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

  // ✅ NEW: session memory
  const [sessionId, setSessionId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
            session_id: sessionId, // ✅ send session id
          }),
        }
      )

      const data = await res.json()

      // ✅ store session id from backend
      if (!sessionId && data.session_id) {
        setSessionId(data.session_id)
      }

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
    <div className="h-[100dvh] flex flex-col">

      {/* MESSAGE AREA */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4 space-y-6">

        {messages.map((m, i) => {
          const isLastAssistant =
            m.role === 'assistant' &&
            i === messages.length - 1 &&
            !loading

          return (
            <div key={i}>
              <div
                className={`text-sm mb-1 ${
                  m.role === 'assistant'
                    ? 'text-slate-600'
                    : 'text-[#2F6BFF]'
                }`}
              >
                {m.role === 'assistant' ? 'WarmGPT' : 'You'}
              </div>

              {m.role === 'assistant' ? (
                <div className="rounded-xl bg-white/20 backdrop-blur-sm px-4 py-3 text-slate-900">
                  {isLastAssistant ? (
                    <Typewriter
                      key={i}
                      text={m.content}
                      speed={18}
                      showCursor
                    />
                  ) : (
                    m.content
                  )}
                </div>
              ) : (
                <div className="text-slate-900">{m.content}</div>
              )}
            </div>
          )
        })}

        {loading && (
          <div>
            <div className="text-sm mb-1 text-slate-600">WarmGPT</div>
            <div className="rounded-xl bg-white/20 px-4 py-3">
              <ThinkingDots />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="border-t bg-white/10 backdrop-blur-md p-4 pb-[env(safe-area-inset-bottom)]">

        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a figure skating question..."
          className="w-full rounded-xl bg-white/20 px-4 py-3 text-slate-900 focus:outline-none resize-none"
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="mt-3 w-full rounded-xl bg-[#2F6BFF] py-3 text-white font-medium disabled:opacity-60"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

    </div>
  )
}
