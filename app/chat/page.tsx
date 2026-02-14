'use client'

import { useEffect, useMemo, useRef, useState, KeyboardEvent } from 'react'

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
        'Hi, I am WarmEdge. Ask me anything about figure skating technique, sharpening, boots, or competition rules.',
    },
  ])
  const [loading, setLoading] = useState(false)

  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const hasMountedRef = useRef(false)

  const messageCount = useMemo(() => messages.length, [messages.length])

  const scrollToBottom = (behavior: ScrollBehavior) => {
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' })
  }

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      requestAnimationFrame(() => scrollToBottom('auto'))
      return
    }
    requestAnimationFrame(() => scrollToBottom('smooth'))
  }, [messageCount, loading])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input
    setInput('')
    setLoading(true)

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_CHAT_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: [],
        }),
      })

      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
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
    <main className="min-h-screen px-6 pt-28 pb-12 flex justify-center bg-transparent">
      <div className="w-full max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mb-10 text-center">
          WarmGPT
        </h1>

        {/* Fully transparent panel */}
        <div
          className="
            rounded-2xl
            bg-transparent
            border border-neutral-700/40
            shadow-[0_12px_30px_rgba(0,0,0,0.06)]
            overflow-hidden
          "
        >
          {/* Messages */}
          <div
            ref={scrollerRef}
            className="h-[60vh] md:h-[62vh] overflow-y-auto px-7 py-8 space-y-7"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[78%] rounded-2xl px-5 py-4 text-[15px] leading-relaxed
                    ${m.role === 'user'
                      ? `
                        bg-transparent
                        border border-[#1E5EFF]/60
                        text-slate-900
                        shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]
                      `
                      : `
                        bg-transparent
                        border border-neutral-700/25
                        text-slate-900
                        shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]
                      `
                    }
                  `}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <p className="text-sm text-slate-700/70">Thinking...</p>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-neutral-700/25 p-6 bg-transparent">
            <div className="space-y-4">
              <textarea
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about blades, boots, technique..."
                className="
                  w-full rounded-xl
                  border border-neutral-800/55
                  bg-transparent
                  px-5 py-4
                  text-[15px] text-slate-900
                  placeholder:text-slate-500/70
                  shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)]
                  focus:outline-none
                  focus:ring-2 focus:ring-[#1E5EFF]/60
                  transition
                  resize-none
                "
              />

              <button
                onClick={sendMessage}
                disabled={loading}
                className="
                  w-full rounded-xl
                  bg-[#1E5EFF]
                  px-6 py-4
                  text-white text-[15px] font-medium
                  hover:bg-[#1748C8]
                  transition
                  disabled:opacity-60
                "
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-600/70 text-center">
              Press Enter to send, Shift+Enter for a new line.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
