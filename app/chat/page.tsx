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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [reloading, setReloading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
`WarmGPT is an AI assistant built specifically for figure skaters and developed by WarmEdge. It organizes real skating discussions, equipment questions, and test requirements into something searchable, structured, and practical. It is not a substitute for a coach or skate technician, but a tool designed to help you think more clearly and make informed decisions around the rink. WarmEdge is a skating-focused design brand creating minimal, purpose-built skate accessories to improve comfort, focus, and consistency.`
    )

    if (isMobile) setSidebarOpen(false)
  }

  const handleProductsClick = () => {
    injectAssistantMessage(
`Please check out our skating products website: https://warmedge.org/`
    )

    if (isMobile) setSidebarOpen(false)
  }

  const handleReloadChat = () => {
    setReloading(true)

    setTimeout(() => {
      setMessages([
        {
          role: 'assistant',
          content:
            'Hi, I am WarmGPT. Ask me anything about figure skating technique, skates, or test rules. The answers are primarily based on skaters’ shared experiences from internet posts and forums. This is not a substitute for advice from a professional skate technician or coach.',
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
    <div className="h-[100dvh] flex bg-gradient-to-br from-blue-200 via-blue-100 to-blue-300 relative">

      {/* Overlay (Mobile Only) */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setSidebarOpen(false)}
        />
      )}

{/* SIDEBAR */}
<div
  className={`
    fixed md:relative z-20 h-full
    transition-all duration-300 ease-in-out
    ${sidebarOpen ? 'w-72' : 'w-0'}
    overflow-hidden
    bg-white/10 backdrop-blur-xl
    border-r border-white/20
    shadow-xl
    text-slate-700
    flex flex-col
  `}
>
  {/* Logo Area */}
  <div className="p-5 border-b border-white/20 flex items-center justify-center">
    <img
      src="/logo1.jpg"
      alt="WarmEdge"
      className="h-50 w-auto object-contain"
    />
  </div>

  {/* Navigation */}
  <div className="p-5 space-y-3 text-sm">

    <button
      onClick={() => {
        injectAssistantMessage('How can I help you today?')
        if (isMobile) setSidebarOpen(false)
      }}
      className="
        w-full text-left
        rounded-lg
        px-4 py-2.5
        text-slate-700
        hover:bg-white/30
        hover:text-slate-900
        transition
      "
    >
      Chat
    </button>

    <button
      onClick={handleAboutClick}
      className="
        w-full text-left
        rounded-lg
        px-4 py-2.5
        text-slate-700
        hover:bg-white/30
        hover:text-slate-900
        transition
      "
    >
      About
    </button>

    <button
      onClick={handleProductsClick}
      className="
        w-full text-left
        rounded-lg
        px-4 py-2.5
        text-slate-700
        hover:bg-white/30
        hover:text-slate-900
        transition
      "
    >
      Products
    </button>

  </div>
</div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col relative">

        {/* Restart Button */}
        <button
          onClick={handleReloadChat}
          className="
            absolute top-4 right-4 z-30
            text-xl
            text-slate-600
            bg-white/20
            hover:bg-white/30
            backdrop-blur-md
            border border-white/30
            rounded-md
            px-3 py-1
            transition
          "
        >
          <span
            className={`inline-block transition-transform ${
              reloading ? 'rotate-180' : ''
            }`}
          >
            ↻
          </span>
        </button>

        {/* Drawer Toggle */}
        {(!sidebarOpen || !isMobile) && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute top-4 left-4 z-30 bg-white/30 backdrop-blur-md border border-white/40 shadow-md rounded-md px-3 py-1 text-sm hover:bg-white/40 transition"
          >
            {sidebarOpen ? '←' : '☰'}
          </button>
        )}

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
  <div className="flex items-end gap-3">
    <textarea
      rows={1}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Ask a figure skating question..."
      className="flex-1 rounded-xl bg-white/20 border border-white/30 px-4 py-3 text-slate-900 focus:outline-none resize-none focus:ring-2 focus:ring-blue-400"
    />

    <button
      onClick={sendMessage}
      disabled={loading}
      className="rounded-xl bg-blue-600 hover:bg-blue-700 transition px-5 py-3 text-white font-medium disabled:opacity-60 whitespace-nowrap"
    >
      {loading ? '...' : 'Send'}
    </button>
  </div>
</div>

      </div>
    </div>
  )
}