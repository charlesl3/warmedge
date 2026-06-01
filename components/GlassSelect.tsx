'use client'

import { Listbox } from '@headlessui/react'
import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function GlassSelect({
  value,
  onChange,
  options,
  direction = 'down',
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  direction?: 'down' | 'up'
}) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (isMobile) {
    return (
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="
w-full px-4 py-3 rounded-2xl
bg-white/85 backdrop-blur-xl
border border-white/70
shadow-[0_10px_30px_rgba(15,23,42,0.05)]
text-left text-slate-700
appearance-none
focus:outline-none
"
        >
          {options.map((option) => (
            <option
              key={option}
              value={option === 'Not specified' ? '' : option}
            >
              {option}
            </option>
          ))}
        </select>

        <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    )
  }

  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative z-[9999] overflow-visible">
        <Listbox.Button
          className="
w-full px-4 py-3 rounded-2xl
bg-white/75 backdrop-blur-xl
border border-white/70
shadow-[0_10px_30px_rgba(15,23,42,0.05)]
text-left text-slate-700
flex items-center justify-between
"
        >
          {value || 'Not specified'}
          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
        </Listbox.Button>

        <Listbox.Options
          className={`
absolute left-0 right-0 z-[99999]
w-full max-h-[220px] overflow-y-auto overflow-x-hidden
rounded-2xl
bg-white/95 backdrop-blur-2xl
border border-white/80
shadow-[0_25px_60px_rgba(15,23,42,0.18)]
${direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'}
`}
        >
          {options.map((option) => (
            <Listbox.Option
              key={option}
              value={option === 'Not specified' ? '' : option}
              className={({ active }) =>
                `
px-4 py-3 cursor-pointer
${active ? 'bg-sky-50 text-sky-700' : 'text-slate-700'}
`
              }
            >
              {option}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  )
}
