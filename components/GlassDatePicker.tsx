'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function GlassDatePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (date: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState<Date>(
    value ? new Date(value) : new Date()
  )
  const pickerRef = useRef<HTMLDivElement>(null)

  const selectedDate = value ? new Date(value) : null

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    )
  }

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    )
  }

  const handleDateClick = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    )
    const dateString = date.toISOString().split('T')[0]
    onChange(dateString)
    setIsOpen(false)
  }

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return 'Select a date'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const monthName = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const days = Array.from(
    { length: getDaysInMonth(currentMonth) },
    (_, i) => i + 1
  )
  const firstDay = getFirstDayOfMonth(currentMonth)
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i)

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
        {formatDisplayDate(value)}
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

p-4

animate-in fade-in duration-200
"
        >
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePreviousMonth}
              className="p-1 hover:bg-white/50 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>

            <div className="text-sm font-semibold text-slate-700">
              {monthName}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-white/50 rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div
                key={day}
                className="w-8 h-8 flex items-center justify-center text-xs font-medium text-slate-500"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} className="w-8 h-8" />
            ))}

            {days.map((day) => {
              const isSelected =
                selectedDate &&
                selectedDate.getFullYear() === currentMonth.getFullYear() &&
                selectedDate.getMonth() === currentMonth.getMonth() &&
                selectedDate.getDate() === day

              const today = new Date()
              const isToday =
                today.getFullYear() === currentMonth.getFullYear() &&
                today.getMonth() === currentMonth.getMonth() &&
                today.getDate() === day

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  className={`
w-8 h-8
flex items-center justify-center
rounded-full
text-sm
transition-all
${
  isSelected
    ? 'bg-sky-50 text-sky-700 font-medium'
    : isToday
      ? 'bg-sky-100 text-sky-600 font-medium'
      : 'text-slate-700 hover:bg-sky-50 hover:text-sky-700'
}
`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
