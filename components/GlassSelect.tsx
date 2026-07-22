'use client'

import { Listbox } from '@headlessui/react'
import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'

type OptionItem = string | { value: string; label: string }

const isObjectOption = (
  option: OptionItem
): option is { value: string; label: string } => {
  return typeof option === 'object'
}

const getOptionValue = (option: OptionItem): string => {
  if (isObjectOption(option)) {
    return option.value
  }
  return option === 'Not specified' ? '' : option
}

const getOptionLabel = (option: OptionItem): string => {
  if (isObjectOption(option)) {
    return option.label
  }
  return option
}

const getDisplayLabel = (value: string, options: OptionItem[]): string => {
  const option = options.find((opt) => getOptionValue(opt) === value)
  if (!option) return value || 'Not specified'
  return getOptionLabel(option)
}

export default function GlassSelect({
  value,
  onChange,
  options,
  direction = 'down',
}: {
  value: string
  onChange: (v: string) => void
  options: OptionItem[]
  direction?: 'down' | 'up'
}) {
  const [isMobile, setIsMobile] = useState(false)

  // Normalize options: filter out empty/invalid options
  const normalizedOptions = options
    .map((option) =>
      typeof option === 'string' ? { value: option, label: option } : option
    )
    .filter(
      (option) =>
        option &&
        typeof option.value === 'string' &&
        typeof option.label === 'string' &&
        option.label.trim() !== ''
    )

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (isMobile) {
    return (
      <div className="relative overflow-visible">
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
          {normalizedOptions.map((option) => (
            <option key={getOptionValue(option)} value={getOptionValue(option)}>
              {getOptionLabel(option)}
            </option>
          ))}
        </select>

        <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    )
  }

  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative overflow-visible">
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
          {getDisplayLabel(value, normalizedOptions)}
          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
        </Listbox.Button>

        <Listbox.Options
          className={`
absolute left-0 right-0 z-50
w-full max-h-[220px] overflow-y-auto overflow-x-hidden
rounded-2xl
bg-white/95 backdrop-blur-2xl
border border-white/80
shadow-[0_25px_60px_rgba(15,23,42,0.18)]
${direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'}
`}
        >
          {normalizedOptions.map((option) => {
            const isSelected = getOptionValue(option) === value
            return (
              <Listbox.Option
                key={getOptionValue(option)}
                value={getOptionValue(option)}
                className={({ active }) =>
                  `
px-4 py-3 cursor-pointer
${isSelected ? 'bg-sky-50 text-sky-700 font-medium' : ''}
${active && !isSelected ? 'bg-sky-50 text-sky-700' : !isSelected ? 'text-slate-700' : ''}
`
                }
              >
                {getOptionLabel(option)}
              </Listbox.Option>
            )
          })}
        </Listbox.Options>
      </div>
    </Listbox>
  )
}
