'use client'

import { Listbox } from '@headlessui/react'
import { ChevronDown } from 'lucide-react'

export default function GlassSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <Listbox.Button
          className="
w-full
px-4 py-3

rounded-2xl

bg-white/75
backdrop-blur-xl

border border-white/70

shadow-[0_10px_30px_rgba(15,23,42,0.05)]

text-left
text-slate-700

flex items-center justify-between
"
        >
          {value || 'Not specified'}

          <ChevronDown className="w-4 h-4 text-slate-500" />
        </Listbox.Button>

        <Listbox.Options
          className="
absolute

z-[99999]

mt-2
w-full

max-h-[280px]
overflow-y-auto

rounded-2xl

bg-white/92
backdrop-blur-2xl

border border-white/70

shadow-[0_25px_60px_rgba(15,23,42,0.12)]

overflow-x-hidden
"
        >
          {options.map((option) => (
            <Listbox.Option
              key={option}
              value={option}
              className={({ active }) =>
                `
px-4 py-3
cursor-pointer

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
