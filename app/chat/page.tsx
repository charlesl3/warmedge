'use client'

import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import Typewriter from '../components/Typewriter'
import { supabase } from '../lib/supabase'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import {
  appShell,
  glass,
  glassStrong,
  darkBubble,
  softBubble,
  iconBtn,
  navBtn,
  pillBtn,
} from '../../components/design'

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
  const [session, setSession] = useState<any>(null)

  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  const [authFirstName, setAuthFirstName] = useState('')
  const [authLastName, setAuthLastName] = useState('')

  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')

  const [skaterLevel, setSkaterLevel] = useState('beginner')
  const [highestJump, setHighestJump] = useState('')
  const [highestTestLevel, setHighestTestLevel] = useState('')
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [profileUpdateCandidate, setProfileUpdateCandidate] =
    useState<any>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [bladeTracker, setBladeTracker] = useState<any>(null)

  const [trackerLoading, setTrackerLoading] = useState(false)
  const [sharpeningLoading, setSharpeningLoading] = useState(false)
  const [sessionLoggingLoading, setSessionLoggingLoading] = useState(false)

  const [sessionHours, setSessionHours] = useState('')
  const [sessionNote, setSessionNote] = useState('')
  const [editingSessionDate, setEditingSessionDate] = useState<string | null>(
    null
  )

  const [editingNoteText, setEditingNoteText] = useState('')
  const [sessionsPage, setSessionsPage] = useState(1)

  const SESSIONS_PER_PAGE = 5
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeView, setActiveView] = useState<'chat' | 'blade_tracker'>('chat')
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
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)

      if (data.session?.user?.id) {
        loadProfile(data.session.user.id)

        loadBladeTracker()
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)

      if (session?.user?.id) {
        loadProfile(session.user.id)

        loadBladeTracker()
      } else {
        setBladeTracker(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768

      setIsMobile(mobile)

      // desktop default open
      if (!mobile) {
        setSidebarOpen(true)
      }
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

  const loadProfile = async (userId: string) => {
    setProfileLoaded(false)

    const { data, error } = await supabase
      .from('profiles')
      .select(
        `
  first_name,
  last_name,
  skater_level,
  highest_jump,
  highest_test_level
`
      )
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Failed to load profile:', error.message)
      setProfileLoaded(true)
      return
    }

    if (data) {
      setAuthFirstName(data.first_name || '')
      setAuthLastName(data.last_name || '')
      setSkaterLevel(data.skater_level || 'beginner')
      setHighestJump(data.highest_jump || '')
      setHighestTestLevel(data.highest_test_level || '')
    }

    setProfileLoaded(true)
  }

  const loadBladeTracker = async () => {
    try {
      setTrackerLoading(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/blade-tracker`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      const data = await res.json()

      if (data.success) {
        setBladeTracker(data.tracker)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setTrackerLoading(false)
    }
  }

  const handleLogSession = async () => {
    if (!sessionHours) return
    const numericHours = parseFloat(sessionHours)

    const existingSession = bladeTracker?.sessions?.find(
      (s: any) => s.session_date === selectedDate
    )

    // 0 hrs behavior
    if (numericHours === 0) {
      // existing record → delete it
      if (existingSession) {
        await handleDeleteSession(selectedDate)

        setSessionHours('')

        showToast('✓ Session removed')
      }

      // no existing record → do nothing
      return
    }

    try {
      setSessionLoggingLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/blade-tracker/session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            hours: numericHours,
            session_date: selectedDate,
            note: sessionNote,
          }),
        }
      )

      const data = await res.json()

      if (data.success) {
        setBladeTracker(data.tracker)
        setSessionHours('')
        setSessionNote('')
        showToast('✓ Session logged')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSessionLoggingLoading(false)
    }
  }

  const handleSharpened = async () => {
    try {
      setSharpeningLoading(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/blade-tracker/sharpened`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            sharpened_at: selectedDate,
          }),
        }
      )

      const data = await res.json()

      if (data.success) {
        setBladeTracker(data.tracker)

        showToast('✓ Sharpening recorded')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSharpeningLoading(false)
    }
  }

  const handleDeleteSession = async (sessionDate: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/blade-tracker/session`,
        {
          method: 'DELETE',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },

          body: JSON.stringify({
            session_date: sessionDate,
          }),
        }
      )

      const data = await res.json()

      if (data.success) {
        setBladeTracker(data.tracker)

        showToast('✓ Session deleted')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveSessionNote = async (
    sessionDate: string,
    hours: number,
    noteText: string
  ) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token

      console.log('[NOTE SAVE]')
      console.log('date:', sessionDate)
      console.log('hours:', hours)
      console.log('note:', noteText)

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/blade-tracker/session`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },

          body: JSON.stringify({
            session_date: sessionDate,
            hours: hours,
            note: noteText,
          }),
        }
      )

      const data = await res.json()

      console.log('[NOTE SAVE RESPONSE]', data)

      if (!data.success) {
        console.error('NOTE SAVE ERROR:', data)

        alert(JSON.stringify(data))
        showToast('Failed to save note')
        return
      }

      setBladeTracker(data.tracker)

      setEditingSessionDate(null)

      setEditingNoteText('')

      showToast('✓ Note saved')
    } catch (err) {
      console.error(err)
    }
  }

  const showToast = (message: string) => {
    setToastMessage(message)

    setTimeout(() => {
      setToastMessage('')
    }, 1500)
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
    const frontendTimer = performance.now()

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
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token

      const res = await fetch(`${process.env.NEXT_PUBLIC_CHAT_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
        }),
      })

      const data = await res.json()
      if (data.profile_update_candidate) {
        setProfileUpdateCandidate(data.profile_update_candidate)
      }

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
      const frontendLatency = (
        (performance.now() - frontendTimer) /
        1000
      ).toFixed(2)

      console.log(`[FRONTEND LATENCY] ${frontendLatency}s`)
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
    action: 'simplify' | 'deeper',
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

    if (action === 'simplify') {
      actionPrompt = `
Mode: simplify

Rewrite the answer into a MUCH shorter version.

Strict rules:
- Reduce the text length by at least 70%.
- Keep only the core point.
- Use simple language.
- Remove extra nuance, caveats, examples, and repeated explanation.
- Maximum 3 very short sentences.
- Do not add new information.

Content:
${assistantAnswer}
`
    }

    if (action === 'deeper') {
      actionPrompt = `
Mode: deeper

Expand this into a significantly deeper answer.

Strict rules:
- The new answer must be much longer than the original.
- Add technical reasoning, mechanics, common mistakes, practical cues, and realistic skating nuance.
- Explain why things happen, not only what to do.
- Add several useful details that were not in the original.
- Stay organized and practical.
- Do not mention sources or internal systems.

Context:
${context}

Original answer:
${assistantAnswer}
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

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
    })

    if (error) {
      alert(error.message)
      return
    }

    const user = data.user

    if (user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        email: authEmail,
        first_name: authFirstName,
        last_name: authLastName,
        skater_level: skaterLevel,
        highest_jump: highestJump,
        highest_test_level: highestTestLevel,
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        console.error('Profile creation failed:', profileError.message)
        alert(profileError.message)
        return
      }
    }

    setAuthModalOpen(false)
    showToast('✓ Account created')
  }

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    })

    if (error) {
      alert(error.message)
      return
    }

    if (data.user?.id) {
      await loadProfile(data.user.id)
    }

    setAuthModalOpen(false)
    showToast('✓ Signed in')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const sortedChats = [...chatSessions].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1

    return 0
  })

  const fieldLabel = (field: string) => {
    if (field === 'highest_jump') {
      return 'Highest jump'
    }

    if (field === 'highest_test_level') {
      return 'Highest test level'
    }

    return field
  }

  const sessionDateSet = new Set(
    bladeTracker?.sessions?.map((s: any) => s.session_date)
  )

  const sessionHoursByDate: Record<string, number> = {}

  bladeTracker?.sessions?.forEach((s: any) => {
    sessionHoursByDate[s.session_date] = Number(s.hours)
  })

  const sharpenDateSet = new Set(
    bladeTracker?.last_sharpened_at ? [bladeTracker.last_sharpened_at] : []
  )

  const sortedSessions = [...(bladeTracker?.sessions || [])].sort(
    (a: any, b: any) =>
      new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
  )

  const totalSessionPages = Math.ceil(sortedSessions.length / SESSIONS_PER_PAGE)

  const paginatedSessions = sortedSessions.slice(
    (sessionsPage - 1) * SESSIONS_PER_PAGE,
    sessionsPage * SESSIONS_PER_PAGE
  )

  return (
    <div className={appShell}>
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
relative z-20 h-full shrink-0

transition-all duration-500
ease-[cubic-bezier(0.22,1,0.36,1)]

overflow-hidden

${sidebarOpen ? 'w-[290px]' : 'w-0'}

md:block

${isMobile ? 'fixed left-0 top-0' : ''}

bg-white/70
backdrop-blur-md

border-r border-white/40

shadow-[24px_0_90px_rgba(15,23,42,0.06)]

text-slate-700
flex flex-col
`}
        style={{
          transform:
            isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
        }}
      >
        <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-center">
          <img
            src="/logo1.jpg"
            alt="WarmEdge"
            className="h-24 w-auto object-contain opacity-90"
          />
        </div>

        <div className="px-4 py-5 space-y-2 text-sm">
          <button
            onClick={() => {
              setActiveView('chat')

              if (isMobile) {
                setSidebarOpen(false)
              }
            }}
            className={navBtn}
          >
            Chat
          </button>

          <button onClick={handleAboutClick} className={navBtn}>
            About
          </button>

          <button onClick={handleProductsClick} className={navBtn}>
            Products
          </button>

          <button
            onClick={() => {
              setActiveView('blade_tracker')
              loadBladeTracker()

              if (isMobile) {
                setSidebarOpen(false)
              }
            }}
            className={navBtn}
          >
            Blade Sharpening Tracker
          </button>

          <button
            onClick={clearAllChats}
            className="
w-full text-left
rounded-2xl
px-4 py-3
text-sm font-medium
text-red-500
hover:bg-red-50/80
transition-all
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
flex-1 text-left
px-4 py-3

rounded-2xl

text-sm font-medium
truncate

bg-white/10
backdrop-blur-sm

border border-transparent

hover:bg-white/45
hover:border-white/60
hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]

active:scale-[0.985]

transition-all duration-200
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
                    className="
p-2
rounded-xl

bg-white/0
hover:bg-white/50

backdrop-blur-sm

transition-all duration-150
"
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
                    className="
p-2
rounded-xl

bg-white/0
hover:bg-white/50

backdrop-blur-sm

transition-all duration-150
"
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
                    className="
p-2
rounded-xl

hover:bg-red-100/80
backdrop-blur-sm

transition-all duration-150
"
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
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* HEADER BAR */}
        <div
          className="
flex items-center justify-between
px-5 py-4

bg-white/72
backdrop-blur-md

border-b border-white/40

shadow-[0_10px_50px_rgba(15,23,42,0.04)]
"
        >
          {/* Sidebar toggle */}
          <div className="relative group">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={iconBtn}
            >
              <span className="text-lg">{sidebarOpen ? '←' : '☰'}</span>
            </button>

            <div
              className="
    absolute top-1/2 left-full ml-3
    -translate-y-1/2
    px-2 py-1
    text-xs
    bg-slate-900 text-white
    rounded-lg
    shadow-xl
    opacity-0 group-hover:opacity-100
    transition
    pointer-events-none
    whitespace-nowrap
    z-50
  "
            >
              {sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Reload chat */}
            <div className="relative group">
              <button
                onClick={handleReloadChat}
                disabled={reloading}
                className={iconBtn}
              >
                <span className={`text-lg ${reloading ? 'animate-spin' : ''}`}>
                  ↻
                </span>
              </button>

              <div
                className="
    absolute top-1/2 right-full mr-3
    -translate-y-1/2
    px-2 py-1
    text-xs
    bg-slate-900 text-white
    rounded-lg
    shadow-xl
    opacity-0 group-hover:opacity-100
    transition
    pointer-events-none
    whitespace-nowrap
    z-50
  "
              >
                Start new chat
              </div>
            </div>

            {session && profileLoaded ? (
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <button
                    onClick={() => setProfileModalOpen(true)}
                    className="
text-sm font-medium text-slate-700

px-4 py-2

rounded-2xl

bg-white/30
backdrop-blur-sm

border border-white/40

hover:bg-white/50
hover:shadow-[0_10px_30px_rgba(15,23,42,0.06)]

transition-all duration-200
"
                  >
                    {authFirstName || 'Skater'} (
                    {skaterLevel === 'non_skater'
                      ? 'Non-skater'
                      : skaterLevel.charAt(0).toUpperCase() +
                        skaterLevel.slice(1)}
                    )
                  </button>

                  <div
                    className="
    absolute top-full right-0 mt-2

    px-2 py-1
    text-xs

    bg-slate-700 text-white
    rounded-md
    shadow-lg

    opacity-0
    group-hover:opacity-100

    transition-opacity duration-150

    pointer-events-none
    whitespace-nowrap
    z-50
    "
                  >
                    Edit your profile
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="
px-4 py-2

text-sm font-medium

rounded-2xl

bg-white/30
backdrop-blur-sm

border border-white/40

hover:bg-white/50
hover:shadow-[0_10px_30px_rgba(15,23,42,0.06)]

transition-all duration-200
"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="
flex items-center justify-center

h-11 w-11

rounded-2xl

bg-white/30
backdrop-blur-sm

border border-white/40

hover:bg-white/55
hover:shadow-[0_10px_30px_rgba(15,23,42,0.06)]

transition-all duration-200
"
                title="Sign in"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="w-5 h-5 text-slate-700"
                >
                  <path d="M20 21a8 8 0 1 0-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            )}
          </div>
        </div>
        {activeView === 'blade_tracker' ? (
          <div
            className="
  flex-1 overflow-y-auto
  px-4 py-6 md:p-8
  bg-white/20 backdrop-blur-sm
"
          >
            <div className="w-full max-w-6xl mx-auto space-y-6">
              <div className={`${glassStrong} rounded-[2rem] p-6 md:p-8`}>
                <h2 className="text-2xl font-semibold mb-4">
                  Blade Sharpening Tracker
                </h2>

                {session && bladeTracker ? (
                  <>
                    <div className="mb-4">
                      <div className="text-sm text-slate-500 mb-1">
                        Hours since sharpening
                      </div>

                      <div className="text-3xl font-bold">
                        {bladeTracker.hours_since_sharpening} /{' '}
                        {bladeTracker.threshold_hours} hrs
                      </div>
                      <div className="text-sm text-slate-500 mt-2">
                        Last sharpened:
                        <span className="ml-2 font-medium text-slate-700">
                          {bladeTracker.last_sharpened_at || 'Not recorded'}
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden mb-4">
                      <div
                        className={`h-full transition-all duration-700 ${
                          bladeTracker.should_sharpen
                            ? 'bg-red-500'
                            : 'bg-slate-700'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (bladeTracker.hours_since_sharpening /
                              bladeTracker.threshold_hours) *
                              100
                          )}%`,
                        }}
                      />
                    </div>

                    {bladeTracker.should_sharpen && (
                      <div className="text-red-600 font-medium mb-4">
                        Your blades may need sharpening.
                      </div>
                    )}

                    {!bladeTracker.last_sharpened_at && (
                      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Please record your last sharpening date before tracking
                        skating hours.
                      </div>
                    )}

                    <div className="mb-6">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="number"
                          step="0.5"
                          placeholder="Hours"
                          value={sessionHours}
                          onChange={(e) => setSessionHours(e.target.value)}
                          className="
  border rounded-lg px-3 py-2
  w-full sm:w-32
"
                        />

                        <button
                          onClick={handleLogSession}
                          disabled={sessionLoggingLoading}
                          className={`
    px-4 py-2 rounded-lg
    border border-slate-300
    transition-all duration-200

    ${
      sessionLoggingLoading
        ? 'bg-slate-200 text-slate-500'
        : 'bg-white text-slate-800 hover:bg-slate-100'
    }
  `}
                        >
                          {sessionLoggingLoading ? 'Logging...' : 'Log Session'}
                        </button>

                        <button
                          onClick={handleSharpened}
                          disabled={sharpeningLoading}
                          className={`
    px-4 py-2 rounded-lg
    border border-slate-300
    transition-all duration-200

    ${sharpeningLoading ? 'bg-slate-200 text-slate-500' : 'hover:bg-slate-100'}
  `}
                        >
                          {sharpeningLoading
                            ? 'Recording...'
                            : 'Record Sharpening'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="mb-8">
                        <h3 className="font-semibold mb-4">Skating Calendar</h3>

                        <div
                          className="
  rounded-2xl
  border border-slate-200
  p-2 md:p-4
  bg-white
  overflow-hidden
"
                        >
                          <Calendar
                            className="warm-calendar"
                            calendarType="gregory"
                            value={new Date(selectedDate)}
                            onChange={(value: any) => {
                              const d = new Date(value)

                              const yyyy = d.getFullYear()
                              const mm = String(d.getMonth() + 1).padStart(
                                2,
                                '0'
                              )
                              const dd = String(d.getDate()).padStart(2, '0')

                              setSelectedDate(`${yyyy}-${mm}-${dd}`)
                            }}
                            tileClassName={({ date, view }) => {
                              if (view !== 'month') return ''

                              const yyyy = date.getFullYear()
                              const mm = String(date.getMonth() + 1).padStart(
                                2,
                                '0'
                              )
                              const dd = String(date.getDate()).padStart(2, '0')

                              const key = `${yyyy}-${mm}-${dd}`

                              if (sharpenDateSet.has(key)) {
                                return 'sharpen-day'
                              }

                              const hours = sessionHoursByDate[key]

                              if (hours) {
                                if (hours >= 2) {
                                  return 'session-day-heavy'
                                }

                                if (hours >= 1.5) {
                                  return 'session-day-medium-heavy'
                                }

                                if (hours >= 1) {
                                  return 'session-day-medium'
                                }

                                return 'session-day-light'
                              }

                              return ''
                            }}
                            tileContent={({ date, view }) => {
                              if (view !== 'month') return null

                              const yyyy = date.getFullYear()
                              const mm = String(date.getMonth() + 1).padStart(
                                2,
                                '0'
                              )
                              const dd = String(date.getDate()).padStart(2, '0')

                              const key = `${yyyy}-${mm}-${dd}`
                              const hours = sessionHoursByDate[key]

                              if (!hours) return null

                              return (
                                <div className="calendar-hour-tooltip">
                                  {hours} hrs
                                </div>
                              )
                            }}
                          />
                        </div>

                        <div className="flex items-center gap-5 mt-4 text-sm text-slate-500">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-blue-600" />
                            Session logged
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded bg-yellow-400" />
                              Sharpened
                            </div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold mb-3">Recent Sessions</h3>

                      <div className="space-y-2">
                        {paginatedSessions.map((s: any) => (
                          <div
                            key={s.id}
                            className="
      bg-white/20 backdrop-blur-sm
      rounded-xl
      px-4 py-4
      border border-slate-100
      space-y-3
    "
                          >
                            {/* TOP ROW */}
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <div className="font-semibold text-slate-800">
                                  {s.session_date}
                                </div>

                                <div className="text-sm text-slate-500 mt-1">
                                  {s.hours} hrs
                                </div>
                              </div>

                              <button
                                onClick={() =>
                                  handleDeleteSession(s.session_date)
                                }
                                className="
          text-xs
          px-3 py-1.5
          rounded-lg
          border border-red-200
          text-red-500
          hover:bg-red-50
        "
                              >
                                Delete
                              </button>
                            </div>

                            {/* NOTE AREA */}
                            {/* NOTE AREA */}

                            {editingSessionDate === s.session_date ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editingNoteText}
                                  onChange={(e) =>
                                    setEditingNoteText(e.target.value)
                                  }
                                  placeholder=""
                                  className="
        w-full
        rounded-xl
        border border-slate-200
        px-3 py-2
        text-sm
        min-h-[90px]
        resize-none
        focus:outline-none
        focus:ring-2
        focus:ring-slate-200
      "
                                />

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleSaveSessionNote(
                                        s.session_date,
                                        s.hours,
                                        editingNoteText
                                      )
                                    }
                                    className="
          px-3 py-1.5
          rounded-lg
          bg-slate-800
          text-white
          text-sm
          hover:bg-slate-700
        "
                                  >
                                    Save
                                  </button>

                                  <button
                                    onClick={() => {
                                      setEditingSessionDate(null)
                                      setEditingNoteText('')
                                    }}
                                    className="
          px-3 py-1.5
          rounded-lg
          border border-slate-300
          text-sm
          hover:bg-slate-100
        "
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`
    rounded-xl
    px-4 py-3
    transition-all

    ${
      s.note?.trim()
        ? `
          border border-slate-200
          bg-white
          shadow-sm
        `
        : `
          border border-dashed border-slate-200
          bg-white/20 backdrop-blur-sm
        `
    }
  `}
                              >
                                <div
                                  className={`
  text-sm
  whitespace-pre-wrap

  ${s.note?.trim() ? 'text-slate-700' : 'text-slate-400 italic'}
`}
                                >
                                  {s.note?.trim()
                                    ? s.note
                                    : 'Add your skating note here.'}
                                </div>

                                <div className="mt-3 flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingSessionDate(s.session_date)

                                      setEditingNoteText(s.note || '')
                                    }}
                                    className="
          text-xs
          px-3 py-1.5
          rounded-lg
          border border-slate-300
          hover:bg-slate-100
        "
                                  >
                                    Edit
                                  </button>

                                  {s.note && (
                                    <button
                                      onClick={async () => {
                                        setEditingSessionDate(null)

                                        setEditingNoteText('')

                                        try {
                                          const {
                                            data: { session },
                                          } = await supabase.auth.getSession()

                                          const accessToken =
                                            session?.access_token

                                          const res = await fetch(
                                            `${process.env.NEXT_PUBLIC_CHAT_API_URL}/blade-tracker/session`,
                                            {
                                              method: 'POST',

                                              headers: {
                                                'Content-Type':
                                                  'application/json',
                                                Authorization: `Bearer ${accessToken}`,
                                              },

                                              body: JSON.stringify({
                                                session_date: s.session_date,
                                                hours: s.hours,
                                                note: '',
                                              }),
                                            }
                                          )

                                          const data = await res.json()

                                          if (data.success) {
                                            setBladeTracker(data.tracker)

                                            showToast('✓ Note cleared')
                                          }
                                        } catch (err) {
                                          console.error(err)
                                        }
                                      }}
                                      className="
            text-xs
            px-3 py-1.5
            rounded-lg
            border border-red-200
            text-red-500
            hover:bg-red-50
          "
                                    >
                                      Clear note
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {/* PAGINATION */}

                      {totalSessionPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-6">
                          <button
                            disabled={sessionsPage === 1}
                            onClick={() =>
                              setSessionsPage((p) => Math.max(1, p - 1))
                            }
                            className="
        px-3 py-1.5
        rounded-lg
        border border-slate-300
        text-sm
        disabled:opacity-40
        hover:bg-slate-100
      "
                          >
                            ← Previous
                          </button>

                          <div className="text-sm text-slate-500">
                            Page {sessionsPage} / {totalSessionPages}
                          </div>

                          <button
                            disabled={sessionsPage === totalSessionPages}
                            onClick={() =>
                              setSessionsPage((p) =>
                                Math.min(totalSessionPages, p + 1)
                              )
                            }
                            className="
        px-3 py-1.5
        rounded-lg
        border border-slate-300
        text-sm
        disabled:opacity-40
        hover:bg-slate-100
      "
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-16 text-center">
                    <div className="text-6xl mb-6">⛸️</div>

                    <h3 className="text-2xl font-semibold text-slate-800 mb-3">
                      Track your skating and sharpening history
                    </h3>

                    <p className="text-slate-500 max-w-md mx-auto leading-7 mb-8">
                      Save skating hours, monitor blade sharpening cycles, and
                      visualize your training habits over time.
                    </p>

                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setAuthMode('signup')
                          setAuthModalOpen(true)
                        }}
                        className="
          px-6 py-3
          rounded-xl
          bg-slate-800
          text-white
          font-medium
          hover:bg-slate-700
          transition-all
        "
                      >
                        Create your account
                      </button>

                      <div>
                        <button
                          onClick={() => {
                            setAuthMode('login')
                            setAuthModalOpen(true)
                          }}
                          className="
            text-sm
            text-slate-500
            hover:text-slate-700
          "
                        >
                          Already have an account? Sign in
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div
              className="
flex-1 overflow-y-auto

px-4 md:px-10 lg:px-16

pt-10 pb-12

space-y-10
"
            >
              <div className="max-w-5xl mx-auto w-full">
                {messages.map((m, i) => {
                  const linkedQuestion =
                    m.role === 'assistant' &&
                    i > 0 &&
                    messages[i - 1]?.role === 'user'
                      ? messages[i - 1].content
                      : null

                  const isLastAssistant =
                    m.role === 'assistant' &&
                    i === messages.length - 1 &&
                    !loading

                  return (
                    <div
                      key={`${m.role}-${i}-${m.content.slice(0, 20)}`}
                      className={`flex flex-col gap-2 ${
                        m.role === 'user' ? 'items-end' : 'items-start'
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
text-xs

px-3 py-1.5

rounded-xl

backdrop-blur-sm

border border-white/40

transition-all duration-200

${
  copiedIndex === i
    ? 'bg-emerald-500 text-white border-emerald-400'
    : 'bg-white/35 hover:bg-white/60 text-slate-700'
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
                                className="
text-xs

px-3 py-1.5

rounded-xl

bg-white/35
backdrop-blur-sm

border border-white/40

hover:bg-white/60

transition-all duration-150
"
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

h-8 w-8

rounded-xl

bg-white/35
backdrop-blur-sm

border border-white/40

hover:bg-white/60

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
      rounded-xl
bg-white/35
backdrop-blur-sm
border border-white/40
hover:bg-white/60
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
 ${
   m.role === 'assistant'
     ? 'w-fit max-w-full md:max-w-[820px]'
     : 'w-fit max-w-[75%] md:max-w-[380px]'
 }
  rounded-[2rem] px-6 py-5 md:px-7 md:py-6 whitespace-pre-line
transition-all duration-300
  ${m.role === 'assistant' ? softBubble : darkBubble}`}
                            style={{
                              WebkitUserSelect: 'text',
                              userSelect: 'text',
                              WebkitTouchCallout: 'default',
                            }}
                          >
                            <div
                              className={`text-[15px] leading-7 tracking-[0.01em] ${m.role === 'assistant' ? 'text-slate-800' : 'text-white'}`}
                            >
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
                          </div>
                        )}
                      {actionLoading && actionTargetIndex === i && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                          <ThinkingDots />
                          <span>Regenerating your answer...</span>
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
            </div>

            <div className="border-t border-white/70 bg-white/80 backdrop-blur-md p-5 md:p-6">
              <div className="flex items-end gap-3">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a figure skating question..."
                  className="
flex-1

rounded-[2rem]

bg-white/85
backdrop-blur-sm

border border-white/50

px-6 py-4

resize-none

shadow-[0_10px_40px_rgba(15,23,42,0.06)]

focus:outline-none
focus:border-white/70
focus:bg-white/55

transition-all duration-200
"
                />

                <button
                  onClick={sendMessage}
                  disabled={loading}
                  className="
h-12 px-7

rounded-[1.5rem]

bg-[linear-gradient(135deg,rgba(99,102,241,0.9),rgba(168,85,247,0.82))]

text-white
font-medium

shadow-[0_12px_35px_rgba(99,102,241,0.25)]

hover:scale-[1.03]
hover:shadow-[0_18px_45px_rgba(99,102,241,0.32)]

active:scale-[0.98]

transition-all duration-200
"
                >
                  {loading ? '...' : 'Send'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-[380px] rounded-[2rem] bg-white/86 backdrop-blur-2xl p-8 shadow-[0_30px_100px_rgba(15,23,42,0.22)] border border-white/80">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  Profile
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Update your skating profile.
                </p>
              </div>

              <button
                onClick={() => setProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="First name"
                value={authFirstName}
                onChange={(e) => setAuthFirstName(e.target.value)}
                className="
          w-full
          rounded-xl
          border border-slate-300
          px-4 py-3
          focus:outline-none focus:ring-2 focus:ring-slate-200
          "
              />

              <input
                type="text"
                placeholder="Last name (optional)"
                value={authLastName}
                onChange={(e) => setAuthLastName(e.target.value)}
                className="
          w-full
          rounded-xl
          border border-slate-300
          px-4 py-3
          focus:outline-none focus:ring-2 focus:ring-slate-200
          "
              />

              <div className="pt-2">
                <p className="text-sm font-medium text-slate-700 mb-3">
                  Skating level
                </p>

                <div className="space-y-2">
                  <label
                    title="New skater or learning basic skating skills"
                    className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 hover:bg-slate-50"
                  >
                    <input
                      type="radio"
                      value="beginner"
                      checked={skaterLevel === 'beginner'}
                      onChange={(e) => setSkaterLevel(e.target.value)}
                    />

                    <span className="text-sm text-slate-700">Beginner</span>
                  </label>

                  <label
                    title="Typically passed Juvenile level or Adult Gold level"
                    className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 hover:bg-slate-50"
                  >
                    <input
                      type="radio"
                      value="intermediate"
                      checked={skaterLevel === 'intermediate'}
                      onChange={(e) => setSkaterLevel(e.target.value)}
                    />

                    <span className="text-sm text-slate-700">Intermediate</span>
                  </label>

                  <label
                    title="Typically passed Novice level or higher"
                    className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 hover:bg-slate-50"
                  >
                    <input
                      type="radio"
                      value="advanced"
                      checked={skaterLevel === 'advanced'}
                      onChange={(e) => setSkaterLevel(e.target.value)}
                    />

                    <span className="text-sm text-slate-700">Advanced</span>
                  </label>

                  <label
                    title="Parent, fan, or non-skating user"
                    className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 hover:bg-slate-50"
                  >
                    <input
                      type="radio"
                      value="non_skater"
                      checked={skaterLevel === 'non_skater'}
                      onChange={(e) => setSkaterLevel(e.target.value)}
                    />

                    <span className="text-sm text-slate-700">Non-skater</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4 pt-3">
                <input
                  type="text"
                  placeholder="Highest jump (optional)"
                  value={highestJump}
                  onChange={(e) => setHighestJump(e.target.value)}
                  className="
      w-full
      rounded-xl
      border border-slate-300
      px-4 py-3
      focus:outline-none focus:ring-2 focus:ring-slate-200
    "
                />

                <input
                  type="text"
                  placeholder="Highest test level (optional)"
                  value={highestTestLevel}
                  onChange={(e) => setHighestTestLevel(e.target.value)}
                  className="
      w-full
      rounded-xl
      border border-slate-300
      px-4 py-3
      focus:outline-none focus:ring-2 focus:ring-slate-200
    "
                />
              </div>

              <button
                onClick={async () => {
                  if (!session?.user?.id) return

                  const { error } = await supabase.from('profiles').upsert({
                    id: session.user.id,
                    email: session.user.email,
                    first_name: authFirstName,
                    last_name: authLastName,
                    skater_level: skaterLevel,
                    highest_jump: highestJump,
                    highest_test_level: highestTestLevel,
                    updated_at: new Date().toISOString(),
                  })

                  if (error) {
                    alert(error.message)
                    return
                  }

                  setProfileModalOpen(false)
                  showToast('✓ Profile saved')
                }}
                className="
          w-full
          rounded-xl
          bg-slate-800
          text-white
          py-3
          font-medium
          hover:bg-slate-700
          transition-all
          "
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {profileUpdateCandidate && (
        <div
          className="
    fixed bottom-6 right-6 z-[90]

    w-[340px]

    rounded-2xl
    border border-slate-200
    bg-white

    shadow-2xl

    p-5

    animate-[fadeIn_0.2s_ease]
    "
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Possible profile update
              </h3>

              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                WarmGPT noticed a possible skating progression update.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                {fieldLabel(profileUpdateCandidate.field)}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">
                  {profileUpdateCandidate.old_value}
                </span>

                <span className="text-slate-400">→</span>

                <span className="font-semibold text-slate-800">
                  {profileUpdateCandidate.new_value}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setProfileUpdateCandidate(null)
                }}
                className="
          px-4 py-2
          text-sm
          rounded-xl
          border border-slate-300
          hover:bg-slate-100
          transition-all
          "
              >
                Dismiss
              </button>

              <button
                onClick={async () => {
                  try {
                    const {
                      data: { session },
                    } = await supabase.auth.getSession()

                    const accessToken = session?.access_token

                    const res = await fetch(
                      `${process.env.NEXT_PUBLIC_CHAT_API_URL}/profile/update`,
                      {
                        method: 'POST',

                        headers: {
                          'Content-Type': 'application/json',

                          Authorization: `Bearer ${accessToken}`,
                        },

                        body: JSON.stringify({
                          field: profileUpdateCandidate.field,

                          new_value: profileUpdateCandidate.new_value,
                        }),
                      }
                    )

                    const data = await res.json()

                    if (!data.success) {
                      alert(data.error || 'Update failed')
                      return
                    }

                    // optimistic frontend update

                    if (profileUpdateCandidate.field === 'highest_jump') {
                      setHighestJump(profileUpdateCandidate.new_value)
                    }

                    showToast('✓ Profile updated')

                    setProfileUpdateCandidate(null)
                  } catch (err) {
                    console.error(err)

                    alert('Profile update failed')
                  }
                }}
                className="
          px-4 py-2
          text-sm
          rounded-xl
          bg-slate-800
          text-white
          hover:bg-slate-700
          transition-all
          "
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div
          className="
    fixed inset-0 z-[100]
    flex items-center justify-center
    pointer-events-none
    "
        >
          <div
            className="
      px-5 py-3

      rounded-2xl

      bg-slate-800/95
      backdrop-blur-sm

      text-white text-sm font-medium

      shadow-2xl
      border border-slate-700

      animate-[fadeIn_0.2s_ease]
      "
          >
            {toastMessage}
          </div>
        </div>
      )}

      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[380px] rounded-2xl bg-white p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  Welcome to WarmGPT
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Save your skating profile and conversations.
                </p>
              </div>

              <button
                onClick={() => setAuthModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="flex rounded-xl bg-slate-100 p-1 mb-5">
              <button
                onClick={() => setAuthMode('login')}
                className={`
    flex-1 rounded-lg py-2 text-sm font-medium transition-all
    ${
      authMode === 'login'
        ? 'bg-white shadow-sm text-slate-800'
        : 'text-slate-500'
    }
    `}
              >
                Sign In
              </button>

              <button
                onClick={() => setAuthMode('signup')}
                className={`
    flex-1 rounded-lg py-2 text-sm font-medium transition-all
    ${
      authMode === 'signup'
        ? 'bg-white shadow-sm text-slate-800'
        : 'text-slate-500'
    }
    `}
              >
                Create Account
              </button>
            </div>

            <div className="space-y-4">
              {authMode === 'signup' && (
                <>
                  <input
                    type="text"
                    placeholder="First name"
                    value={authFirstName}
                    onChange={(e) => setAuthFirstName(e.target.value)}
                    className="
  w-full
  rounded-xl
  border border-slate-300
  px-4 py-3
  focus:outline-none focus:ring-2 focus:ring-slate-200
  "
                  />

                  <input
                    type="text"
                    placeholder="Last name (optional)"
                    value={authLastName}
                    onChange={(e) => setAuthLastName(e.target.value)}
                    className="
  w-full
  rounded-xl
  border border-slate-300
  px-4 py-3
  focus:outline-none focus:ring-2 focus:ring-slate-200
  "
                  />
                </>
              )}

              <input
                type="email"
                placeholder="Email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="
          w-full
          rounded-xl
          border border-slate-300
          px-4 py-3
          focus:outline-none focus:ring-2 focus:ring-slate-200
          "
              />

              <input
                type="password"
                placeholder="Password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="
          w-full
          rounded-xl
          border border-slate-300
          px-4 py-3
          focus:outline-none focus:ring-2 focus:ring-slate-200
          "
              />

              {authMode === 'signup' && (
                <>
                  <div className="pt-2">
                    <p className="text-sm font-medium text-slate-700 mb-3">
                      What best describes your skating level?
                    </p>

                    <div className="space-y-2">
                      <label
                        title="New skater or learning basic skating skills"
                        className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 hover:bg-slate-50"
                      >
                        <input
                          type="radio"
                          value="beginner"
                          checked={skaterLevel === 'beginner'}
                          onChange={(e) => setSkaterLevel(e.target.value)}
                        />

                        <span className="text-sm text-slate-700">Beginner</span>
                      </label>

                      <label
                        title="Typically passed Juvenile level or Adult Gold level"
                        className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 hover:bg-slate-50"
                      >
                        <input
                          type="radio"
                          value="intermediate"
                          checked={skaterLevel === 'intermediate'}
                          onChange={(e) => setSkaterLevel(e.target.value)}
                        />

                        <span className="text-sm text-slate-700">
                          Intermediate
                        </span>
                      </label>

                      <label
                        title="Typically passed Novice level or higher"
                        className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 hover:bg-slate-50"
                      >
                        <input
                          type="radio"
                          value="advanced"
                          checked={skaterLevel === 'advanced'}
                          onChange={(e) => setSkaterLevel(e.target.value)}
                        />

                        <span className="text-sm text-slate-700">Advanced</span>
                      </label>

                      <label
                        title="Parent, fan, or non-skating user"
                        className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 hover:bg-slate-50"
                      >
                        <input
                          type="radio"
                          value="non_skater"
                          checked={skaterLevel === 'non_skater'}
                          onChange={(e) => setSkaterLevel(e.target.value)}
                        />

                        <span className="text-sm text-slate-700">
                          Non-skater
                        </span>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-4 pt-3">
                    <input
                      type="text"
                      placeholder="Highest jump (optional)"
                      value={highestJump}
                      onChange={(e) => setHighestJump(e.target.value)}
                      className="
      w-full
      rounded-xl
      border border-slate-300
      px-4 py-3
      focus:outline-none focus:ring-2 focus:ring-slate-200
    "
                    />

                    <input
                      type="text"
                      placeholder="Highest test level (optional)"
                      value={highestTestLevel}
                      onChange={(e) => setHighestTestLevel(e.target.value)}
                      className="
      w-full
      rounded-xl
      border border-slate-300
      px-4 py-3
      focus:outline-none focus:ring-2 focus:ring-slate-200
    "
                    />
                  </div>
                </>
              )}

              {authMode === 'login' ? (
                <button
                  onClick={handleLogin}
                  className="
    w-full
    rounded-xl
    bg-slate-800
    text-white
    py-3
    font-medium
    hover:bg-slate-700
    transition-all
    "
                >
                  Sign In
                </button>
              ) : (
                <button
                  onClick={handleSignup}
                  className="
    w-full
    rounded-xl
    bg-slate-800
    text-white
    py-3
    font-medium
    hover:bg-slate-700
    transition-all
    "
                >
                  Create Account
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
