'use client'

import {
  useEffect,
  useMemo,
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
    <div className="flex items-end gap-3 h-6">
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

  const bottomRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const messageCount = useMemo(() => messages.length, [messages.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messageCount, loading])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [input])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input
    setInput('')
    setLoading(true)

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])

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
    <div className="h-screen flex flex-col bg-gradient-to-b from-[#eaf9ff] to-[#b8e4ff]">

      {/* Scrollable Message Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4 space-y-6">

        {messages.map((m, i) => (
          <div key={i}>
            <div
              className={`text-sm font-medium mb-2 ${
                m.role === 'assistant'
                  ? 'text-slate-600'
                  : 'text-[#2F6BFF]'
              }`}
            >
              {m.role === 'assistant' ? 'WarmGPT' : 'You'}
            </div>

            <div
              className="
                rounded-2xl
                border border-white/40
                bg-white/20
                backdrop-blur-md
                px-5 py-4
                text-[16px]
                leading-relaxed
                text-slate-900
              "
            >
              {m.role === 'assistant' &&
              i === messages.length - 1 &&
              !loading ? (
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
          </div>
        ))}

        {loading && (
          <div>
            <div className="text-sm font-medium mb-2 text-slate-600">
              WarmGPT
            </div>
            <div className="rounded-2xl border border-white/40 bg-white/20 backdrop-blur-md px-5 py-4">
              <ThinkingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Fixed Bottom Input */}
      <div className="border-t border-white/30 bg-white/20 backdrop-blur-md p-4 pb-[env(safe-area-inset-bottom)]">

        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a figure skating question..."
          className="
            w-full
            rounded-2xl
            border border-white/40
            bg-white/30
            px-4 py-3
            text-[16px]
            resize-none
            focus:outline-none
            focus:border-[#2F6BFF]
          "
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="
            mt-3
            w-full
            rounded-2xl
            bg-[#2F6BFF]
            py-3
            text-white
            font-medium
            disabled:opacity-60
          "
        >
          {loading ? 'Thinking...' : 'Send'}
        </button>

      </div>

    </div>
  )
}
