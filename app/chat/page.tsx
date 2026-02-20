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
      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-150" />
      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-300" />
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
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [reloading, setReloading] = useState(false)

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
            session_id: sessionId,
          }),
        }
      )

      const data = await res.json()

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

  const injectAssistantMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: text },
    ])
  }

  const handleAboutClick = () => {
  injectAssistantMessage(
`WarmGPT is an AI assistant built specifically for figure skaters. It is trained on real skating discussions, equipment questions, and test requirements to help organize collective skating knowledge into something practical and searchable. It is not a substitute for a coach or skate technician, but a tool to help you think more clearly and prepare better questions.

WarmGPT is powered by WarmEdge — a skating-focused design brand founded by Charles Liu, an Engineering PhD from Dartmouth College and an adult figure skater. WarmEdge creates minimal, purpose-built skate accessories designed to improve comfort, focus, and consistency. The belief is simple: small skating problems deserve thoughtful design.`
  )
}

  const handleProductsClick = () => {
    injectAssistantMessage(
      `Please check out our skating products website: https://warmedge.org/`
    )
  }

  const handleReloadChat = () => {
    setReloading(true)

    setTimeout(() => {
      setMessages([
        {
          role: 'assistant',
          content:
            'Hi, I am WarmGPT. Ask me anything about figure skating technique, skates, or test rules.',
        },
      ])
      setSessionId(null)
      setReloading(false)
    }, 400)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-[100dvh] flex bg-gradient-to-br from-blue-200 via-blue-100 to-blue-300">

      {/* SIDEBAR */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-72' : 'w-0'
        } overflow-hidden bg-slate-900/95 backdrop-blur-md text-white flex flex-col`}
      >
        <div className="p-4 border-b border-slate-700 font-semibold">
          WarmGPT
        </div>

        <div className="p-4 space-y-2 text-sm">

          <button
            onClick={() => injectAssistantMessage('How can I help you today?')}
            className="w-full text-left rounded-lg px-3 py-2 hover:bg-white/10 transition"
          >
            Chat
          </button>

          <button
            onClick={handleAboutClick}
            className="w-full text-left rounded-lg px-3 py-2 hover:bg-white/10 transition"
          >
            About
          </button>

          <button
            onClick={handleProductsClick}
            className="w-full text-left rounded-lg px-3 py-2 hover:bg-white/10 transition"
          >
            Products
          </button>
        </div>

        <div className="mt-auto p-4 border-t border-slate-700">
          <button
            onClick={handleReloadChat}
            className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 transition px-4 py-2 text-sm flex items-center justify-center gap-2"
          >
            <span
              className={`transition-transform ${
                reloading ? 'rotate-180' : ''
              }`}
            >
              ↻
            </span>
            Restart Chat
          </button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col relative">

        {/* Drawer Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-4 left-4 z-20 bg-white/30 backdrop-blur-md border border-white/40 shadow-md rounded-md px-3 py-1 text-sm hover:bg-white/40 transition"
        >
          {sidebarOpen ? '←' : '→'}
        </button>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 pt-16 pb-6 space-y-6">

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
                      : 'text-blue-700'
                  }`}
                >
                  {m.role === 'assistant' ? 'WarmGPT' : 'You'}
                </div>

                {m.role === 'assistant' ? (
                  <div className="rounded-xl bg-white/20 backdrop-blur-md border border-white/30 px-5 py-3 text-slate-900 whitespace-pre-line">
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
              <div className="text-sm mb-1 text-slate-600">
                WarmGPT
              </div>
              <div className="rounded-xl bg-white/20 backdrop-blur-md border border-white/30 px-5 py-3">
                <ThinkingDots />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/30 bg-white/10 backdrop-blur-md p-6">

          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a figure skating question..."
            className="w-full rounded-xl bg-white/20 border border-white/30 px-4 py-3 text-slate-900 focus:outline-none resize-none focus:ring-2 focus:ring-blue-400"
          />

          <button
            onClick={sendMessage}
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-blue-600 hover:bg-blue-700 transition py-3 text-white font-medium disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}