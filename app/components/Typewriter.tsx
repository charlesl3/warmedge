'use client'

import { useEffect, useRef, useState } from 'react'

type TypewriterProps = {
  text: string
  speed?: number
  start?: boolean
  showCursor?: boolean
  instant?: boolean
  onComplete?: () => void
}

export default function Typewriter({
  text,
  speed = 20,          // 默认更快（聊天用）
  start = true,
  showCursor = false,
  instant = false,
  onComplete,
}: TypewriterProps) {
  const [index, setIndex] = useState(0)
  const hasCompletedRef = useRef(false)

  // 当 text 变化时重置
  useEffect(() => {
    setIndex(instant ? text.length : 0)
    hasCompletedRef.current = false
  }, [text, instant])

  useEffect(() => {
    if (!start) return
    if (instant) return

    if (index >= text.length) {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true
        onComplete?.()
      }
      return
    }

    const timer = setTimeout(() => {
      setIndex((i) => i + 1)
    }, speed)

    return () => clearTimeout(timer)
  }, [index, start, text, speed, instant, onComplete])

  return (
    <span>
      {text.slice(0, index)}
      {showCursor && index < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  )
}
