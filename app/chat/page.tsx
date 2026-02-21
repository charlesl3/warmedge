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
        'Hi, I am WarmGPT. Ask me anything about figure skating technique, skates, or test rules. The answers are primarily based on skaters’ shared experiences from internet posts and forums. This is not a substitute for advice from a professional skate technician or coach.',
    },
  ])
  const [loading, setLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1200)
  }

  const sendMessage = async (overrideText?: string) => {
    const textToSend = overrideText ?? input
    if (!textToSend.trim() || loading) return

    setInput('')
    setLoading(true)

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: textToSend },
    ])

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: textToSend }),
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

  const handleEditSave = (index: number) => {
    const updated = [...messages]
    updated[index].content = editingText
    const trimmed = updated.slice(0, index + 1) // remove old assistant replies
    setMessages(trimmed)
    setEditingIndex(null)
    setEditingText('')
    sendMessage(editingText)
  }

  return (
    <div className="h-[100dvh] flex bg-gradient-to-br from-blue-200 via-blue-100 to-blue-300 relative">
      <div className="flex-1 flex flex-col">

        <div className="flex-1 overflow-y-auto px-8 pt-16 pb-6 space-y-6">
          {messages.map((m, i) => {
            const isEditing = editingIndex === i
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

                <div className="relative group">

                  {/* EDIT MODE */}
                  {isEditing ? (
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
                      className="w-full rounded-xl bg-white/30 border border-white/40 px-4 py-3 text-slate-900 focus:outline-none resize-none"
                      rows={2}
                    />
                  ) : (
                    <div
                      className={`rounded-xl px-5 py-3 whitespace-pre-line ${
                        m.role === 'assistant'
                          ? 'bg-white/20 backdrop-blur-md border border-white/30 text-slate-900'
                          : 'bg-white/40 text-slate-900'
                      }`}
                    >
                      {m.role === 'assistant' && isLastAssistant ? (
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
                  )}

                  {/* Hover Actions */}
                  {!isEditing && (
                    <div
                      className="
                        absolute top-2 right-2
                        flex gap-2
                        opacity-0 group-hover:opacity-100
                        transition
                      "
                    >
                      <button
                        onClick={() => handleCopy(m.content, i)}
                        className="p-1.5 rounded-md bg-white/50 hover:bg-white/70 backdrop-blur-md border border-white/40"
                      >
                        {copiedIndex === i ? (
                          <span className="text-xs text-green-700">✓</span>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4 text-slate-700"
                          >
                            <path d="M16 1H4a2 2 0 00-2 2v12h2V3h12V1z" />
                            <path d="M20 5H8a2 2 0 00-2 2v14h14a2 2 0 002-2V7a2 2 0 00-2-2zm0 16H8V7h12v14z" />
                          </svg>
                        )}
                      </button>

                      {m.role === 'user' && (
                        <button
                          onClick={() => {
                            setEditingIndex(i)
                            setEditingText(m.content)
                          }}
                          className="p-1.5 rounded-md bg-white/50 hover:bg-white/70 backdrop-blur-md border border-white/40"
                        >
                          ✎
                        </button>
                      )}
                    </div>
                  )}
                </div>
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Ask a figure skating question..."
              className="flex-1 rounded-xl bg-white/20 border border-white/30 px-4 py-3 text-slate-900 focus:outline-none resize-none focus:ring-2 focus:ring-blue-400"
            />

            <button
              onClick={() => sendMessage()}
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