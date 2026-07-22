'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function GlassTimePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (time: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Generate 15-minute intervals (00:00 to 23:45)
  const timeOptions = Array.from({ length: 96 }, (_, i) => {
    const hours = Math.floor(i / 4)
    const minutes = (i % 4) * 15
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  })

  const formatDisplayTime = (timeString: string) => {
    if (!timeString) return 'Select time'
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const min = parseInt(minutes)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${String(min).padStart(2, '0')} ${period}`
  }

  const handleTimeClick = (time: string) => {
    onChange(time)
    setIsOpen(false)
  }

  useEffect(() => {
    if (isOpen && scrollRef.current && value) {
      const selectedIndex = timeOptions.indexOf(value)
      if (selectedIndex !== -1) {
        const scrollTop = selectedIndex * 36 - 108 // Center the selected item
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollTop
        }, 0)
      }
    }
  }, [isOpen, value, timeOptions])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative overflow-visible" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="
w-full px-4 py-3

rounded-2xl

bg-white/75
backdrop-blur-xl

border border-white/70

text-left text-slate-700

focus:outline-none
focus:border-sky-200
focus:bg-white/85

transition-all
"
      >
        {formatDisplayTime(value)}
      </button>

      {isOpen && (
        <div
          className="
absolute z-50 mt-2 left-0

rounded-2xl

bg-white/90
backdrop-blur-xl

border border-white/80

shadow-[0_20px_60px_rgba(15,23,42,0.15)]

animate-in fade-in duration-200
"
        >
          <div
            ref={scrollRef}
            className="
h-[220px]
overflow-y-auto
scrollbar-hide
"
          >
            {timeOptions.map((time) => {
              const isSelected = time === value

              return (
                <button
                  key={time}
                  type="button"
                  onClick={() => handleTimeClick(time)}
                  className={`
w-full
px-4 py-2
text-sm
text-left
transition-all
${
  isSelected
    ? 'bg-sky-50 text-sky-700 font-medium'
    : 'text-slate-700 hover:bg-sky-50 hover:text-sky-700'
}
`}
                >
                  {formatDisplayTime(time)}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
