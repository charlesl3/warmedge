'use client'

import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import Typewriter from '../components/Typewriter'
import { supabase } from '../lib/supabase'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import AssistantAvatar from '../../components/AssistantAvatar'
import SkaterLevelSelector from '../../components/SkaterLevelSelector'
import GlassSelect from '../../components/GlassSelect'
import { fromZonedTime } from 'date-fns-tz'

import {
  appShell,
  glass,
  glassStrong,
  portalCard,
  darkBubble,
  softBubble,
  iconBtn,
  navBtn,
  pillBtn,
  hoverTooltip,
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
  content: `Hi, I am WarmGPT, your AI assistant for figure skating. You can ask me about figure skating technique, equipment, USFSA tests, and daily skating questions.`,
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
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [userTimezone, setUserTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  )

  const [tempTimezone, setTempTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  )

  useEffect(() => {
    const savedTimezone = localStorage.getItem('warmgpt_timezone')

    if (savedTimezone) {
      setUserTimezone(savedTimezone)
      setTempTimezone(savedTimezone)
    } else {
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

      setUserTimezone(browserTimezone)
      setTempTimezone(browserTimezone)

      localStorage.setItem('warmgpt_timezone', browserTimezone)
    }
  }, [])

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
  const [practiceFocus, setPracticeFocus] = useState<string[]>([])
  const [editingSessionDate, setEditingSessionDate] = useState<string | null>(
    null
  )

  const formatLessonRange = (lesson: any) => {
    const start = new Date(lesson.lesson_datetime)

    const startText = start.toLocaleTimeString([], {
      timeZone: userTimezone,
      hour: 'numeric',
      minute: '2-digit',
    })

    if (!lesson.duration_minutes) {
      return `${startText} - ??`
    }

    const end = new Date(start.getTime() + lesson.duration_minutes * 60000)

    const endText = end.toLocaleTimeString([], {
      timeZone: userTimezone,
      hour: 'numeric',
      minute: '2-digit',
    })

    return `${startText} - ${endText}`
  }

  const [editingNoteText, setEditingNoteText] = useState('')
  const [editingHours, setEditingHours] = useState('')
  const [sessionDirty, setSessionDirty] = useState(false)
  const [editingPracticeFocus, setEditingPracticeFocus] = useState<string[]>([])
  const [sessionsPage, setSessionsPage] = useState(1)

  const SESSIONS_PER_PAGE = 5
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [statsRange, setStatsRange] = useState<'week' | 'month' | 'year'>(
    'year'
  )
  const [activeView, setActiveView] = useState<
    | 'chat'
    | 'blade_tracker'
    | 'skater_summary'
    | 'coach_portal'
    | 'student_profile'
  >('chat')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null
  )

  const [flippedStudentId, setFlippedStudentId] = useState<string | null>(null)

  const [coachStudents, setCoachStudents] = useState<any[]>([])
  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [addLessonOpen, setAddLessonOpen] = useState(false)

  const [lessonStudentId, setLessonStudentId] = useState('')
  const hasStartedChat = messages.some((m) => m.role === 'user')

  const [lessonDate, setLessonDate] = useState('')

  const [lessonTime, setLessonTime] = useState('')
  const [lessonDuration, setLessonDuration] = useState('')
  const [deleteStudentModalOpen, setDeleteStudentModalOpen] = useState(false)
  const DEFAULT_TIMEZONE = 'America/New_York'

  const [studentPendingDelete, setStudentPendingDelete] = useState<any>(null)
  const [newStudentName, setNewStudentName] = useState('')
  const [newStudentLevel, setNewStudentLevel] = useState('')

  const [movesLevel, setMovesLevel] = useState('')
  const [freeskateLevel, setFreeskateLevel] = useState('')
  const [danceLevel, setDanceLevel] = useState('')
  const [studentTrack, setStudentTrack] = useState<'adult' | 'regular'>('adult')
  const addStudentTrackRef = useRef(studentTrack)

  useEffect(() => {
    if (addStudentTrackRef.current === studentTrack) return

    addStudentTrackRef.current = studentTrack

    setMovesLevel('')
    setFreeskateLevel('')
    setDanceLevel('')
  }, [studentTrack])
  const ADULT_LEVELS = [
    'Not specified',
    'Pre-Bronze',
    'Bronze',
    'Silver',
    'Gold',
    'Intermediate',
    'Novice',
    'Junior',
    'Senior',
  ]

  const REGULAR_LEVELS = [
    'Not specified',
    'Pre-Preliminary',
    'Preliminary',
    'Pre-Bronze',
    'Bronze',
    'Pre-Silver',
    'Silver',
    'Pre-Gold',
    'Gold',
  ]

  const CURRENT_LEVELS =
    studentTrack === 'adult' ? ADULT_LEVELS : REGULAR_LEVELS

  const [coachStudentSaving, setCoachStudentSaving] = useState(false)

  const selectedStudent =
    coachStudents.find((s) => s.id === selectedStudentId) || null

  const [editingMovesLevel, setEditingMovesLevel] = useState('')
  const [editingFreeskateLevel, setEditingFreeskateLevel] = useState('')
  const [studentLevelSaving, setStudentLevelSaving] = useState(false)
  const [editingDanceLevel, setEditingDanceLevel] = useState('')
  const [editingStudentTrack, setEditingStudentTrack] = useState<
    'adult' | 'regular'
  >('adult')

  useEffect(() => {
    if (!selectedStudent) return

    setEditingStudentTrack(selectedStudent.track || 'adult')
    setEditingMovesLevel(selectedStudent.moves_level || '')
    setEditingFreeskateLevel(selectedStudent.freeskate_level || '')
    setEditingDanceLevel(selectedStudent.dance_level || '')
  }, [selectedStudent])

  const previousTrackRef = useRef(editingStudentTrack)

  useEffect(() => {
    if (previousTrackRef.current === editingStudentTrack) return

    previousTrackRef.current = editingStudentTrack

    setEditingMovesLevel('')
    setEditingFreeskateLevel('')
    setEditingDanceLevel('')
  }, [editingStudentTrack])
  const studentInputClass = `
w-full
px-4 py-3

rounded-2xl

bg-white/75
backdrop-blur-md

border border-white/70

text-slate-700

focus:outline-none
focus:border-sky-200

transition-all
`

  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null)

  const [coachLessons, setCoachLessons] = useState<any[]>([])

  const studentLessons = coachLessons.filter(
    (lesson) => lesson.student_id === selectedStudentId
  )
  useEffect(() => {
    if (studentLessons.length > 0 && !expandedLessonId) {
      setExpandedLessonId(studentLessons[0].id)
    }
  }, [selectedStudentId])

  const isSameLessonDay = (lessonDate: string, timezone: string) => {
    const lesson = new Date(lessonDate)

    const lessonDay = lesson.toLocaleDateString('en-CA', {
      timeZone: timezone,
    })

    const todayDay = new Date().toLocaleDateString('en-CA', {
      timeZone: timezone,
    })

    return lessonDay === todayDay
  }

  const todaysLessons = coachLessons.filter((lesson) =>
    isSameLessonDay(lesson.lesson_datetime, userTimezone)
  )

  const now = new Date()

  const upcomingLessons = studentLessons.filter(
    (lesson) => new Date(lesson.lesson_datetime) > now
  )

  const lessonHistory = studentLessons.filter(
    (lesson) => new Date(lesson.lesson_datetime) <= now
  )

  const formatLessonPreview = (lesson: any) => {
    const d = new Date(lesson.lesson_datetime)

    return d.toLocaleString([], {
      timeZone: userTimezone,

      month: 'short',
      day: 'numeric',

      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getNextLessonForStudent = (studentId: string) => {
    const nextLesson = coachLessons
      .filter(
        (lesson) =>
          lesson.student_id === studentId &&
          new Date(lesson.lesson_datetime) > now
      )
      .sort(
        (a, b) =>
          new Date(a.lesson_datetime).getTime() -
          new Date(b.lesson_datetime).getTime()
      )[0]

    return nextLesson ? formatLessonPreview(nextLesson) : null
  }

  const getUpcomingLessonsForStudent = (studentId: string, limit = 3) => {
    return coachLessons
      .filter(
        (lesson) =>
          lesson.student_id === studentId &&
          new Date(lesson.lesson_datetime) > now
      )
      .sort(
        (a, b) =>
          new Date(a.lesson_datetime).getTime() -
          new Date(b.lesson_datetime).getTime()
      )
      .slice(0, limit)
  }

  const getCurrentWeekLessonCounts = () => {
    const now = new Date()

    const monday = new Date(now)

    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))

    monday.setHours(0, 0, 0, 0)

    const sunday = new Date(monday)

    sunday.setDate(monday.getDate() + 7)

    const counts = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    }

    coachLessons.forEach((lesson) => {
      const d = new Date(lesson.lesson_datetime)

      if (d >= monday && d < sunday) {
        const day = d.toLocaleDateString('en-US', {
          weekday: 'short',
        })

        if (counts[day as keyof typeof counts] !== undefined) {
          counts[day as keyof typeof counts]++
        }
      }
    })

    return counts
  }

  const [reloading, setReloading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null)
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set())
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionStatusText, setActionStatusText] = useState('')
  const [finishedTypingIndex, setFinishedTypingIndex] = useState<number | null>(
    null
  )
  const [actionTargetIndex, setActionTargetIndex] = useState<number | null>(
    null
  )

  const [skaterSummary, setSkaterSummary] = useState('')

  const progressStats = (() => {
    const sessions = bladeTracker?.sessions || []

    const totalSessions = sessions.length

    const totalHours = sessions.reduce(
      (sum: number, s: any) => sum + Number(s.hours || 0),
      0
    )

    const hasSharpeningDate = Boolean(bladeTracker?.last_sharpened_at)

    const hoursSinceSharpening = Number(
      bladeTracker?.hours_since_sharpening || 0
    )

    // Average blade-quality decay model.
    // This is not exact physics; it is a practical skating estimate.
    // Score = 100 * exp(-hoursSinceSharpening / 50)
    const bladeQualityScore = hasSharpeningDate
      ? Math.max(
          0,
          Math.min(100, Math.round(100 * Math.exp(-hoursSinceSharpening / 50)))
        )
      : null

    const bladeQualityLabel =
      bladeQualityScore === null
        ? 'Not tracked'
        : bladeQualityScore >= 80
          ? 'Fresh'
          : bladeQualityScore >= 60
            ? 'Good'
            : bladeQualityScore >= 40
              ? 'Wearing'
              : 'Low'

    let nextMilestone = 10

    if (totalHours >= 10) nextMilestone = 25
    if (totalHours >= 25) nextMilestone = 50
    if (totalHours >= 50) nextMilestone = 100
    if (totalHours >= 100) nextMilestone = 250
    if (totalHours >= 250) nextMilestone = 500
    if (totalHours >= 500) nextMilestone = 1000

    const weekCounts: Record<string, number> = {}

    sessions.forEach((s: any) => {
      const d = new Date(s.session_date)

      const monday = new Date(d)

      monday.setHours(12, 0, 0, 0)

      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))

      const weekKey = `${monday.getFullYear()}-${
        monday.getMonth() + 1
      }-${monday.getDate()}`

      weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1
    })

    // current week Monday
    const currentMonday = new Date()

    currentMonday.setHours(0, 0, 0, 0)

    currentMonday.setDate(
      currentMonday.getDate() - ((currentMonday.getDay() + 6) % 7)
    )

    const currentWeekKey = `${currentMonday.getFullYear()}-${
      currentMonday.getMonth() + 1
    }-${currentMonday.getDate()}`

    // exclude current unfinished week
    const weeks = Object.keys(weekCounts)
      .filter((week) => week !== currentWeekKey)
      .sort()
      .reverse()

    let weeklyStreak = 0

    for (const week of weeks) {
      if (weekCounts[week] >= 3) {
        weeklyStreak++
      } else {
        break
      }
    }

    return {
      weeklyStreak,
      totalSessions,
      totalHours,
      nextMilestone,
      hoursSinceSharpening,
      hasSharpeningDate,
      bladeQualityScore,
      bladeQualityLabel,
    }
  })()

  const [summaryLoading, setSummaryLoading] = useState(false)

  const [skaterIdentityLabels, setSkaterIdentityLabels] = useState<string[]>([])
  const [quickSkateOpen, setQuickSkateOpen] = useState(false)

  const [quickSkateIdea, setQuickSkateIdea] = useState(' ')

  const [quickSkateLoading, setQuickSkateLoading] = useState(false)
  const [identityLoading, setIdentityLoading] = useState(false)

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
        setMessages([])
      }
    }
  }

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const calendarAreaRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)

      if (data.session?.user?.id) {
        loadProfile(data.session.user.id)

        loadBladeTracker()
        loadCoachStudents()
        loadCoachLessons()
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)

      if (session?.user?.id) {
        loadProfile(session.user.id)

        loadBladeTracker()
        loadCoachStudents()
        loadCoachLessons()
      } else {
        setBladeTracker(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth

      const mobile = width < 768
      const tablet = width >= 768 && width < 1200

      setIsMobile(mobile)
      setIsTablet(tablet)

      // desktop default open
      if (!mobile) {
        setSidebarOpen(true)
      }
    }

    checkDevice()

    window.addEventListener('resize', checkDevice)

    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  useEffect(() => {
    const saved = sessionStorage.getItem('warmgpt_chats')

    if (!saved) {
      setMessages([])
      return
    }

    try {
      const parsed: ChatSession[] = JSON.parse(saved)

      if (parsed.length === 0) {
        setMessages([])
        return
      }

      setChatSessions(parsed)
      setCurrentChatId(parsed[0].id)
      setMessages(parsed[0].messages)
    } catch (err) {
      console.error('Failed loading chats', err)
      setMessages([])
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
        console.log('BLADE TRACKER RESPONSE:', data.tracker)

        console.log('SESSIONS:', data.tracker?.sessions)

        setBladeTracker(data.tracker)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setTrackerLoading(false)
    }
  }

  const loadCoachStudents = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/coach/students`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      const data = await res.json()

      if (data.success) {
        setCoachStudents(data.students)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const loadCoachLessons = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/coach/lessons`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      const data = await res.json()

      if (data.success) {
        setCoachLessons(data.lessons)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateCoachStudent = async () => {
    if (!newStudentName.trim()) {
      showToast('Student name is required')
      return
    }

    try {
      setCoachStudentSaving(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/coach/students`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name: newStudentName.trim(),

            track: studentTrack,

            moves_level: movesLevel,
            freeskate_level: freeskateLevel,
            dance_level: danceLevel,
          }),
        }
      )

      const data = await res.json()

      if (data.success) {
        setNewStudentName('')
        setNewStudentLevel('')
        setAddStudentOpen(false)
        await loadCoachStudents()
        showToast('Student added')
      } else {
        showToast(data.error || 'Could not add student')
      }
    } catch (err) {
      console.error(err)
      showToast('Could not add student')
    } finally {
      setCoachStudentSaving(false)
    }
  }

  const handleDeleteCoachStudent = async (studentId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/coach/students/${studentId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      const data = await res.json()

      if (data.success) {
        if (selectedStudentId === studentId) {
          setSelectedStudentId(null)
          setActiveView('coach_portal')
        }

        setDeleteStudentModalOpen(false)
        setStudentPendingDelete(null)

        await loadCoachStudents()
        showToast('Student deleted')
      } else {
        showToast(data.error || 'Could not delete student')
      }
    } catch (err) {
      console.error(err)
      showToast('Could not delete student')
    }
  }

  const handleSaveStudentLevels = async () => {
    if (!selectedStudent) return

    try {
      setStudentLevelSaving(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/coach/students/${selectedStudent.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            track: editingStudentTrack,
            moves_level: editingMovesLevel,
            freeskate_level: editingFreeskateLevel,
            dance_level: editingDanceLevel,
          }),
        }
      )

      const data = await res.json()

      if (data.success) {
        await loadCoachStudents()
        showToast('Student updated')
      } else {
        showToast(data.error || 'Could not update student')
      }
    } catch (err) {
      console.error(err)
      showToast('Could not update student')
    } finally {
      setStudentLevelSaving(false)
    }
  }

  const handleCreateLesson = async () => {
    if (!lessonStudentId || !lessonDate || !lessonTime) {
      showToast('Missing lesson info')
      return
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token
      const lessonDatetime = fromZonedTime(
        `${lessonDate} ${lessonTime}`,
        userTimezone
      ).toISOString()

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/coach/lessons`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            student_id: lessonStudentId,
            lesson_datetime: lessonDatetime,
            timezone: userTimezone,

            duration_minutes:
              lessonDuration === '' ? null : parseInt(lessonDuration),
          }),
        }
      )

      const data = await res.json()

      if (data.success) {
        setAddLessonOpen(false)

        setLessonStudentId('')
        setLessonDate('')
        setLessonTime('')
        setLessonDuration('')

        await loadCoachLessons()

        showToast('Lesson created')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleGenerateSkaterSummary = async () => {
    try {
      setSummaryLoading(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/skater-summary`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      const data = await res.json()

      if (data.success) {
        setSkaterSummary(data.summary)
      } else {
        setSkaterSummary('Could not generate summary yet.')
      }
    } catch (err) {
      console.error(err)
      setSkaterSummary('Something went wrong while generating your summary.')
    } finally {
      setSummaryLoading(false)
    }
  }

  const handleGenerateSkaterIdentity = async () => {
    try {
      setIdentityLoading(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/skater-identity`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      const data = await res.json()

      if (data.success && Array.isArray(data.labels)) {
        setSkaterIdentityLabels(data.labels)
      } else {
        setSkaterIdentityLabels(['Emerging Skater', 'Curious Observer'])
      }
    } catch (err) {
      console.error(err)
      setSkaterIdentityLabels(['Emerging Skater', 'Future Pattern Finder'])
    } finally {
      setIdentityLoading(false)
    }
  }

  const handleQuickSkateIdea = async () => {
    try {
      setQuickSkateLoading(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/quick-skate-idea`,
        {
          method: 'POST',
          headers: {
            Authorization: accessToken ? `Bearer ${accessToken}` : '',
          },
        }
      )

      const data = await res.json()

      if (data.success) {
        setQuickSkateIdea(data.idea)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setQuickSkateLoading(false)
    }
  }

  const togglePracticeFocus = (focus: string) => {
    // existing logged session → edit mode
    if (selectedSession) {
      if (editingSessionDate !== selectedDate) {
        setEditingSessionDate(selectedDate)

        setEditingHours(String(selectedSession.hours || ''))

        setEditingNoteText(selectedSession.note || '')

        setEditingPracticeFocus(selectedSession.practice_focus || [])
      }

      setEditingPracticeFocus((prev) =>
        prev.includes(focus)
          ? prev.filter((item) => item !== focus)
          : [...prev, focus]
      )

      setSessionDirty(true)

      return
    }

    // new session
    setPracticeFocus((prev) =>
      prev.includes(focus)
        ? prev.filter((item) => item !== focus)
        : [...prev, focus]
    )
  }

  const handleLogSession = async () => {
    const existingSession = bladeTracker?.sessions?.find(
      (s: any) => s.session_date === selectedDate
    )

    if (!sessionHours && existingSession) {
      if (!selectedDate) return

      await handleDeleteSession(selectedDate)
      setSessionHours('')
      setSessionNote('')
      setPracticeFocus([])
      showToast(' Session removed')
      return
    }

    if (!sessionHours) return

    const numericHours = parseFloat(sessionHours)

    // 0 hrs behavior
    if (numericHours === 0) {
      // existing record → delete it
      if (existingSession && selectedDate) {
        await handleDeleteSession(selectedDate)

        setSessionHours('')

        showToast(' Session removed')
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
            practice_focus: practiceFocus,
          }),
        }
      )

      const data = await res.json()

      if (data.success) {
        setBladeTracker(data.tracker)
        showToast(' Session logged')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSessionLoggingLoading(false)
    }
  }

  const handleSharpened = async (dateOverride?: string | null) => {
    console.log('SHARPEN CLICKED')

    const finalDate = dateOverride || selectedDate

    console.log('FINAL DATE =', finalDate)

    if (!finalDate) {
      console.error('NO DATE SELECTED')
      showToast('Select a date first')
      return
    }

    try {
      setSharpeningLoading(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token
      console.log('SELECTED DATE:', selectedDate)

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/blade-tracker/sharpened`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            sharpened_at: finalDate,
          }),
        }
      )

      const data = await res.json()

      if (data.success) {
        console.log('SHARPEN RESPONSE:', data)

        // force refresh from backend truth
        await loadBladeTracker()

        showToast(' Sharpening recorded')
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

        setEditingSessionDate(null)

        setEditingHours('')

        setEditingNoteText('')

        setEditingPracticeFocus([])

        setSessionDirty(false)
        showToast(' Session deleted')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveSessionEdit = async (sessionDate: string) => {
    try {
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
            session_date: sessionDate,

            hours: parseFloat(editingHours),

            note: editingNoteText,

            practice_focus: editingPracticeFocus,
          }),
        }
      )

      const data = await res.json()

      if (data.success) {
        setBladeTracker(data.tracker)

        setEditingSessionDate(null)

        setEditingHours('')

        setEditingNoteText('')

        setEditingPracticeFocus([])
        setSessionDirty(false)

        showToast(' Session updated')
      }
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

    setActionTargetIndex(index)
    setActionLoading(true)

    if (action === 'simplify') {
      setActionStatusText('Simplifying the explanation...')
    }

    if (action === 'deeper') {
      setActionStatusText('Thinking deeper about this...')
    }

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
- Stay fluid, conversational, and coaching-oriented.
- Use elegant conversational formatting.
- Markdown tables are STRICTLY FORBIDDEN.
- NEVER output lines like:
  | text | text |
- NEVER create spreadsheet-style layouts.
- NEVER generate table headers or alignment rows.
- If comparison is needed, use bullets or mini-sections instead.
- Prefer:
  • short titled sections
  • bullets
  • spacing
  • coaching-style flow
- Avoid:
  • report formatting
  • academic formatting
  • tables
  • matrix layouts
- Before finalizing:
  • scan for "|" characters
  • rewrite any table-like formatting into bullets
- The answer should feel like a premium skating coach explanation, not a technical document.

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
      setActionStatusText('')
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
    showToast(' Account created')
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
    showToast(' Signed in')
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

  const footprintDays = []

  for (let i = 364; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)

    const key = d.toISOString().split('T')[0]

    footprintDays.push({
      date: key,
      active: sessionDateSet.has(key),
    })
  }

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

  const selectedSession = bladeTracker?.sessions?.find(
    (s: any) => s.session_date === selectedDate
  )

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      const clickedCalendar =
        target.closest('.react-calendar') ||
        target.closest('.react-calendar__tile')

      if (
        calendarAreaRef.current &&
        !calendarAreaRef.current.contains(target) &&
        !clickedCalendar &&
        !target.closest('button')
      ) {
        setSelectedDate(null)

        setEditingSessionDate(null)
        setSessionDirty(false)

        setEditingHours('')
        setEditingNoteText('')
        setEditingPracticeFocus([])

        setSessionHours('')
        setSessionNote('')
        setPracticeFocus([])
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])
  useEffect(() => {
    if (selectedSession) {
      setSessionHours(String(selectedSession.hours || ''))
      setSessionNote(selectedSession.note || '')
      setPracticeFocus(selectedSession.practice_focus || [])
    } else {
      setSessionHours('')
      setSessionNote('')
      setPracticeFocus([])
    }
  }, [selectedDate, bladeTracker])

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
            Skating Tracker
          </button>

          <button
            onClick={() => {
              setActiveView('skater_summary')

              if (isMobile) {
                setSidebarOpen(false)
              }
            }}
            className={navBtn}
          >
            Skater Summary
          </button>

          <button
            onClick={() => {
              setActiveView('coach_portal')

              if (isMobile) {
                setSidebarOpen(false)
              }
            }}
            className={navBtn}
          >
            Coach Portal (coming soon)
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
relative z-30 isolate

flex items-center justify-between

px-5 py-4

bg-[linear-gradient(
135deg,
rgba(255,255,255,0.92),
rgba(239,246,255,0.86)
)]

backdrop-blur-2xl

border-b border-white/60

shadow-[0_12px_60px_rgba(14,165,233,0.08)]

overflow-visible
before:absolute
before:inset-0
before:pointer-events-none
before:-z-10

before:bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.92),transparent_22%),radial-gradient(circle_at_85%_10%,rgba(191,219,254,0.35),transparent_24%)]

after:absolute
after:inset-0
after:pointer-events-none
after:-z-10

after:bg-[linear-gradient(180deg,rgba(255,255,255,0.20),transparent)]
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

px-3 py-1.5

text-[11px]
font-medium
text-slate-600

bg-white/75
backdrop-blur-xl

border border-white/70

rounded-xl

shadow-[0_8px_30px_rgba(15,23,42,0.08)]

opacity-0
group-hover:opacity-100

transition-all duration-200

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

px-3 py-1.5

text-[11px]
font-medium
text-slate-600

bg-white/75
backdrop-blur-xl

border border-white/70

rounded-xl

shadow-[0_8px_30px_rgba(15,23,42,0.08)]

opacity-0
group-hover:opacity-100

transition-all duration-200

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

bg-[linear-gradient(
145deg,
rgba(255,255,255,0.72),
rgba(255,255,255,0.46)
)]

backdrop-blur-2xl

border border-sky-100/80

shadow-[0_10px_35px_rgba(15,23,42,0.05)]

hover:border-sky-100
hover:bg-white/78

hover:shadow-[0_14px_40px_rgba(14,165,233,0.12)]
overflow-visible
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

px-3 py-1.5

text-[11px]
font-medium
text-slate-600

bg-white/80
backdrop-blur-xl

border border-white/70

rounded-xl

shadow-[0_8px_30px_rgba(15,23,42,0.08)]

opacity-0
group-hover:opacity-100

transition-all duration-200

pointer-events-none
whitespace-nowrap
z-50
"
                  >
                    Edit your profile
                  </div>
                </div>

                <button
                  onClick={() => setSettingsOpen(true)}
                  className="
h-11 w-11

rounded-2xl

bg-[linear-gradient(
145deg,
rgba(255,255,255,0.72),
rgba(255,255,255,0.46)
)]

backdrop-blur-2xl

border border-sky-100/80

shadow-[0_10px_35px_rgba(15,23,42,0.05)]

hover:border-sky-100
hover:bg-white/78

hover:shadow-[0_14px_40px_rgba(14,165,233,0.12)]

transition-all duration-200
"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="w-5 h-5 text-slate-700 mx-auto"
                  >
                    <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5A3.5 3.5 0 0 0 12 15.5Z" />
                    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-.4-1.1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.8a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.1-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2.8a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 .4 1.1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.3.3.5.7.6 1.1h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-.6 1z" />
                  </svg>
                </button>

                <button
                  onClick={handleLogout}
                  className="
px-4 py-2

text-sm font-medium

rounded-2xl

bg-[linear-gradient(
145deg,
rgba(255,255,255,0.72),
rgba(255,255,255,0.46)
)]

backdrop-blur-2xl

border border-sky-100/80

shadow-[0_10px_35px_rgba(15,23,42,0.05)]

hover:border-rose-100
hover:bg-white/78

hover:shadow-[0_14px_40px_rgba(244,63,94,0.12)]

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
              <div
                className={`${glassStrong} rounded-[2rem] p-6 md:p-8 overflow-visible`}
              >
                <div className="mb-5">
                  <h2 className="text-2xl font-semibold text-slate-800">
                    Skating Tracker
                  </h2>

                  {/* <p className="mt-1 text-sm text-slate-500">
                    Sessions • Sharpening • Practice
                  </p> */}
                </div>

                {session && bladeTracker ? (
                  <>
                    <div
                      className="
mb-6

rounded-[1.75rem]

bg-[linear-gradient(
145deg,
rgba(255,255,255,0.72),
rgba(255,255,255,0.52)
)]

backdrop-blur-2xl

border border-white/70

shadow-[0_18px_45px_rgba(15,23,42,0.06)]

px-5 py-4
"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="text-sm text-slate-500">
                              Hours since sharpening
                            </div>

                            <div className="text-xs text-slate-400">
                              {Math.round(
                                (bladeTracker.hours_since_sharpening /
                                  bladeTracker.threshold_hours) *
                                  100
                              )}
                              % used
                            </div>
                          </div>

                          <div className="text-3xl font-bold text-slate-800 mt-1">
                            {bladeTracker.hours_since_sharpening} /{' '}
                            {bladeTracker.threshold_hours} hrs
                          </div>

                          <div className="mt-4 w-[320px]">
                            <div
                              className="
w-full
h-3

rounded-full

bg-slate-100

border border-slate-100

overflow-hidden

shadow-inner
"
                            >
                              <div
                                className={`
h-full

rounded-full

shadow-sm

transition-all duration-700

${
  bladeTracker.hours_since_sharpening >= bladeTracker.threshold_hours
    ? `
bg-gradient-to-r
from-red-500
to-rose-600
`
    : bladeTracker.hours_since_sharpening >= bladeTracker.threshold_hours * 0.8
      ? `
bg-gradient-to-r
from-amber-400
to-orange-500
`
      : `
bg-gradient-to-r
from-blue-500
to-indigo-600
`
}
`}
                                style={{
                                  width: `${Math.max(
                                    Math.min(
                                      (bladeTracker.hours_since_sharpening /
                                        bladeTracker.threshold_hours) *
                                        100,
                                      100
                                    ),
                                    bladeTracker.hours_since_sharpening > 0
                                      ? 6
                                      : 0
                                  )}%`,
                                }}
                              />
                            </div>

                            {/* <div className="mt-1 text-xs text-slate-400">
                              {bladeTracker.hours_since_sharpening >=
                                bladeTracker.threshold_hours && (
                                <div
                                  className="
mt-2

text-xs font-medium

text-rose-600

animate-pulse
"
                                >
                                  Blade sharpening overdue
                                </div>
                              )}
                              {bladeTracker.hours_since_sharpening >=
                                bladeTracker.threshold_hours * 0.8 &&
                                bladeTracker.hours_since_sharpening <
                                  bladeTracker.threshold_hours && (
                                  <div
                                    className="
mt-2

text-xs font-medium

text-amber-600
"
                                  >
                                    Approaching sharpening threshold
                                  </div>
                                )}
                              {Math.round(
                                (bladeTracker.hours_since_sharpening /
                                  bladeTracker.threshold_hours) *
                                  100
                              )}
                              % used
                            </div> */}
                          </div>

                          <div className="mt-2 text-sm text-slate-500">
                            Last sharpened:
                            <span className="ml-2 font-medium text-slate-700">
                              {bladeTracker.last_sharpened_at || 'Not recorded'}
                            </span>
                          </div>

                          {/* <div className="mt-2 text-[11px] text-slate-400">
                            Tap a date below to log or review skating sessions.
                          </div> */}
                        </div>

                        <div className="flex items-center">
                          <button
                            onClick={() => handleSharpened(selectedDate)}
                            disabled={sharpeningLoading}
                            className="
px-4 py-2

rounded-full

text-xs font-medium

bg-[linear-gradient(135deg,#60a5fa,#6366f1)]

text-white

shadow-[0_10px_30px_rgba(59,130,246,0.22)]

hover:opacity-90

transition-all

disabled:opacity-35
disabled:cursor-not-allowed
"
                          >
                            {sharpeningLoading
                              ? 'Recording...'
                              : 'Record Sharpening'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div ref={calendarAreaRef}>
                      <div className="mb-8">
                        <div className="mb-4">
                          <h3 className="font-semibold text-slate-800">
                            Select a date to track your skating progress
                          </h3>
                        </div>

                        <div
                          className="
rounded-2xl

border border-sky-100/80

bg-[linear-gradient(
145deg,
rgba(255,255,255,0.78),
rgba(255,255,255,0.58)
)]

backdrop-blur-md

shadow-[0_18px_50px_rgba(15,23,42,0.06)]

overflow-hidden

relative

before:absolute
before:inset-0
before:pointer-events-none

before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_35%)]

after:absolute
after:inset-0
after:pointer-events-none

after:bg-[linear-gradient(180deg,rgba(255,255,255,0.10),transparent)]

p-2 md:p-5

max-w-[520px]
mx-auto
"
                        >
                          <Calendar
                            className="warm-calendar calendar-hover-hours"
                            calendarType="gregory"
                            value={
                              selectedDate
                                ? new Date(selectedDate + 'T12:00:00')
                                : null
                            }
                            onChange={(value) => {
                              console.log('CALENDAR RAW VALUE:', value)

                              const d = Array.isArray(value) ? value[0] : value

                              if (!(d instanceof Date)) {
                                console.error('NOT A DATE:', d)
                                return
                              }

                              const yyyy = d.getFullYear()

                              const mm = String(d.getMonth() + 1).padStart(
                                2,
                                '0'
                              )

                              const dd = String(d.getDate()).padStart(2, '0')

                              const clickedDate = `${yyyy}-${mm}-${dd}`

                              console.log('SETTING DATE:', clickedDate)

                              setSelectedDate(clickedDate)
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

                              if (hours !== undefined && hours !== null) {
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

                              if (hours === undefined || hours === null)
                                return null

                              return (
                                <div
                                  className="
absolute
inset-0

group

flex items-center justify-center
"
                                >
                                  <div
                                    className="
absolute

top-7
left-1/2

-translate-x-1/2

px-3 py-1.5

rounded-xl

text-[11px]
font-semibold
text-slate-800

bg-[linear-gradient(
135deg,
rgba(255,255,255,0.96),
rgba(239,246,255,0.96)
)]

backdrop-blur-xl

border border-white/40

shadow-[0_12px_35px_rgba(59,130,246,0.18)]

opacity-0
group-hover:opacity-100

translate-y-1
group-hover:translate-y-0

transition-all
duration-200

whitespace-nowrap

z-50
"
                                  >
                                    {hours} hrs
                                  </div>
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
                            <div className="w-4 h-4 rounded bg-yellow-400" />
                            Sharpened
                          </div>
                        </div>

                        {selectedDate && (
                          <div
                            className="
mt-8

bg-white/78

border border-white/70

shadow-[0_18px_50px_rgba(15,23,42,0.06)]

rounded-[2rem]

p-5 md:p-6

animate-[fadeUp_0.25s_ease]
"
                          >
                            <div className="flex items-start justify-between gap-4 mb-6">
                              <div>
                                <h3 className="text-lg font-semibold text-slate-800">
                                  {selectedDate}
                                </h3>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                {selectedSession ? (
                                  <>
                                    {/* <div
                                    className="
px-3 py-1.5

rounded-full

text-xs font-medium

bg-emerald-50/80
border border-emerald-100

text-emerald-700
"
                                  >
                                    Session Logged
                                  </div> */}

                                    {editingSessionDate === selectedDate &&
                                      sessionDirty && (
                                        <>
                                          <button
                                            onClick={() =>
                                              handleSaveSessionEdit(
                                                selectedDate
                                              )
                                            }
                                            className="
px-3 py-1.5
rounded-full
text-xs font-medium
bg-[linear-gradient(135deg,#60a5fa,#6366f1)]
text-white
hover:opacity-90
transition-all
"
                                          >
                                            Save
                                          </button>

                                          <button
                                            onClick={() => {
                                              setEditingSessionDate(null)

                                              setEditingHours('')

                                              setEditingNoteText('')

                                              setEditingPracticeFocus([])

                                              setSessionDirty(false)
                                            }}
                                            className="
px-3 py-1.5
rounded-full
text-xs font-medium
bg-slate-100
text-slate-600
border border-slate-200
hover:bg-slate-200
transition-all
"
                                          >
                                            Cancel
                                          </button>
                                        </>
                                      )}

                                    <button
                                      onClick={() =>
                                        handleDeleteSession(selectedDate)
                                      }
                                      className="
px-3 py-1.5

rounded-full

text-xs font-medium

bg-rose-50
text-rose-600

border border-rose-100

hover:bg-rose-100

transition-all
"
                                    >
                                      Delete
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={handleLogSession}
                                    disabled={
                                      sessionLoggingLoading || !sessionHours
                                    }
                                    className="
px-4 py-2

rounded-full

text-xs font-medium

bg-[linear-gradient(135deg,#60a5fa,#6366f1)]

text-white

shadow-[0_10px_30px_rgba(59,130,246,0.22)]

disabled:opacity-40

transition-all
"
                                  >
                                    {sessionLoggingLoading
                                      ? 'Logging...'
                                      : 'Log Session'}
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="grid lg:grid-cols-[220px_1fr] gap-7 items-start">
                              <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                  Hours
                                </label>

                                <input
                                  type="number"
                                  step="0.5"
                                  value={
                                    editingSessionDate === selectedDate
                                      ? editingHours
                                      : sessionHours
                                  }
                                  onChange={(e) => {
                                    if (editingSessionDate === selectedDate) {
                                      setEditingHours(e.target.value)
                                      setSessionDirty(true)
                                    } else if (selectedSession) {
                                      setEditingSessionDate(selectedDate)

                                      setEditingHours(e.target.value)

                                      setEditingNoteText(
                                        selectedSession.note || ''
                                      )

                                      setEditingPracticeFocus(
                                        selectedSession.practice_focus || []
                                      )

                                      setSessionDirty(true)
                                    } else {
                                      setSessionHours(e.target.value)
                                    }
                                  }}
                                  placeholder="0"
                                  className="
w-full

rounded-2xl

bg-white/88
backdrop-blur-sm

border border-white/70

px-4 py-3

text-slate-700

shadow-[0_8px_24px_rgba(15,23,42,0.04)]

focus:outline-none
focus:border-sky-200
focus:bg-white/72

transition-all duration-200
"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                  Focus
                                </label>

                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => togglePracticeFocus('Jumps')}
                                    className={`
${pillBtn}
px-3 py-2 text-xs font-medium
hover:-translate-y-[1px]
transition-all duration-200
${
  (editingSessionDate === selectedDate
    ? editingPracticeFocus
    : practiceFocus
  ).includes('Jumps')
    ? `
bg-[linear-gradient(135deg,#60a5fa,#6366f1)]
text-white
border-sky-300

shadow-[0_12px_35px_rgba(59,130,246,0.32)]

scale-[1.03]
`
    : `
bg-white/40
text-slate-700
`
}
`}
                                  >
                                    Jumps
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => togglePracticeFocus('Spins')}
                                    className={`
${pillBtn}
px-4 py-2.5 text-sm font-medium
hover:-translate-y-[1px]
transition-all duration-200
${
  (editingSessionDate === selectedDate
    ? editingPracticeFocus
    : practiceFocus
  ).includes('Spins')
    ? `
bg-[linear-gradient(135deg,#60a5fa,#6366f1)]
text-white
border-sky-300

shadow-[0_12px_35px_rgba(59,130,246,0.32)]

scale-[1.03]
`
    : `
bg-white/40
text-slate-700
`
}
`}
                                  >
                                    Spins
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => togglePracticeFocus('Moves')}
                                    className={`
${pillBtn}
px-4 py-2.5 text-sm font-medium
hover:-translate-y-[1px]
transition-all duration-200
${
  (editingSessionDate === selectedDate
    ? editingPracticeFocus
    : practiceFocus
  ).includes('Moves')
    ? `
bg-[linear-gradient(135deg,#60a5fa,#6366f1)]
text-white
border-sky-300

shadow-[0_12px_35px_rgba(59,130,246,0.32)]

scale-[1.03]
`
    : `
bg-white/40
text-slate-700
`
}
`}
                                  >
                                    Moves
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      togglePracticeFocus('Lesson')
                                    }
                                    className={`
${pillBtn}
px-4 py-2.5 text-sm font-medium
hover:-translate-y-[1px]
transition-all duration-200
${
  (editingSessionDate === selectedDate
    ? editingPracticeFocus
    : practiceFocus
  ).includes('Lesson')
    ? `
bg-[linear-gradient(135deg,#60a5fa,#6366f1)]
text-white
border-sky-300

shadow-[0_12px_35px_rgba(59,130,246,0.32)]

scale-[1.03]
`
    : `
bg-white/40
text-slate-700
`
}
`}
                                  >
                                    Lesson
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      togglePracticeFocus('For Fun')
                                    }
                                    className={`
${pillBtn}
px-4 py-2.5 text-sm font-medium
hover:-translate-y-[1px]
transition-all duration-200
${
  (editingSessionDate === selectedDate
    ? editingPracticeFocus
    : practiceFocus
  ).includes('For Fun')
    ? `
bg-[linear-gradient(135deg,#60a5fa,#6366f1)]
text-white
border-sky-300

shadow-[0_12px_35px_rgba(59,130,246,0.32)]

scale-[1.03]
`
    : `
bg-white/40
text-slate-700
`
}
`}
                                  >
                                    For Fun
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="mt-6">
                              <label className="block text-sm font-medium text-slate-600 mb-2">
                                Notes
                              </label>

                              <textarea
                                value={
                                  editingSessionDate === selectedDate
                                    ? editingNoteText
                                    : sessionNote
                                }
                                onChange={(e) => {
                                  if (editingSessionDate === selectedDate) {
                                    setEditingNoteText(e.target.value)
                                    setSessionDirty(true)
                                  } else if (selectedSession) {
                                    setEditingSessionDate(selectedDate)

                                    setEditingHours(
                                      String(selectedSession.hours || '')
                                    )

                                    setEditingNoteText(e.target.value)

                                    setEditingPracticeFocus(
                                      selectedSession.practice_focus || []
                                    )

                                    setSessionDirty(true)
                                  } else {
                                    setSessionNote(e.target.value)
                                  }
                                }}
                                placeholder="How was your skating today?"
                                className="
w-full

min-h-[64px]

rounded-[1.5rem]

bg-white/88
backdrop-blur-sm

border border-white/70

px-5 py-4

text-sm
text-slate-700

shadow-[0_12px_35px_rgba(59,130,246,0.06)]

resize-none

focus:outline-none
focus:border-sky-200
focus:bg-white

transition-all duration-250
"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-center py-20 px-6">
                    <div className="text-5xl mb-6">⛸</div>

                    <h1
                      className="
    text-4xl md:text-5xl
    font-bold
    tracking-tight
    text-slate-800
    max-w-3xl
    "
                    >
                      Every session counts.
                    </h1>

                    <p
                      className="
    mt-4
    text-lg
    text-slate-500
    max-w-xl
    "
                    >
                      Sharpening • Training Hours • Skating Journals
                    </p>

                    <button
                      onClick={() => {
                        setAuthMode('signup')
                        setAuthModalOpen(true)
                      }}
                      className="
    mt-8

    px-8 py-4

    rounded-full

    text-white
    font-medium

    bg-gradient-to-r
    from-blue-500
    to-violet-500

    hover:scale-[1.03]

    shadow-[0_15px_40px_rgba(59,130,246,0.25)]

    transition-all
    "
                    >
                      Start Tracking
                    </button>

                    <div
                      className="
    mt-3
    text-sm
    text-slate-400
    "
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeView === 'skater_summary' ? (
          <div
            className="
flex-1 overflow-y-auto
px-4 py-6 md:p-8
bg-white/20 backdrop-blur-sm
"
          >
            <div className="w-full max-w-6xl mx-auto space-y-4">
              <div
                className="
max-w-5xl
mx-auto

rounded-[32px]
border border-white/40
bg-white/55

backdrop-blur-xl

p-6

shadow-[0_20px_60px_rgba(15,23,42,0.06)]
"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-slate-800">
                    Skating Footprint
                  </h2>

                  <div className="text-sm text-slate-500">Last 365 days</div>
                </div>

                <div
                  className="footprint-grid"
                  style={{ overflowY: 'visible' }}
                >
                  {footprintDays.map((day) => (
                    <div
                      key={day.date.slice(5)}
                      className="footprint-cell-wrapper"
                    >
                      <div
                        className={
                          day.active
                            ? 'footprint-cell footprint-active'
                            : 'footprint-cell'
                        }
                      />

                      <div className="footprint-tooltip">
                        {day.active
                          ? `${sessionHoursByDate[day.date] || 0} hrs · ${day.date.slice(5)}`
                          : `0 hrs · ${day.date.slice(5)}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="
max-w-5xl
mx-auto

rounded-[32px]
border border-white/40
bg-white/55

backdrop-blur-xl

p-6

shadow-[0_20px_60px_rgba(15,23,42,0.06)]
"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-2xl font-semibold text-slate-800">
                      Focus
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {['week', 'month', 'year'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setStatsRange(range as any)}
                        className={`
px-4 py-2
rounded-2xl
text-sm
transition-all

${
  statsRange === range
    ? `
bg-blue-500
text-white
shadow-[0_0_20px_rgba(59,130,246,0.45)]
`
    : `
bg-white/50
text-slate-600
hover:bg-white/80
`
}
`}
                      >
                        {range === 'week'
                          ? 'Week'
                          : range === 'month'
                            ? 'Month'
                            : 'Year'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-5">
                  {(() => {
                    const stats = bladeTracker?.focus_statistics?.[statsRange]

                    const focusStats = stats?.focuses || {}

                    const totalSessions = stats?.total_sessions || 0

                    return Object.entries(focusStats).map(
                      ([label, item]: any) => {
                        return (
                          <div key={label} className="group relative">
                            <div className="flex justify-between mb-2">
                              <div className="text-slate-700 font-medium">
                                {label}
                              </div>

                              <div className="text-slate-500 text-sm">
                                {item.count} / {totalSessions} sessions
                              </div>
                            </div>

                            <div
                              className="
relative
group

h-4
rounded-full
bg-slate-100/80
overflow-visible
"
                            >
                              <div
                                className="
relative

h-full
rounded-full

bg-gradient-to-r
from-blue-400
to-indigo-500

shadow-[0_0_12px_rgba(96,165,250,0.35)]

transition-all
duration-700

group-hover:brightness-110
"
                                style={{
                                  width: `${item.percentage}%`,
                                }}
                              >
                                <div
                                  className="
absolute

left-1/2
-top-12

-translate-x-1/2

px-3 py-1.5

rounded-xl

text-xs
font-semibold
text-slate-800

bg-[linear-gradient(
135deg,
rgba(255,255,255,0.96),
rgba(239,246,255,0.96)
)]

backdrop-blur-xl

border border-white/40

shadow-[0_12px_35px_rgba(59,130,246,0.18)]

opacity-0
group-hover:opacity-100

translate-y-1
group-hover:translate-y-0

transition-all
duration-200

pointer-events-none
whitespace-nowrap
z-40
"
                                >
                                  {item.percentage}%
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      }
                    )
                  })()}
                </div>
              </div>
            </div>

            <div
              className="
max-w-5xl
mx-auto
mt-4

rounded-[32px]
border border-white/40
bg-white/55

backdrop-blur-xl

p-6

shadow-[0_20px_60px_rgba(15,23,42,0.06)]
"
            >
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <div className="text-2xl font-semibold text-slate-800">
                    Archetypes
                  </div>
                </div>

                <button
                  onClick={handleGenerateSkaterIdentity}
                  disabled={identityLoading}
                  className="
px-5 py-2.5
rounded-2xl
text-sm font-medium
text-white
bg-[linear-gradient(135deg,#60a5fa,#6366f1)]
shadow-[0_14px_35px_rgba(59,130,246,0.28)]
hover:shadow-[0_18px_45px_rgba(59,130,246,0.36)]
hover:scale-[1.015]
active:scale-[0.985]
transition-all
disabled:opacity-45
disabled:cursor-not-allowed
"
                >
                  {identityLoading ? 'Discovering...' : 'Identify Me'}
                </button>
              </div>

              <div
                className="
min-h-[72px]

rounded-[28px]

bg-[linear-gradient(
145deg,
rgba(255,255,255,0.82),
rgba(248,250,252,0.72)
)]

backdrop-blur-xl

border border-white/70

shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_35px_rgba(15,23,42,0.05)]

p-5
"
              >
                {skaterIdentityLabels.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {skaterIdentityLabels.map((label) => (
                      <div
                        key={label}
                        className="
relative
overflow-hidden

px-5 py-3

rounded-full

bg-[linear-gradient(
145deg,
rgba(255,255,255,0.86),
rgba(239,246,255,0.74)
)]

backdrop-blur-2xl

border border-white/80

shadow-[0_14px_38px_rgba(59,130,246,0.12)]

text-sm
font-semibold
tracking-wide
text-slate-700

before:absolute
before:inset-0
before:pointer-events-none
before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),transparent_42%)]

hover:shadow-[0_18px_48px_rgba(59,130,246,0.18)]
hover:scale-[1.015]

transition-all
duration-200
"
                      >
                        <span className="relative z-10">{label}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">
                    Click the button to reveal your personalized archetype
                    cards.
                  </div>
                )}
              </div>
            </div>

            <div
              className={`
    ${glassStrong}

    max-w-5xl
    mx-auto

    rounded-[32px]

    p-5
    mt-4
  `}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[1.6rem] font-semibold text-slate-800">
                  Progress
                </h2>

                <div
                  className="
      px-4 py-2
      rounded-full
      text-xs
      font-medium
      text-sky-700
      bg-sky-50
      border
      border-sky-100
    "
                >
                  🔥 {progressStats.weeklyStreak} Week Streak
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="progress-stat-card">
                  <div className="progress-stat-value">
                    {progressStats.totalSessions}
                  </div>

                  <div className="progress-stat-label">Sessions Logged</div>
                </div>

                <div className="progress-stat-card">
                  <div className="progress-stat-value">
                    {progressStats.totalHours.toFixed(1)}
                  </div>

                  <div className="progress-stat-label">Total Ice Hours</div>
                </div>

                <div className="progress-stat-card">
                  <div className="progress-stat-value">
                    {progressStats.bladeQualityScore === null
                      ? '—'
                      : progressStats.bladeQualityScore}
                  </div>

                  <div className="progress-stat-label">Blade Quality</div>

                  <div className="mt-2 text-[11px] leading-relaxed text-slate-400">
                    {progressStats.bladeQualityScore === null ? (
                      <>
                        <div>Record sharpening date</div>
                        <div>to estimate blade quality.</div>
                      </>
                    ) : (
                      <>
                        <div className="font-medium text-sky-500">
                          {progressStats.bladeQualityLabel}
                        </div>
                        <div className="font-mono">
                          Decay model: 100 × e^(-h/50)
                        </div>

                        <div>
                          h = {progressStats.hoursSinceSharpening.toFixed(1)}{' '}
                          hrs
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="progress-stat-card">
                  <div className="progress-stat-value">
                    {progressStats.hoursSinceSharpening.toFixed(1)}
                  </div>

                  <div className="progress-stat-label">
                    Hours Since Sharpening
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="progress-achievement-card">
                  <div className="flex items-center gap-2">
                    <span>🎯</span>

                    <span className="font-semibold text-slate-800">
                      Next Milestone
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-slate-800">
                        {progressStats.totalHours.toFixed(1)} /
                        {progressStats.nextMilestone} hrs
                      </div>

                      <div className="text-sm text-slate-500">
                        {Math.round(
                          (progressStats.totalHours /
                            progressStats.nextMilestone) *
                            100
                        )}
                        %
                      </div>
                    </div>

                    <div
                      className="
mt-3
h-3
rounded-full
bg-slate-100
overflow-hidden
"
                    >
                      <div
                        className="
h-full
rounded-full

bg-gradient-to-r
from-sky-500
to-indigo-500

transition-all
duration-700
"
                        style={{
                          width: `${Math.min(
                            100,
                            (progressStats.totalHours /
                              progressStats.nextMilestone) *
                              100
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="mt-3 text-sm text-slate-500">
                      {(
                        progressStats.nextMilestone - progressStats.totalHours
                      ).toFixed(1)}
                      hrs remaining
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="
max-w-5xl
mx-auto
mt-4

rounded-[32px]
border border-white/40
bg-white/55

backdrop-blur-xl

p-6

shadow-[0_20px_60px_rgba(15,23,42,0.06)]
"
            >
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <div className="text-2xl font-semibold text-slate-800">
                    Summary
                  </div>
                </div>

                <button
                  onClick={handleGenerateSkaterSummary}
                  disabled={summaryLoading}
                  className="
px-5 py-2.5
rounded-2xl
text-sm font-medium
text-white
bg-[linear-gradient(135deg,#60a5fa,#6366f1)]
shadow-[0_14px_35px_rgba(59,130,246,0.28)]
hover:shadow-[0_18px_45px_rgba(59,130,246,0.36)]
hover:scale-[1.015]
active:scale-[0.985]
transition-all
disabled:opacity-45
disabled:cursor-not-allowed
"
                >
                  {summaryLoading ? 'Summarizing...' : 'Summarize Me'}
                </button>
              </div>

              <div
                className="
min-h-[180px]

rounded-[28px]

bg-[linear-gradient(
145deg,
rgba(255,255,255,0.82),
rgba(248,250,252,0.72)
)]

backdrop-blur-xl

border border-white/70

shadow-[

inset_0_1px_0_rgba(255,255,255,0.8),

0_10px_35px_rgba(15,23,42,0.05)

]

p-6
backdrop-blur-xl
p-5
text-slate-700
leading-7
shadow-inner
"
              >
                {skaterSummary ? (
                  <>
                    <div
                      className="
inline-flex
items-center
gap-2

mb-4

px-3 py-1.5

rounded-full

bg-blue-50

text-blue-600

text-xs
font-medium
"
                    >
                      ✨ AI Reflection
                    </div>

                    <div
                      className="
whitespace-pre-wrap

text-[15px]
leading-8

text-slate-700
"
                    >
                      {skaterSummary}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-slate-500">
                    Click the button to generate a personal skating reflection.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeView === 'coach_portal' ? (
          <div
            className="
flex-1 overflow-y-auto
px-4 py-6 md:p-8
bg-white/20 backdrop-blur-sm
"
          >
            <div className="w-full max-w-6xl mx-auto">
              {/* HEADER */}

              <div
                className="
rounded-[32px]
border border-white/40
bg-white/55
backdrop-blur-xl
p-6
shadow-[0_20px_60px_rgba(15,23,42,0.06)]
mb-6
"
              >
                <h2 className="text-2xl font-semibold text-slate-800">
                  Coach Portal
                </h2>
              </div>

              {/* SCHEDULE ROW */}

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div
                  className="
rounded-[32px]
border border-white/40
bg-white/55
backdrop-blur-xl
p-6
shadow-[0_20px_60px_rgba(15,23,42,0.06)]
"
                >
                  <div className="flex justify-between mb-5">
                    <div className="text-xl font-semibold text-slate-800">
                      Today's Schedule
                    </div>
                  </div>

                  <div className="space-y-3 text-slate-600">
                    {todaysLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className={`
        ${portalCard}
        flex
        items-center
        gap-4
      `}
                      >
                        <span className="font-medium text-slate-600 whitespace-nowrap">
                          {formatLessonRange(lesson)}
                        </span>

                        <span className="font-medium text-slate-700">
                          {lesson.coach_students?.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="
rounded-[32px]
border border-white/40
bg-white/55
backdrop-blur-xl
p-6
shadow-[0_20px_60px_rgba(15,23,42,0.06)]
"
                >
                  <div className="text-xl font-semibold text-slate-800 mb-5">
                    This Week Schedule
                  </div>

                  {(() => {
                    const counts = getCurrentWeekLessonCounts()

                    return (
                      <div className="space-y-5">
                        {Object.entries(counts).map(([day, count]) => (
                          <div
                            key={day}
                            className="
flex
items-center
gap-4
"
                          >
                            <div className="w-14 text-slate-600">{day}</div>

                            <div className="flex gap-2">
                              {Array.from({ length: count }).map((_, idx) => (
                                <div
                                  key={idx}
                                  className="
w-3 h-3

rounded-full

bg-gradient-to-r
from-sky-500
to-violet-500

w-3 h-3 rounded-full
"
                                />
                              ))}

                              {count === 0 && (
                                <span className="text-slate-300">—</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* STUDENTS */}

              <div className="flex items-center justify-between mb-5">
                <div className="text-xl font-semibold text-slate-800">
                  Students
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAddStudentOpen(true)}
                    className={`${pillBtn} px-4`}
                  >
                    + Student
                  </button>

                  <button
                    onClick={() => setAddLessonOpen(true)}
                    className={`${pillBtn} px-4`}
                  >
                    + Lesson
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {coachStudents.map((student) => (
                  <div
                    key={student.id}
                    className="student-flip-wrapper"
                    onClick={() =>
                      setFlippedStudentId(
                        flippedStudentId === student.id ? null : student.id
                      )
                    }
                  >
                    <div
                      className={`
    student-flip-card

    ${flippedStudentId === student.id ? 'flipped' : ''}
  `}
                    >
                      <div
                        className="
student-flip-face

text-left

rounded-[28px]
border border-white/40
bg-white/55

backdrop-blur-xl

p-6

shadow-[0_20px_60px_rgba(15,23,42,0.06)]

hover:bg-white/75

transition-all
"
                      >
                        <div className="absolute top-4 right-4 z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()

                              setStudentPendingDelete(student)
                              setDeleteStudentModalOpen(true)
                            }}
                            className="
h-8 w-8

rounded-full

bg-rose-50
text-rose-500

border border-rose-100

hover:bg-rose-100

transition-all
"
                          >
                            ×
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900">
                            {student.name}
                          </h3>

                          <span
                            className="
px-2 py-1
rounded-full
text-[11px]
font-medium

bg-sky-50
text-sky-600
border border-sky-100
"
                          >
                            {student.track === 'adult' ? 'Adult' : 'Regular'}
                          </span>
                        </div>

                        <div className="mt-5">
                          <div className="text-xs uppercase tracking-wide text-slate-400">
                            Upcoming Lessons
                          </div>

                          {getUpcomingLessonsForStudent(student.id).length >
                          0 ? (
                            <div className="mt-2 flex flex-col gap-2">
                              {getUpcomingLessonsForStudent(student.id).map(
                                (lesson) => (
                                  <div
                                    key={lesson.id}
                                    className="
w-fit
px-3 py-1.5
rounded-full

bg-red-50
text-red-700

text-xs
font-medium
"
                                  >
                                    {formatLessonPreview(lesson)}
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <div className="mt-1 text-lg font-semibold text-slate-700">
                              Not Scheduled
                            </div>
                          )}
                        </div>

                        <div className="mt-auto pt-8 flex gap-2 flex-wrap">
                          <span
                            className="
px-3 py-1
rounded-full
bg-sky-50
text-sky-700
text-xs
font-medium
"
                          >
                            Moves {student.moves_level || '—'}
                          </span>

                          <span
                            className="
px-3 py-1
rounded-full
bg-violet-50
text-violet-700
text-xs
font-medium
"
                          >
                            Free {student.freeskate_level || '—'}
                          </span>

                          <span
                            className="
px-3 py-1
rounded-full
bg-green-50
text-green-700
text-xs
font-medium
"
                          >
                            Dance {student.dance_level || '—'}
                          </span>
                        </div>
                      </div>

                      <div
                        className="
student-flip-face
student-flip-back

rounded-[28px]
border border-white/40
bg-white/85

backdrop-blur-xl

p-6

shadow-[0_20px_60px_rgba(15,23,42,0.08)]

flex
flex-col
justify-between
"
                      >
                        <div>
                          <div className="text-lg font-bold text-slate-900">
                            {student.name}
                          </div>

                          <div className="mt-5 space-y-3">
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                Moves in the Field Level
                              </span>

                              <span className="font-medium text-slate-700">
                                {student.moves_level || '—'}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                Freeskate Level
                              </span>

                              <span className="font-medium text-slate-700">
                                {student.freeskate_level || '—'}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                Ice Dance Level
                              </span>

                              <span className="font-medium text-slate-700">
                                {student.dance_level || '—'}
                              </span>
                            </div>

                            <div className="pt-2 border-t border-slate-100">
                              <div className="text-xs text-slate-400">
                                Next Lesson
                              </div>

                              <div className="font-medium text-slate-700">
                                {getNextLessonForStudent(student.id) ||
                                  'No lesson scheduled'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedStudentId(student.id)
                            setActiveView('student_profile')
                          }}
                          className="
mt-5

px-4 py-3

rounded-full

bg-gradient-to-r
from-sky-500
to-violet-500

text-white
font-medium

hover:scale-[1.02]

transition-all
"
                        >
                          Open Profile
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeView === 'student_profile' ? (
          <div
            className="
            student-profile-enter
flex-1 overflow-y-auto
px-4 py-6 md:p-8
bg-white/20 backdrop-blur-sm
"
          >
            <div className="w-full max-w-6xl mx-auto">
              {/* STICKY COACH TOOLBAR */}

              <div
                className="
sticky
top-4
z-50

flex items-center
justify-between

mb-6
"
              >
                <button
                  onClick={() => setActiveView('coach_portal')}
                  className={`${pillBtn} px-5 py-3`}
                >
                  ← Back
                </button>
              </div>

              {/* STUDENT CARD */}

              <div
                className="
relative
z-[200]

overflow-visible

rounded-[32px]
border border-white/40
bg-white/55
backdrop-blur-xl
p-6
mb-6
"
              >
                <div className="mb-4"></div>

                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-slate-800">
                      {selectedStudent?.name}
                    </div>

                    <select
                      value={editingStudentTrack}
                      onChange={(e) =>
                        setEditingStudentTrack(
                          e.target.value as 'adult' | 'regular'
                        )
                      }
                      className="
      px-4 py-2

      rounded-full

      bg-sky-50/80
      border border-sky-100

      text-sky-700
      text-sm
      font-medium
      "
                    >
                      <option value="regular">Regular</option>
                      <option value="adult">Adult</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSaveStudentLevels}
                    disabled={studentLevelSaving}
                    className={`${pillBtn} px-5 py-3 ${
                      studentLevelSaving ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {studentLevelSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>

                <div
                  className="
grid
md:grid-cols-3
gap-4

relative

overflow-visible

z-[300]

md:pb-0
"
                >
                  {/* MOVES */}

                  <div className="relative z-[400] overflow-visible">
                    <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                      Moves
                    </div>

                    <GlassSelect
                      value={editingMovesLevel}
                      onChange={setEditingMovesLevel}
                      options={
                        editingStudentTrack === 'adult'
                          ? ADULT_LEVELS
                          : REGULAR_LEVELS
                      }
                    />
                  </div>

                  {/* FREESKATE */}

                  <div className="relative z-[400] overflow-visible">
                    <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                      Freeskate
                    </div>

                    <GlassSelect
                      value={editingFreeskateLevel}
                      onChange={setEditingFreeskateLevel}
                      options={
                        editingStudentTrack === 'adult'
                          ? ADULT_LEVELS
                          : REGULAR_LEVELS
                      }
                    />
                  </div>

                  {/* DANCE */}

                  <div className="relative z-[400] overflow-visible">
                    <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                      Dance
                    </div>

                    <GlassSelect
                      value={editingDanceLevel}
                      onChange={setEditingDanceLevel}
                      options={
                        editingStudentTrack === 'adult'
                          ? ADULT_LEVELS
                          : REGULAR_LEVELS
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-8 relative z-0">
                <div>
                  {/* <button
                    className={`${pillBtn} px-6 py-3 text-sm font-medium`}
                  >
                    + Add Lesson
                  </button> */}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-500 mb-3">
                    Upcoming Lessons
                  </h3>

                  <div className="space-y-2">
                    {upcomingLessons.map((lesson) => (
                      <div key={lesson.id} className={portalCard}>
                        {new Date(lesson.lesson_datetime).toLocaleString()}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-500 mb-4">
                    Lesson History
                  </h3>

                  <div className="space-y-3">
                    {studentLessons.map((lesson) => {
                      const expanded = expandedLessonId === lesson.id

                      return (
                        <div
                          key={lesson.id}
                          className={`
${portalCard}
${expanded ? 'p-5' : 'p-3'}
`}
                        >
                          <button
                            onClick={() =>
                              setExpandedLessonId(expanded ? null : lesson.id)
                            }
                            className="
w-full
flex
items-center
justify-between
text-left
"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-semibold">
                                {lesson.date}
                              </span>

                              <span className="text-slate-400">•</span>

                              <span className="text-slate-500">
                                {lesson.time}
                              </span>
                            </div>

                            <div>{expanded ? '▼' : '▶'}</div>
                          </button>

                          <div
                            className={`
overflow-hidden
transition-all
duration-300
ease-in-out

${expanded ? 'max-h-40 opacity-100 mt-4 pt-4' : 'max-h-0 opacity-0'}
`}
                          >
                            <div
                              className="
border-t
border-slate-200
text-sm
text-slate-600
leading-relaxed
pt-4
"
                            >
                              {lesson.note}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : !hasStartedChat ? (
          <div
            className="
flex-1
flex
items-center
justify-center
px-6
"
          >
            <div
              className="
relative

w-full
max-w-[760px]

-translate-y-12
"
            >
              {/* Atmospheric Glow */}
              <div
                className="
absolute

left-1/2
top-[58%]

-translate-x-1/2
-translate-y-1/2

w-[1000px]
h-[420px]

pointer-events-none

rounded-full

bg-[radial-gradient(circle,
rgba(14,165,233,0.42)_0%,
rgba(99,102,241,0.30)_36%,
rgba(168,85,247,0.20)_55%,
transparent_78%)]

blur-[70px]

opacity-100
"
              />

              {/* Visible Contour Ring */}
              <div
                className="
absolute

left-1/2
top-[58%]

w-[900px]
h-[330px]

-translate-x-1/2
-translate-y-1/2

pointer-events-none

rounded-full

border-[2px]
border-sky-300/35

shadow-[0_0_80px_rgba(56,189,248,0.45),0_0_160px_rgba(139,92,246,0.24)]

blur-[8px]

opacity-100
"
              />

              {/* Actual Content */}
              <div className="relative z-10">
                <div
                  className="
text-center

text-[56px]
leading-[1.05]

font-light

tracking-[-0.05em]

text-slate-700

mb-10
"
                >
                  Where figure skating meets AI
                </div>

                <div
                  className="
flex items-center gap-3

rounded-full

bg-white/90
backdrop-blur-xl

border border-white/80

shadow-[0_20px_60px_rgba(15,23,42,0.12)]

px-5 py-3
"
                >
                  <textarea
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask WarmGPT"
                    className="
flex-1
bg-transparent
resize-none
outline-none

text-slate-700
placeholder:text-slate-400
"
                  />

                  <button
                    onClick={sendMessage}
                    disabled={loading}
                    className="
px-5 py-2

rounded-full

text-white

bg-gradient-to-r
from-sky-500
to-violet-500

shadow-[0_10px_30px_rgba(99,102,241,0.35)]
"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div
              className="
flex-1 overflow-y-auto

px-3 sm:px-4 md:px-10 lg:px-16

pt-10 pb-12

space-y-2
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
                      key={m.id || `msg-${i}`}
                      className={`
      group
      w-full flex
      ${m.role === 'user' ? 'justify-end' : 'justify-start'}
      mb-8
    `}
                    >
                      {/* ENTIRE MESSAGE ROW */}
                      <div
                        className={`
        flex items-start gap-3
        ${m.role === 'assistant' ? 'w-full max-w-[900px]' : 'max-w-[520px]'}
      `}
                      >
                        {/* AVATAR */}
                        {m.role === 'assistant' && (
                          <div className="pt-1 shrink-0 w-16 h-16 md:w-20 md:h-20">
                            <AssistantAvatar
                              thinking={loading && i === messages.length - 1}
                              speaking={speakingIndex === i}
                            />
                          </div>
                        )}

                        {/* RIGHT SIDE CONTENT */}
                        <div className="flex flex-col min-w-0 flex-1">
                          {/* NAME + ACTIONS */}
                          <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-2 px-1">
                            <span className="text-sm font-medium text-slate-700">
                              {m.role === 'assistant' ? 'WarmGPT' : 'You'}
                            </span>

                            {/* ACTIONS */}
                            {editingIndex !== i && (
                              <div
                                className={`
flex items-center gap-2 flex-wrap

w-full lg:w-auto

${
  isTablet
    ? 'opacity-100'
    : 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100'
}
`}
                              >
                                {/* COPY */}
                                <button
                                  onClick={() => handleCopy(m.content, i)}
                                  className="
      text-xs
      px-3 py-1.5 md:py-1
      rounded-xl
      bg-white/68
      border border-white/30
      hover:bg-white/70
    "
                                >
                                  {copiedIndex === i ? '✓' : 'Copy'}
                                </button>

                                {/* EDIT */}
                                <button
                                  onClick={() => {
                                    setEditingIndex(i)
                                    setEditingText(m.content)
                                  }}
                                  className="
      text-xs
      px-3 py-1.5 md:py-1
      rounded-xl
      bg-white/68
      border border-white/30
      hover:bg-white/70
    "
                                >
                                  Edit
                                </button>

                                {/* READ ALOUD */}
                                {m.role === 'assistant' && (
                                  <button
                                    onClick={() => {
                                      if (speakingIndex === i) {
                                        stopSpeech()
                                      } else {
                                        speakText(m.content, i)
                                      }
                                    }}
                                    className="
        text-xs
        px-3 py-1.5 md:py-1
        rounded-xl
        bg-white/68
        border border-white/30
        hover:bg-white/70
      "
                                  >
                                    {speakingIndex === i ? 'Stop' : 'Read'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* BUBBLE */}
                          {editingIndex === i ? (
                            <div className="space-y-3">
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="
      w-full
      rounded-2xl
      border
      px-4 py-3
      bg-white/68
      min-h-[140px]
    "
                              />

                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditSave(i)}
                                  className="
        px-4 py-2
        rounded-xl
        bg-violet-500
        text-white
      "
                                >
                                  Save
                                </button>

                                <button
                                  onClick={() => {
                                    setEditingIndex(null)
                                    setEditingText('')
                                  }}
                                  className="
        px-4 py-2
        rounded-xl
        bg-slate-200
      "
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`
              group

              rounded-[2.3rem]

              px-6 py-5

              transition-all duration-300

              ${
                m.role === 'assistant'
                  ? `
                    ${softBubble}

                    border border-white/20
                    backdrop-blur-xl

                    w-full
                  `
                  : `
                    ${darkBubble}
                  `
              }
            `}
                            >
                              <div
                                className={`
                whitespace-pre-line
                leading-8

                ${m.role === 'assistant' ? 'text-slate-800' : 'text-white'}
              `}
                              >
                                {isLastAssistant ? (
                                  <Typewriter
                                    text={m.content}
                                    speed={6}
                                    showCursor
                                    onComplete={() => setFinishedTypingIndex(i)}
                                  />
                                ) : (
                                  m.content
                                )}
                              </div>
                            </div>
                          )}

                          {actionLoading && actionTargetIndex === i && (
                            <div
                              className="
mt-3 ml-1

inline-flex items-center gap-3

px-4 py-2.5

rounded-2xl

bg-[linear-gradient(
145deg,
rgba(255,255,255,0.78),
rgba(239,246,255,0.62)
)]

backdrop-blur-2xl

border border-sky-100/80

shadow-[0_12px_35px_rgba(59,130,246,0.10)]

animate-[fadeUp_0.25s_ease]

text-sm text-slate-600
font-medium
"
                            >
                              <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" />
                                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-150" />
                                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce delay-300" />
                              </div>

                              <span>{actionStatusText}</span>
                            </div>
                          )}

                          {/* FOLLOWUP BUTTONS */}
                          {m.role === 'assistant' &&
                            !loading &&
                            linkedQuestion &&
                            finishedTypingIndex === i && (
                              <div className="mt-3 flex gap-2 pl-1">
                                <button
                                  onClick={() =>
                                    sendActionMessage(
                                      'simplify',
                                      linkedQuestion,
                                      m.content,
                                      i
                                    )
                                  }
                                  className="
group

relative overflow-hidden

text-[12px]
font-medium
tracking-[0.01em]

px-4 py-2

rounded-2xl

text-slate-700

bg-[linear-gradient(
145deg,
rgba(255,255,255,0.72),
rgba(255,255,255,0.42)
)]

backdrop-blur-2xl

border border-sky-100/80

shadow-[0_10px_30px_rgba(15,23,42,0.05)]

hover:bg-white/82
hover:border-sky-100

hover:shadow-[0_16px_45px_rgba(14,165,233,0.14)]

hover:-translate-y-[1px]

active:scale-[0.98]

transition-all duration-250

before:absolute
before:inset-0
before:pointer-events-none

before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),transparent_35%)]

before:opacity-70
"
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
                                  className="
group

relative overflow-hidden

text-[12px]
font-medium
tracking-[0.01em]

px-4 py-2

rounded-2xl

text-slate-700

bg-[linear-gradient(
145deg,
rgba(255,255,255,0.72),
rgba(236,233,254,0.45)
)]

backdrop-blur-2xl

border border-sky-100/80

shadow-[0_10px_30px_rgba(15,23,42,0.05)]

hover:bg-white/84
hover:border-violet-100

hover:shadow-[0_16px_45px_rgba(139,92,246,0.16)]

hover:-translate-y-[1px]

active:scale-[0.98]

transition-all duration-250

before:absolute
before:inset-0
before:pointer-events-none

before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),transparent_35%)]

before:opacity-70
"
                                >
                                  Go deeper
                                </button>
                              </div>
                            )}
                        </div>
                      </div>
                      <div
                        className={`
fixed
bottom-44
right-6

z-[999]

transition-all
duration-300
`}
                      >
                        {quickSkateOpen ? (
                          <div
                            className="
w-[290px]

rounded-[28px]

bg-[linear-gradient(
145deg,
rgba(255,255,255,0.92),
rgba(239,246,255,0.88)
)]

backdrop-blur-[28px]

border
border-white/70

shadow-[0_25px_70px_rgba(59,130,246,0.18)]

overflow-hidden
"
                          >
                            <div
                              className="
px-5
pt-4
pb-2

flex
justify-between
items-center
"
                            >
                              <div
                                className="
text-sm
font-semibold
text-slate-700
"
                              ></div>

                              <button
                                onClick={() => setQuickSkateOpen(false)}
                                className="text-slate-400"
                              >
                                ×
                              </button>
                            </div>

                            <div
                              className="
px-5
pb-4
"
                            >
                              <div
                                className="
text-center

px-3
pt-2
pb-4
"
                              >
                                <div
                                  className="
text-[11px]
uppercase
tracking-[0.18em]

text-indigo-600

mb-3
"
                                >
                                  Today's Skate Goal
                                </div>

                                <div
                                  className="
text-[15px]
font-medium

leading-relaxed

text-slate-700
"
                                >
                                  {quickSkateIdea}
                                </div>
                              </div>

                              <button
                                onClick={handleQuickSkateIdea}
                                disabled={quickSkateLoading}
                                className="
mt-3
w-full

rounded-2xl

py-2.5

text-white
font-medium

bg-gradient-to-r
from-blue-500
to-indigo-500

shadow-[0_12px_30px_rgba(59,130,246,0.25)]
"
                              >
                                {quickSkateLoading ? 'Thinking...' : 'New Idea'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            {/* glow layer */}

                            <div
                              className="
absolute
inset-0

rounded-full

bg-gradient-to-r
from-blue-400
via-indigo-400
to-violet-400

blur-2xl

opacity-80

scale-[1.35]

animate-pulse
"
                            />

                            {/* button */}

                            <button
                              onClick={() => setQuickSkateOpen(true)}
                              className="
relative

px-5
py-3

rounded-full

text-white

bg-gradient-to-r
from-blue-500
to-indigo-500

border
border-white/20

shadow-[0_20px_60px_rgba(59,130,246,0.35)]

backdrop-blur-xl

hover:scale-[1.03]

transition-all
duration-300
"
                            >
                              Quick Skate Goal
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {loading && (
                  <div className="w-full flex justify-start mb-8">
                    <div className="flex items-start gap-3">
                      <AssistantAvatar thinking />

                      <div
                        className={`
          ${softBubble}

          rounded-[2.3rem]
          px-6 py-5

          border border-white/20
          backdrop-blur-xl
        `}
                      >
                        <ThinkingDots />
                      </div>
                    </div>
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

px-4 py-3.5
md:px-6 md:py-4

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
h-11 px-5
md:h-12 md:px-7

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
        <div
          className="
fixed inset-0 z-50

flex items-center justify-center

bg-slate-900/12

backdrop-blur-[8px]

p-4
"
        >
          <div
            className="
relative overflow-hidden

w-[92vw]
max-w-[470px]

h-[min(90vh,820px)]

overflow-y-auto
overscroll-contain

pb-8

rounded-[2.4rem]

bg-white/80

backdrop-blur-[30px]

border border-white/80

shadow-[0_32px_96px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,0.5)]

p-6 md:p-8 pb-10

before:absolute
before:inset-0
before:pointer-events-none
before:bg-[

radial-gradient(
circle_at_15%_10%,
rgba(255,255,255,0.6),
transparent_40%
),

radial-gradient(
circle_at_85%_0%,
rgba(56,189,248,0.12),
transparent_35%
),

radial-gradient(
circle_at_50%_100%,
rgba(56,189,248,0.06),
transparent_40%
)

]
"
          >
            <div className="relative z-10 flex items-center justify-between mb-6">
              <div>
                <h2
                  className="
text-[2rem]
font-semibold
tracking-[-0.03em]
text-slate-800
"
                >
                  Profile
                </h2>

                <p
                  className="
text-[15px]
leading-relaxed
text-slate-500
mt-2
"
                >
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

            <div className="relative z-10 space-y-4">
              <input
                type="text"
                placeholder="First name"
                value={authFirstName}
                onChange={(e) => setAuthFirstName(e.target.value)}
                className="
w-full

px-5 py-4

rounded-[1.4rem]

bg-white/72
backdrop-blur-xl

border border-sky-100/80

text-slate-700
placeholder:text-slate-400

shadow-[0_8px_24px_rgba(15,23,42,0.04)]

focus:outline-none
focus:border-sky-200
focus:bg-sky-50/80

transition-all duration-250
"
              />

              <input
                type="text"
                placeholder="Last name (optional)"
                value={authLastName}
                onChange={(e) => setAuthLastName(e.target.value)}
                className="
w-full

px-5 py-4

rounded-[1.4rem]

bg-white/72
backdrop-blur-xl

border border-sky-100/80

text-slate-700
placeholder:text-slate-400

shadow-[0_8px_24px_rgba(15,23,42,0.04)]

focus:outline-none
focus:border-sky-200
focus:bg-sky-50/80

transition-all duration-250
"
              />

              <div className="pt-2">
                <p className="text-sm font-medium text-slate-700 mb-3">
                  Skating level
                </p>

                <SkaterLevelSelector
                  skaterLevel={skaterLevel}
                  setSkaterLevel={setSkaterLevel}
                />
              </div>

              <div className="space-y-4 pt-3">
                <input
                  type="text"
                  placeholder="Highest jump (optional)"
                  value={highestJump}
                  onChange={(e) => setHighestJump(e.target.value)}
                  className="
w-full

px-5 py-4

rounded-[1.4rem]

bg-white/72
backdrop-blur-xl

border border-sky-100/80

text-slate-700
placeholder:text-slate-400

shadow-[0_8px_24px_rgba(15,23,42,0.04)]

focus:outline-none
focus:border-sky-200
focus:bg-sky-50/80

transition-all duration-250
"
                />

                <input
                  type="text"
                  placeholder="Highest test level (optional)"
                  value={highestTestLevel}
                  onChange={(e) => setHighestTestLevel(e.target.value)}
                  className="
w-full

px-5 py-4

rounded-[1.4rem]

bg-white/72
backdrop-blur-xl

border border-sky-100/80

text-slate-700
placeholder:text-slate-400

shadow-[0_8px_24px_rgba(15,23,42,0.04)]

focus:outline-none
focus:border-sky-200
focus:bg-sky-50/80

transition-all duration-250
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
                  showToast(' Profile saved')
                }}
                className="
w-full
py-4
rounded-[1.5rem]
bg-[linear-gradient(135deg,rgba(59,130,246,0.94),rgba(124,58,237,0.90))]
text-white
font-medium
shadow-[0_18px_45px_rgba(99,102,241,0.28)]
hover:shadow-[0_24px_60px_rgba(99,102,241,0.38)]
hover:scale-[1.01]
active:scale-[0.985]
transition-all duration-250
"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div
          className="
fixed inset-0 z-[200]

flex items-center justify-center

bg-black/30
backdrop-blur-sm
"
        >
          <div
            className="
w-[680px]
max-w-[92vw]

rounded-[2rem]

bg-white/90
backdrop-blur-2xl

border border-white/70

shadow-[0_25px_80px_rgba(15,23,42,0.15)]

p-8
"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-slate-800">
                Settings
              </h2>

              <button
                onClick={() => setSettingsOpen(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-8">
              <div>
                <div className="text-sm font-medium text-slate-700 mb-2">
                  <div>
                    <div className="text-lg font-semibold text-slate-800">
                      Time Zone
                    </div>
                  </div>
                </div>

                <select
                  value={tempTimezone}
                  onChange={(e) => {
                    setTempTimezone(e.target.value)
                  }}
                >
                  {Intl.supportedValuesOf('timeZone').map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>

                <div className="mt-8">
                  <div className="text-xs text-slate-400 mb-5">
                    Currently using: {userTimezone}
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        const detected =
                          Intl.DateTimeFormat().resolvedOptions().timeZone

                        setTempTimezone(detected)
                      }}
                      className="
px-5
h-11

rounded-2xl

bg-white/80

border border-white/70

text-sm
font-medium
text-slate-600

hover:bg-white

transition-all
"
                    >
                      Detect
                    </button>

                    <button
                      onClick={() => {
                        setUserTimezone(tempTimezone)

                        localStorage.setItem('warmgpt_timezone', tempTimezone)

                        setSettingsOpen(false)

                        showToast('Timezone saved')
                      }}
                      className="
px-6
h-11

rounded-2xl

text-sm
font-medium
text-white

bg-gradient-to-r
from-blue-500
to-violet-500

shadow-[0_12px_30px_rgba(59,130,246,0.25)]

hover:opacity-90

transition-all
"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
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
px-3.5 py-2

rounded-xl

bg-white/45
backdrop-blur-xl

border border-white/70

text-sm
font-medium
text-slate-700

shadow-[0_8px_24px_rgba(59,130,246,0.06)]

hover:bg-[linear-gradient(135deg,rgba(224,242,254,0.92),rgba(186,230,253,0.72))]
hover:border-sky-200

transition-all duration-200
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

                    showToast(' Profile updated')

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

      {addStudentOpen && (
        <div
          className="
fixed inset-0 z-[200]
flex items-center justify-center
bg-slate-900/20
backdrop-blur-sm
px-4
"
        >
          <div
            className="
relative z-[210]
w-full max-w-md
max-h-[88vh]
overflow-visible
rounded-[32px]
border border-white/70
bg-white/80
backdrop-blur-2xl
shadow-[0_30px_100px_rgba(15,23,42,0.18)]
p-6
"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-xl font-semibold text-slate-800">
                  Add Student
                </div>

                <div className="text-sm text-slate-500 mt-1">
                  Create a student profile for this coach portal.
                </div>
              </div>

              <button
                onClick={() => setAddStudentOpen(false)}
                className="
h-9 w-9
rounded-full
bg-white/70
border border-white/70
text-slate-500
hover:bg-white
transition-all
"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 relative z-[220]">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Student name
                </label>

                <input
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder=" "
                  className={studentInputClass}
                />

                <div className="mt-6">
                  <label className="block mb-2 text-slate-600 font-medium">
                    Track
                  </label>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStudentTrack('adult')}
                      className={`
px-5 py-3 rounded-full
transition-all

${
  studentTrack === 'adult'
    ? 'bg-sky-500 text-white'
    : 'bg-white/70 text-slate-600'
}
`}
                    >
                      Adult
                    </button>

                    <button
                      type="button"
                      onClick={() => setStudentTrack('regular')}
                      className={`
px-5 py-3 rounded-full
transition-all

${
  studentTrack === 'regular'
    ? 'bg-sky-500 text-white'
    : 'bg-white/70 text-slate-600'
}
`}
                    >
                      Regular
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Moves Level
                </label>

                <GlassSelect
                  value={movesLevel}
                  onChange={setMovesLevel}
                  options={CURRENT_LEVELS}
                  direction="up"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Freeskate Level
                </label>

                <GlassSelect
                  value={freeskateLevel}
                  onChange={setFreeskateLevel}
                  options={CURRENT_LEVELS}
                  direction="up"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Dance Level
                </label>

                <GlassSelect
                  value={danceLevel}
                  onChange={setDanceLevel}
                  options={CURRENT_LEVELS}
                  direction="up"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-7">
              <button
                onClick={() => setAddStudentOpen(false)}
                className={`${pillBtn} px-5 py-3`}
              >
                Cancel
              </button>

              <button
                onClick={handleCreateCoachStudent}
                disabled={coachStudentSaving}
                className={`${pillBtn} px-5 py-3 ${
                  coachStudentSaving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {coachStudentSaving ? 'Saving...' : 'Save Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {addLessonOpen && (
        <div
          className="
      fixed inset-0
      z-[9999]
      flex items-center justify-center
      bg-black/30
    "
        >
          <div
            className={`
        ${glassStrong}
        w-full max-w-lg
        p-8
        rounded-3xl
      `}
          >
            <h3 className="text-2xl font-semibold mb-8">New Lesson</h3>

            <div className="space-y-5">
              <select
                value={lessonStudentId}
                onChange={(e) => setLessonStudentId(e.target.value)}
                className={studentInputClass}
              >
                <option value="">Select student</option>

                {coachStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={lessonDate}
                onChange={(e) => setLessonDate(e.target.value)}
                className={studentInputClass}
              />

              <div>
                <div className="text-sm text-slate-500 mb-2">Lesson start</div>

                <input
                  type="time"
                  value={lessonTime}
                  onChange={(e) => setLessonTime(e.target.value)}
                  className={studentInputClass}
                />
              </div>

              <select
                value={lessonDuration}
                onChange={(e) => setLessonDuration(e.target.value)}
                className={studentInputClass}
              >
                <option value="">Duration (optional)</option>

                <option value="30">30 minutes</option>

                <option value="45">45 minutes</option>

                <option value="60">60 minutes</option>

                <option value="90">90 minutes</option>

                <option value="120">120 minutes</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setAddLessonOpen(false)}
                className={`${pillBtn} px-4`}
              >
                Cancel
              </button>

              <button
                onClick={handleCreateLesson}
                className={`${pillBtn} px-4`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteStudentModalOpen && studentPendingDelete && (
        <div
          className="
fixed inset-0 z-[220]
flex items-center justify-center
bg-slate-900/20
backdrop-blur-sm
px-4
"
        >
          <div
            className="
w-full max-w-md
rounded-[32px]
border border-white/70
bg-white/85
backdrop-blur-2xl
shadow-[0_30px_100px_rgba(15,23,42,0.18)]
p-6
"
          >
            <div className="text-xl font-semibold text-slate-800">
              Delete Student
            </div>

            <div className="text-sm text-slate-500 mt-3 leading-relaxed">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-700">
                {studentPendingDelete.name}
              </span>
              ? This action cannot be undone.
            </div>

            <div className="flex items-center justify-end gap-3 mt-7">
              <button
                onClick={() => {
                  setDeleteStudentModalOpen(false)
                  setStudentPendingDelete(null)
                }}
                className={`${pillBtn} px-5 py-3`}
              >
                Cancel
              </button>

              <button
                onClick={() =>
                  handleDeleteCoachStudent(studentPendingDelete.id)
                }
                className="
px-5 py-3
rounded-full
text-sm font-medium
text-white
bg-gradient-to-r
from-rose-500
to-red-500
shadow-[0_12px_30px_rgba(239,68,68,0.25)]
hover:scale-[1.02]
transition-all
"
              >
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div
          className="
fixed

left-1/2 bottom-7
-translate-x-1/2

z-[140]

pointer-events-none

animate-[toastFloat_0.32s_cubic-bezier(0.22,1,0.36,1)]

"
        >
          <div
            className="
relative overflow-hidden

flex items-center gap-3

px-5 py-3.5

rounded-[1.7rem]

bg-[linear-gradient(
145deg,
rgba(255,255,255,0.82),
rgba(255,255,255,0.58)
)]

backdrop-blur-[24px]

border border-white/70

shadow-[0_18px_50px_rgba(15,23,42,0.10)]

text-slate-700
text-sm
font-medium

before:absolute
before:inset-0
before:pointer-events-none

before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),transparent_40%)]

after:absolute
after:inset-0
after:pointer-events-none

after:bg-[linear-gradient(180deg,rgba(255,255,255,0.12),transparent)]
"
          >
            <div
              className="
relative z-10

w-5 h-5

rounded-full

bg-emerald-100

flex items-center justify-center

text-emerald-600
text-[11px]
font-bold

shadow-sm
"
            >
              ✓
            </div>

            <div className="relative z-10">
              {toastMessage.replace('✓ ', '')}
            </div>
          </div>
        </div>
      )}

      {authModalOpen && (
        <div
          className="
fixed inset-0 z-50

flex items-start md:items-center
justify-center

overflow-y-auto

pt-6 pb-6
"
        >
          <div
            className="
w-[380px]

max-h-[90vh]
overflow-y-auto

rounded-2xl
bg-white
p-8

shadow-2xl
border border-slate-200
"
          >
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
px-5 py-4
rounded-[1.4rem]
bg-white/62
backdrop-blur-xl
border border-sky-100/80
text-slate-700
placeholder:text-slate-400
shadow-[0_12px_32px_rgba(59,130,246,0.08)]
focus:outline-none
focus:border-violet-200
focus:bg-white/78
transition-all duration-250
"
                  />

                  <input
                    type="text"
                    placeholder="Last name (optional)"
                    value={authLastName}
                    onChange={(e) => setAuthLastName(e.target.value)}
                    className="
w-full
px-5 py-4
rounded-[1.4rem]
bg-white/62
backdrop-blur-xl
border border-sky-100/80
text-slate-700
placeholder:text-slate-400
shadow-[0_12px_32px_rgba(59,130,246,0.08)]
focus:outline-none
focus:border-violet-200
focus:bg-white/78
transition-all duration-250
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
px-5 py-4
rounded-[1.4rem]
bg-white/62
backdrop-blur-xl
border border-sky-100/80
text-slate-700
placeholder:text-slate-400
shadow-[0_12px_32px_rgba(59,130,246,0.08)]
focus:outline-none
focus:border-violet-200
focus:bg-white/78
transition-all duration-250
"
              />

              <input
                type="password"
                placeholder="Password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="
w-full
px-5 py-4
rounded-[1.4rem]
bg-white/62
backdrop-blur-xl
border border-sky-100/80
text-slate-700
placeholder:text-slate-400
shadow-[0_12px_32px_rgba(59,130,246,0.08)]
focus:outline-none
focus:border-violet-200
focus:bg-white/78
transition-all duration-250
"
              />

              {authMode === 'signup' && (
                <>
                  <div className="pt-2">
                    <p className="text-sm font-medium text-slate-700 mb-3">
                      What best describes your skating level?
                    </p>

                    <SkaterLevelSelector
                      skaterLevel={skaterLevel}
                      setSkaterLevel={setSkaterLevel}
                    />
                  </div>
                  <div className="space-y-4 pt-3">
                    <input
                      type="text"
                      placeholder="Highest jump (optional)"
                      value={highestJump}
                      onChange={(e) => setHighestJump(e.target.value)}
                      className="
w-full

px-5 py-4

rounded-[1.4rem]

bg-white/72
backdrop-blur-xl

border border-sky-100/80

text-slate-700
placeholder:text-slate-400

shadow-[0_8px_24px_rgba(15,23,42,0.04)]

focus:outline-none
focus:border-sky-200
focus:bg-sky-50/80

transition-all duration-250
"
                    />

                    <input
                      type="text"
                      placeholder="Highest test level (optional)"
                      value={highestTestLevel}
                      onChange={(e) => setHighestTestLevel(e.target.value)}
                      className="
w-full

px-5 py-4

rounded-[1.4rem]

bg-white/72
backdrop-blur-xl

border border-sky-100/80

text-slate-700
placeholder:text-slate-400

shadow-[0_8px_24px_rgba(15,23,42,0.04)]

focus:outline-none
focus:border-sky-200
focus:bg-sky-50/80

transition-all duration-250
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
py-4
rounded-[1.5rem]
bg-[linear-gradient(135deg,rgba(59,130,246,0.94),rgba(124,58,237,0.90))]
text-white
font-medium
shadow-[0_18px_45px_rgba(99,102,241,0.28)]
hover:shadow-[0_24px_60px_rgba(99,102,241,0.38)]
hover:scale-[1.01]
active:scale-[0.985]
transition-all duration-250
"
                >
                  Sign In
                </button>
              ) : (
                <button
                  onClick={handleSignup}
                  className="
w-full
py-4
rounded-[1.5rem]
bg-[linear-gradient(135deg,rgba(59,130,246,0.94),rgba(124,58,237,0.90))]
text-white
font-medium
shadow-[0_18px_45px_rgba(99,102,241,0.28)]
hover:shadow-[0_24px_60px_rgba(99,102,241,0.38)]
hover:scale-[1.01]
active:scale-[0.985]
transition-all duration-250
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
