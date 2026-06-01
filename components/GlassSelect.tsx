'use client'

import { Listbox } from '@headlessui/react'
import { ChevronDown } from 'lucide-react'

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
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative z-[9999]">
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
w-full

max-h-[40vh]
md:max-h-[220px]

overflow-y-auto
overflow-x-hidden
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
              value={option}
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
