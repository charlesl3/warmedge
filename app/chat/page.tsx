'use client'

import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import Typewriter from '../components/Typewriter'

type Message = {
  id?: string
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  repaired?: boolean
}

type ChatSession = {
  id: string
  title: string
  messages: Message[]
  pinned?: boolean
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

const defaultGreeting: Message = {
  role: 'assistant',
  content: `Hi, I am WarmGPT, your AI assistant for figure skating. You can ask me about figure skating technique, equipment, USFSA tests, and daily skating questions.

Please kindly note:
1. My answers are based on real skating discussions and shared rink experience, not Wikipedia-style explanations.
2. I help you think through skating questions, but I do not replace a coach, judge, or technician.
3. If a question has multiple interpretations, I may ask clarification.
4. Feedback is welcome at charlesatlife@gmail.com.`,
}

export default function ChatPage() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [reloading, setReloading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null)
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set())
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [finishedTypingIndex, setFinishedTypingIndex] = useState<number | null>(
    null
  )
  const [actionTargetIndex, setActionTargetIndex] = useState<number | null>(
    null
  )

  const createNewChat = (firstMessage: Message) => {
    const id = Date.now().toString()

    const newChat: ChatSession = {
      id,
      title: firstMessage.content.slice(0, 40),
      messages: [firstMessage],
    }

    const updated = [newChat, ...chatSessions]

    setChatSessions(updated)
    setCurrentChatId(id)
    setMessages([firstMessage])
  }

  const renameChat = (id: string, newTitle: string) => {
    setChatSessions((prev) =>
      prev.map((chat) => (chat.id === id ? { ...chat, title: newTitle } : chat))
    )
  }

  const togglePinChat = (id: string) => {
    setChatSessions((prev) =>
      prev.map((chat) =>
        chat.id === id ? { ...chat, pinned: !chat.pinned } : chat
      )
    )
  }

  const deleteChat = (id: string) => {
    const updated = chatSessions.filter((chat) => chat.id !== id)

    setChatSessions(updated)

    if (currentChatId === id) {
      if (updated.length > 0) {
        setCurrentChatId(updated[0].id)
        setMessages(updated[0].messages)
      } else {
        setCurrentChatId(null)
        setMessages([defaultGreeting])
      }
    }
  }

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()

    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const saved = sessionStorage.getItem('warmgpt_chats')

    if (!saved) {
      setMessages([defaultGreeting])
      return
    }

    try {
      const parsed: ChatSession[] = JSON.parse(saved)

      if (parsed.length === 0) {
        setMessages([defaultGreeting])
        return
      }

      setChatSessions(parsed)
      setCurrentChatId(parsed[0].id)
      setMessages(parsed[0].messages)
    } catch (err) {
      console.error('Failed loading chats', err)
      setMessages([defaultGreeting])
    }
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem('warmgpt_chats', JSON.stringify(chatSessions))
    } catch (err) {
      console.error('Failed saving chats', err)
    }
  }, [chatSessions])

  useEffect(() => {
    if (!currentChatId) return

    setChatSessions((prev) =>
      prev.map((chat) =>
        chat.id === currentChatId ? { ...chat, messages } : chat
      )
    )
  }, [messages])

  const defaultWelcome: Message = {
    role: 'assistant',
    content: `Hi, I am WarmGPT, your AI assistant for figure skating.

You can ask me about technique, equipment, USFSA tests, and daily skating questions.

Please note:
1. My answers are based on real skating discussions.
2. I am not a replacement for a coach or skate technician.
3. I may ask clarification questions when needed.
4. Feedback is welcome at charlesatlife@gmail.com.`,
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input
    setInput('')
    setLoading(true)

    const newMessage: Message = { role: 'user', content: userMessage }

    // rename chat title if this is the first user message
    if (currentChatId) {
      setChatSessions((prev) =>
        prev.map((chat) => {
          if (chat.id !== currentChatId) return chat

          // if only assistant welcome exists
          const isFirstUserMessage = chat.messages.length <= 1

          if (isFirstUserMessage) {
            return {
              ...chat,
              title: userMessage.slice(0, 40),
            }
          }

          return chat
        })
      )
    }

    if (!currentChatId) {
      createNewChat(newMessage)
    } else {
      setMessages((prev) => [...prev, newMessage])
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_CHAT_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
        }),
      })

      const data = await res.json()

      if (!sessionId && data.session_id) {
        setSessionId(data.session_id)
      }

      setMessages((prev) => [
        ...prev,
        {
          id: data.message_id,
          role: 'assistant',
          content: data.reply,
          sources: data.sources,
          repaired: data.repaired,
        },
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
    setMessages((prev) => [...prev, { role: 'assistant', content: text }])
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
      const welcomeMessage: Message = {
        role: 'assistant',
        content:
          'You have started a new session. I may not retain context from earlier conversations in this thread. Please restate your question clearly.',
      }

      // create a new chat session
      const id = Date.now().toString()

      const newChat: ChatSession = {
        id,
        title: 'New chat',
        messages: [welcomeMessage],
      }

      setChatSessions((prev) => [newChat, ...prev])

      setCurrentChatId(id)
      setMessages([welcomeMessage])

      // reset backend memory
      setSessionId(null)

      setReloading(false)
    }, 300)
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_CHAT_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
        }),
      })

      const data = await res.json()

      setMessages((prev) => [
        ...prev,
        {
          id: data.message_id,
          role: 'assistant',
          content: data.reply,
          sources: data.sources,
          repaired: data.repaired,
        },
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

  const isLikelyInfoQuery = (text: string = '') => {
    return (
      /^(who|what|when|where|why|is|are|do|does|did)\b/i.test(text.trim()) &&
      text.length < 120
    )
  }

  const sendActionMessage = async (
    action: 'drills' | 'simplify' | 'deeper' | 'diagnose',
    linkedQuestion: string | null,
    assistantAnswer: string,
    index: number
  ) => {
    if (loading || actionLoading) return // ✅ FIRST check

    setActionTargetIndex(index) // ✅ THEN set target
    setActionLoading(true)

    const context = linkedQuestion || assistantAnswer || ''
    const isInfo = isLikelyInfoQuery(linkedQuestion || '')

    let actionPrompt = ''

    if (action === 'drills') {
      actionPrompt = `
If the previous context is about a skating skill or issue, give practical drills.

If it is NOT (e.g. asking about a person or general info), then:
- identify key skating skills related to the topic
- suggest beginner-friendly drills for those skills

Context:
${context}
`
    }

    if (action === 'simplify') {
      actionPrompt = `
Explain this more simply and concisely using clear language and fewer words.

Content:
${assistantAnswer}
`
    }

    if (action === 'deeper') {
      actionPrompt = `
Go deeper technically.

Include mechanics, reasoning, and nuanced details.

Context:
${context}
`
    }

    if (action === 'diagnose') {
      actionPrompt = `
If the previous context describes a skating issue, diagnose possible causes.

If it does NOT describe a personal issue, then:
- explain common mistakes related to this topic
- suggest how a skater could self-check

Context:
${context}
`
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_CHAT_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: actionPrompt,
          session_id: sessionId,
        }),
      })

      const data = await res.json()

      if (!sessionId && data.session_id) {
        setSessionId(data.session_id)
      }

      setMessages((prev) => [
        ...prev,
        {
          id: data.message_id,
          role: 'assistant',
          content: data.reply,
          sources: data.sources,
          repaired: data.repaired,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong.' },
      ])
    } finally {
      setActionLoading(false)
      setActionTargetIndex(null)
    }
  }

  const sendMessageFromAction = async (text: string) => {
    if (!text.trim() || loading) return

    setLoading(true)

    const userMessage: Message = {
      role: 'user',
      content: text,
    }

    setMessages((prev) => [...prev, userMessage])

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_CHAT_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
        }),
      })

      const data = await res.json()

      if (!sessionId && data.session_id) {
        setSessionId(data.session_id)
      }

      setMessages((prev) => [
        ...prev,
        {
          id: data.message_id,
          role: 'assistant',
          content: data.reply,
          sources: data.sources,
          repaired: data.repaired,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong.' },
      ])
    } finally {
      setLoading(false)
      setInput('')
    }
  }

  const stopSpeech = () => {
    if (typeof window === 'undefined') return
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    utteranceRef.current = null
    setSpeakingIndex(null)
  }

  const handleHelpful = async (messageId: string) => {
    if (!sessionId || !messageId) return

    try {
      await fetch(`${process.env.NEXT_PUBLIC_CHAT_API_URL}/feedback/helpful`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message_id: messageId,
        }),
      })

      console.log('Feedback sent for message:', messageId)
    } catch (err) {
      console.error('Feedback error:', err)
    }
  }

  const clearAllChats = () => {
    sessionStorage.removeItem('warmgpt_chats')

    setChatSessions([])
    setCurrentChatId(null)
    setSessionId(null)

    setMessages([
      {
        role: 'assistant',
        content: 'Chat history cleared. You can start a new conversation.',
      },
    ])
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
    const preferred = voices.find(
      (v) => v.name.includes('Google') || v.lang.includes('en')
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

  const loadChatSession = async (sid: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/chat/${sid}`
      )

      const data = await res.json()

      if (data.messages) {
        setMessages(data.messages)
        setSessionId(sid)
      }

      if (isMobile) setSidebarOpen(false)
    } catch (err) {
      console.error('Failed to load chat', err)
    }
  }

  const sortedChats = [...chatSessions].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1

    return 0
  })

  return (
    <div className="h-[100dvh] flex bg-slate-50 relative">
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
          bg-white border-r border-slate-200
          text-slate-700
          flex flex-col
        `}
      >
        <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-center">
          <img
            src="/logo1.jpg"
            alt="WarmEdge"
            className="h-50 w-auto object-contain opacity-90"
          />
        </div>

        <div className="px-4 py-5 space-y-2 text-sm">
          <button
            onClick={() => {
              injectAssistantMessage('Hi, how can I help you today?')
              if (isMobile) setSidebarOpen(false)
            }}
            className="
w-full text-left rounded-lg px-4 py-2.5
text-slate-700
hover:bg-slate-100
transition-all duration-150
"
          >
            Chat
          </button>

          <button
            onClick={handleAboutClick}
            className="
w-full text-left rounded-lg px-4 py-2.5
text-slate-700
hover:bg-slate-100
transition-all duration-150
"
          >
            About
          </button>

          <button
            onClick={handleProductsClick}
            className="
w-full text-left rounded-lg px-4 py-2.5
text-slate-700
hover:bg-slate-100
transition-all duration-150
"
          >
            Products
          </button>

          <button
            onClick={clearAllChats}
            className="
w-full text-left rounded-lg px-4 py-2.5
hover:bg-red-50
transition-colors duration-150
text-red-600
"
          >
            Clear chat history
          </button>

          {/* INSERT THIS BLOCK HERE */}

          <div className="mt-6 space-y-1 border-t border-slate-100 pt-4">
            {sortedChats.map((chat) => (
              <div
                key={chat.id}
                className="flex items-center justify-between group px-2 py-1"
              >
                <button
                  onClick={() => {
                    setCurrentChatId(chat.id)
                    setMessages(chat.messages)

                    if (isMobile) setSidebarOpen(false)
                  }}
                  className="
flex-1 text-left px-3 py-2.5
rounded-lg
text-sm
truncate
bg-transparent
hover:bg-white
hover:shadow-sm
transition-all duration-150
"
                >
                  {chat.title}
                </button>

                <div className="flex items-center gap-2 mr-1">
                  {/* Rename */}

                  <button
                    onClick={(e) => {
                      e.stopPropagation()

                      const newTitle = prompt('Rename chat', chat.title)

                      if (newTitle) renameChat(chat.id, newTitle)
                    }}
                    className="p-1.5 rounded-md hover:bg-slate-200 transition"
                    title="Rename chat"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="w-4 h-4 text-slate-600"
                    >
                      <path d="M4 21h4l11-11-4-4L4 17v4z" />
                    </svg>
                  </button>

                  {/* Pin */}

                  {/* Pin */}

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePinChat(chat.id)
                    }}
                    className="p-1.5 rounded-md hover:bg-slate-200 transition"
                    title="Star chat"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className={`w-4 h-4 ${
                        chat.pinned
                          ? 'fill-yellow-400 stroke-yellow-500'
                          : 'fill-none stroke-slate-600'
                      }`}
                    >
                      <path d="M12 2l2.9 6.1 6.7.6-5 4.4 1.5 6.5L12 16.9 5.9 19.6l1.5-6.5-5-4.4 6.7-.6L12 2z" />
                    </svg>
                  </button>

                  {/* Delete */}

                  <button
                    onClick={(e) => {
                      e.stopPropagation()

                      if (confirm('Delete this chat?')) {
                        deleteChat(chat.id)
                      }
                    }}
                    className="p-1 rounded hover:bg-red-100 transition"
                    title="Delete chat"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="w-4 h-4 text-red-500"
                    >
                      <path d="M6 6l12 12M6 18L18 6" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col relative">
        {/* HEADER BAR */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
          {/* Sidebar toggle */}
          <div className="relative group">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center justify-center h-9 w-9 rounded-md border border-slate-300 hover:bg-slate-100"
            >
              {sidebarOpen ? '←' : '☰'}
            </button>

            <div
              className="
      absolute top-1/2 left-full ml-2
      -translate-y-1/2
      px-2 py-1
      text-xs
      bg-slate-700 text-white
      rounded
      shadow
      opacity-0 group-hover:opacity-100
      transition-opacity duration-150
      pointer-events-none
      whitespace-nowrap
      z-50
    "
            >
              {sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            </div>
          </div>

          {/* Reload chat */}
          {/* Reload chat */}
          <div className="relative group">
            <button
              onClick={handleReloadChat}
              disabled={reloading}
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

            <div
              className="
      absolute top-1/2 right-full mr-2
      -translate-y-1/2
      px-2 py-1
      text-xs
      bg-slate-700 text-white
      rounded
      shadow
      opacity-0 group-hover:opacity-100
      transition-opacity duration-150
      pointer-events-none
      whitespace-nowrap
      z-50
    "
            >
              Start new chat
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pt-6 pb-6 space-y-6">
          {messages.map((m, i) => {
            const linkedQuestion =
              m.role === 'assistant' &&
              i > 0 &&
              messages[i - 1]?.role === 'user'
                ? messages[i - 1].content
                : null

            const isLastAssistant =
              m.role === 'assistant' && i === messages.length - 1 && !loading

            return (
              <div
                key={`${m.role}-${i}-${m.content.slice(0, 20)}`}
                className={`flex flex-col ${
                  m.role === 'user' ? 'items-end pr-4' : 'items-start pl-4'
                }`}
              >
                <div className="flex items-center justify-between text-sm mb-2">
                  <div className="flex items-center gap-3 ml-3">
                    <span className="font-medium">
                      {m.role === 'assistant' ? 'WarmGPT' : 'You'}
                    </span>
                  </div>

                  {editingIndex !== i && (
                    <div className="flex items-center gap-3 ml-3">
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
    border border-slate-300
    bg-white
    hover:bg-slate-100
    transition-all duration-150
  "
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4 text-slate-600"
                          >
                            <path
                              d="M11 5 6 9H3v6h3l5 4V5zM15.5 8.5a5 5 0 0 1 0 7m2.5-9.5a8 8 0 0 1 0 12"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              fill="none"
                            />
                          </svg>
                        </button>
                      )}

                      {m.role === 'assistant' && (
                        <button
                          onClick={() => {
                            if (!m.id) {
                              console.warn('No message id')
                              return
                            }

                            handleHelpful(m.id)

                            setLikedSet((prev) => {
                              const next = new Set(prev)
                              next.add(m.id!)
                              return next
                            })
                          }}
                          title="Helpful"
                          className="
      flex items-center justify-center
      h-7 w-7
      rounded-lg
      border border-slate-300
      bg-white
      hover:bg-slate-100
      transition-all duration-150
    "
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className={`w-4 h-4 ${
                              m.id && likedSet.has(m.id)
                                ? 'fill-green-500 stroke-green-600'
                                : 'fill-none stroke-slate-600'
                            }`}
                            strokeWidth="1.5"
                          >
                            <path d="M7 11v8h-2a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2z" />
                            <path d="M7 11l5-7a2 2 0 0 1 3 2v3h4a2 2 0 0 1 2 2l-1 6a2 2 0 0 1-2 2H7z" />
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
                      className={`${isLastAssistant ? '' : 'msg-animate'}
  ${m.role === 'assistant' ? 'max-w-[820px]' : 'max-w-[280px]'}
  rounded-2xl px-6 py-5 whitespace-pre-line
  ${
    m.role === 'assistant'
      ? 'bg-white shadow-sm border border-slate-100'
      : 'bg-white border border-slate-200'
  }`}
                      style={{
                        WebkitUserSelect: 'text',
                        userSelect: 'text',
                        WebkitTouchCallout: 'default',
                      }}
                    >
                      <div className="text-[15px] leading-7 tracking-[0.01em] text-slate-800">
                        {isLastAssistant ? (
                          <Typewriter
                            text={m.content}
                            speed={6}
                            showCursor
                            onComplete={() => setFinishedTypingIndex(i)}
                          />
                        ) : (
                          m.content.split(/\n+/).map((line, idx) => {
                            if (line.trim() === '') {
                              return <div key={idx} className="h-3" />
                            }

                            return (
                              <p key={idx} className="mb-2 last:mb-0">
                                {line}
                              </p>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {m.role === 'assistant' &&
                  !loading &&
                  linkedQuestion && // 🔥 ONLY show if tied to a user question
                  finishedTypingIndex === i && (
                    <div className="mt-3 flex flex-wrap gap-2 px-1">
                      <button
                        onClick={() =>
                          sendActionMessage(
                            'drills',
                            linkedQuestion,
                            m.content,
                            i
                          )
                        }
                        disabled={actionLoading}
                        className={`
text-xs px-3 py-1.5
rounded-full
bg-white
border border-slate-200
text-slate-600
transition-all duration-150
${actionLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'}
`}
                      >
                        Try drills
                      </button>

                      <button
                        onClick={() =>
                          sendActionMessage(
                            'simplify',
                            linkedQuestion,
                            m.content,
                            i
                          )
                        }
                        disabled={actionLoading}
                        className={`
text-xs px-3 py-1.5
rounded-full
bg-white
border border-slate-200
text-slate-600
transition-all duration-150
${actionLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'}
`}
                      >
                        Simplify
                      </button>

                      <button
                        onClick={() =>
                          sendActionMessage(
                            'deeper',
                            linkedQuestion,
                            m.content,
                            i
                          )
                        }
                        disabled={actionLoading}
                        className={`
text-xs px-3 py-1.5
rounded-full
bg-white
border border-slate-200
text-slate-600
transition-all duration-150
${actionLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'}
`}
                      >
                        Go deeper
                      </button>

                      <button
                        onClick={() =>
                          sendActionMessage(
                            'diagnose',
                            linkedQuestion,
                            m.content,
                            i
                          )
                        }
                        disabled={actionLoading}
                        className={`
text-xs px-3 py-1.5
rounded-full
bg-white
border border-slate-200
text-slate-600
transition-all duration-150
${actionLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'}
`}
                      >
                        Diagnose me
                      </button>
                    </div>
                  )}
                {actionLoading && actionTargetIndex === i && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <ThinkingDots />
                    <span>Thinking deeper...</span>
                  </div>
                )}
                {m.role === 'assistant' && m.repaired && (
                  <div className="text-xs text-slate-400 mt-2 px-1 italic">
                    ✨ refined for clarity
                  </div>
                )}
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

        <div className="border-t border-slate-100 bg-white p-6">
          <div className="flex items-end gap-3">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a figure skating question..."
              className="
flex-1 rounded-full
bg-white
shadow-md
border border-slate-200
px-5 py-3
resize-none
focus:outline-none focus:ring-2 focus:ring-slate-200
"
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              className="
h-11 px-6
rounded-full
bg-slate-200
text-black
font-medium
shadow-md
hover:bg-slate-300
active:scale-95
transition-all duration-150
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
