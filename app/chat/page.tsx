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
  content: `Hi, I am WarmGPT, your AI assistant for figrue skating. You can ask me about figure skating technique, equipment, USFSA test, and daily skating questions. 
  
Please kindly note:
1. My answers are based on real skating discussions and shared rink experience, not aiming to providing Wikipedia-style textbook explanations.
2. I am designed to help you think through skating questions more clearly, not to replace a coach, judge, or skate technician. For detailed technical correction, equipment adjustments, or medical concerns, always consult a qualified professional.
3. If your question has multiple possible meanings, I may ask for clarification before answering.
4. I am continuously improving. If you see something that can be made clearer or more accurate, I appreciate thoughtful feedback at charlesatlife@gmail.com.`
},
  ])
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [reloading, setReloading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  

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
  window.open(
    'https://warmedge.org/collections/all',
    '_blank',
    'noopener,noreferrer'
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
        'You have started a new session. I may not retain context from earlier conversations in this thread. Please restate your question clearly and include any relevant details so I can respond accurately.'      },
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

  const handleCopy = async (text: string, index: number) => {
  try {
    await navigator.clipboard.writeText(text)

    setCopiedIndex(index)

    // reset after 1.5s
    setTimeout(() => {
      setCopiedIndex((prev) => (prev === index ? null : prev))
    }, 1500)
  } catch (err) {
    console.error('Clipboard error:', err)
  }
}

  const handleEditSave = (index: number) => {
    const updated = [...messages]
    updated[index].content = editingText
    const trimmed = updated.slice(0, index + 1)

    setMessages(trimmed)
    setEditingIndex(null)
    setEditingText('')

    setTimeout(() => {
      sendMessageFromEdit(editingText)
    }, 50)
  }

  const sendMessageFromEdit = async (text: string) => {
    if (!text.trim()) return
    setLoading(true)

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            session_id: sessionId,
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

const stopSpeech = () => {
  if (typeof window === 'undefined') return
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  utteranceRef.current = null
  setSpeakingIndex(null)
}

const speakText = (text: string, index: number) => {
  if (typeof window === 'undefined') return
  if (!('speechSynthesis' in window)) return

  // stop anything currently speaking
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utteranceRef.current = utterance

  utterance.rate = 1
  utterance.pitch = 1
  utterance.volume = 1

  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(v =>
    v.name.includes('Google') || v.lang.includes('en')
  )
  if (preferred) utterance.voice = preferred

  setSpeakingIndex(index)

  utterance.onend = () => {
    setSpeakingIndex(null)
    utteranceRef.current = null
  }

  utterance.onerror = () => {
    setSpeakingIndex(null)
    utteranceRef.current = null
  }

  window.speechSynthesis.speak(utterance)
}

  return (
    <div className="h-[100dvh] flex bg-white relative">

      {/* Mobile Overlay */}
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
          bg-white border-r border-black
          text-slate-700
          flex flex-col
        `}
      >
        <div className="p-5 border-b border-white/20 flex items-center justify-center">
          <img
            src="/logo1.jpg"
            alt="WarmEdge"
            className="h-50 w-auto object-contain"
          />
        </div>

        <div className="p-5 space-y-3 text-sm">

          <button
            onClick={() => {
              injectAssistantMessage('How can I help you today?')
              if (isMobile) setSidebarOpen(false)
            }}
            className="
w-full text-left rounded-md px-4 py-2.5
border border-transparent
hover:border-slate-300
hover:bg-slate-100
transition-colors duration-150
"
          >
            Chat
          </button>

          <button
            onClick={handleAboutClick}
            className="
w-full text-left rounded-md px-4 py-2.5
border border-transparent
hover:border-slate-300
hover:bg-slate-100
transition-colors duration-150
"
          >
            About
          </button>

          <button
  onClick={handleProductsClick}
  className="
w-full text-left rounded-md px-4 py-2.5
flex justify-between items-center
border border-transparent
hover:border-slate-300
hover:bg-slate-100
transition-colors duration-150
"
>
  Products
  <svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="1.5"
  className="w-4 h-4 text-slate-500 group-hover:text-black transition-colors duration-150"
>
  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
</svg>
</button>

        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col relative">
      
      {/* HEADER BAR */}
<div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
  {/* Sidebar toggle */}
  <button
    onClick={() => setSidebarOpen(!sidebarOpen)}
    className="flex items-center justify-center h-9 w-9 rounded-md border border-slate-300 hover:bg-slate-100"
  >
    {sidebarOpen ? '←' : '☰'}
  </button>

  {/* Reload chat */}
  <button
    onClick={handleReloadChat}
    disabled={reloading}
    title="Start new chat"
    className="
      flex items-center justify-center
      h-9 w-9
      rounded-md
      border border-slate-300
      hover:bg-slate-100
    "
  >
    <span className={reloading ? 'animate-spin' : ''}>↻</span>
  </button>

</div>





        <div className="flex-1 overflow-y-auto px-8 pt-6 pb-6 space-y-6">

          {messages.map((m, i) => {
            const isLastAssistant =
              m.role === 'assistant' &&
              i === messages.length - 1 &&
              !loading

            return (
              <div
  key={i}
  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
>
                <div className="flex items-center justify-between text-sm mb-1">

  <span>
    {m.role === 'assistant' ? 'WarmGPT' : 'You'}
  </span>

  {editingIndex !== i && (
    <div className="flex items-center gap-2">

      <button
  onClick={() => handleCopy(m.content, i)}
  className={`
    text-xs px-2 py-0.5 rounded-md border backdrop-blur-sm transition
    ${
      copiedIndex === i
        ? 'bg-green-500 text-white border-green-500'
        : 'bg-white border border-slate-300 hover:bg-slate-100'
    }
  `}
>
  {copiedIndex === i ? '✓ Copied' : 'Copy'}
</button>

      {m.role === 'user' && (
        <button
          onClick={() => {
            setEditingIndex(i)
            setEditingText(m.content)
          }}
          className={`
  text-xs px-2 py-0.5 rounded-md
  bg-white
  border border-slate-300
  hover:bg-slate-100
  transition-colors duration-150
`}
        >
          Edit
        </button>
      )}

{m.role === 'assistant' && (
  <button
    onClick={() => speakText(m.content, i)}
    title="Read aloud"
    className="
      flex items-center justify-center
      h-7 w-7
      rounded-lg
      bg-white/20
      border border-white/20
      backdrop-blur-sm
      text-slate-700
      hover:bg-white/40
      hover:scale-105
      active:scale-95
      transition-all duration-150
    "
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path d="M11 5 6 9H3v6h3l5 4V5zM15.5 8.5a5 5 0 0 1 0 7m2.5-9.5a8 8 0 0 1 0 12" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  </button>
)}

{m.role === 'assistant' && speakingIndex === i && (
  <button
    onClick={stopSpeech}
    title="Stop reading"
    className="
      flex items-center justify-center
      h-7 w-7
      rounded-lg
      bg-white/20
      border border-white/20
      backdrop-blur-sm
      text-slate-700
      hover:bg-white/40
      active:scale-95
      transition-all duration-150
    "
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path d="M7 7h10v10H7z" />
    </svg>
  </button>
)}

    </div>
  )}

</div>

                <div>

                  {editingIndex === i ? (
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleEditSave(i)
                        }
                        if (e.key === 'Escape') {
                          setEditingIndex(null)
                        }
                      }}
                      className="w-full rounded-xl bg-white/30 border px-4 py-3 resize-none"
                    />
                  ) : (
                    <div
className={`${
  isLastAssistant ? '' : 'msg-animate'
} rounded-xl px-5 py-3 whitespace-pre-line border ${
  m.role === 'assistant'
    ? 'bg-white/20 backdrop-blur-md'
    : 'bg-white border'
}`}
                      style={{
                        WebkitUserSelect: 'text',
                        userSelect: 'text',
                        WebkitTouchCallout: 'default',
                      }}
                    >
                      {isLastAssistant ? (
                        <Typewriter text={m.content} speed={12} showCursor />
                      ) : (
                        m.content
                      )}
                    </div>
                  )}


</div>

                
              </div>
            )
          })}

          {loading && (
            <div className="msg-animate rounded-xl bg-white/20 px-5 py-3">
              <ThinkingDots />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t bg-white/10 backdrop-blur-md p-6">
          <div className="flex items-end gap-3">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a figure skating question..."
              className="flex-1 rounded-xl bg-white/20 border px-4 py-3 resize-none"
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              className="
h-11 px-6
rounded-md
border border-black
bg-white
text-black
font-medium
hover:bg-slate-100
transition-colors duration-150
"
            >
              {loading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}