'use client'

import { useEffect, useState } from 'react'

type TypewriterProps = {
  text: string
  speed?: number
  start?: boolean
  onComplete?: () => void
}

export default function Typewriter({
  text,
  speed = 160,
  start = true,
  onComplete,
}: TypewriterProps) {
  const [index, setIndex] = useState(0)


  useEffect(() => {
    setIndex(0)
  }, [text])

  useEffect(() => {
    if (!start) return
    if (index >= text.length) {
      onComplete?.()
      return
    }

    const timer = setTimeout(() => {
      setIndex((i) => i + 1)
    }, speed)

    return () => clearTimeout(timer)
  }, [index, start, text, speed, onComplete])


  return <span>{text.slice(0, index)}</span>
}
