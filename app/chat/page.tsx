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

/* ------------------------------------------
   Strong, visible bouncing loading dots
------------------------------------------ */

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
        'Hi, I am WarmGPT. Ask me anything about figure skating technique, skates, or test rules. Please ask a concrete and valid skating question.',
    },
  ])
  const [loading, setLoading] = useState(false)

  const bottomRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const hasMountedRef = useRef(false)

  const messageCount = useMemo(() => messages.length, [messages.length])

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' })
  }

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      requestAnimationFrame(scrollToBottom)
      return
    }
    requestAnimationFrame(scrollToBottom)
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
    <main className="min-h-screen px-6 pt-28 pb-12 flex justify-center">
      <div className="w-full max-w-3xl">

        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mb-10 text-center">
           
        </h1>

        <div className="rounded-3xl border border-black/30">

          {/* Message Area */}
          <div className="h-[60vh] md:h-[62vh] overflow-y-auto px-7 py-8 space-y-7">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[75%] px-5 py-4 text-[15px] leading-relaxed rounded-2xl ${
                    m.role === 'user'
                      ? 'border border-[#2F6BFF] text-slate-900'
                      : 'border border-black/20 text-slate-900'
                  }`}
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
              <div className="flex justify-start">
                <div className="border border-black/20 px-5 py-4 rounded-2xl">
                  <ThinkingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-black/20 p-6">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question..."
              className="w-full rounded-2xl border border-[#1E293B] bg-transparent px-5 py-4 text-[15px] text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-[#2F6BFF] resize-none overflow-hidden transition-all duration-200"
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              className="mt-4 w-full rounded-2xl bg-[#2F6BFF] px-6 py-4 text-white text-[15px] font-medium hover:bg-[#2554D6] transition disabled:opacity-60"
            >
              {loading ? (
                <div className="flex justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                'Send'
              )}
            </button>

            <p className="mt-3 text-xs text-slate-500 text-center">
              Press Enter to send, Shift+Enter for a new line.
            </p>
          </div>

        </div>
      </div>
    </main>
  )
}
