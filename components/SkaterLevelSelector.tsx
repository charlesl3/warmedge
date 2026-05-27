type Props = {
  skaterLevel: string
  setSkaterLevel: (value: string) => void
}

const levels = [
  {
    value: 'beginner',
    label: 'Beginner',
    tooltip: 'New skater or early foundational skills',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    tooltip: 'Typically passed Adult Gold or similar level',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    tooltip: 'Typically passed Novice level or higher',
  },
  {
    value: 'non_skater',
    label: 'Non-skater',
    tooltip: 'For parents, friends, or skating fans',
  },
]

export default function SkaterLevelSelector({
  skaterLevel,
  setSkaterLevel,
}: Props) {
  return (
    <div className="space-y-3">
      {levels.map((level) => (
        <div key={level.value} className="relative group">
          <label
            className="
flex items-center gap-3

w-full

px-4 py-5

rounded-[1.5rem]

bg-white/45
backdrop-blur-xl

border border-white/70

cursor-pointer

hover:bg-[linear-gradient(135deg,rgba(224,242,254,0.92),rgba(186,230,253,0.72))]
hover:border-sky-200

transition-all duration-200
"
          >
            <input
              type="radio"
              value={level.value}
              checked={skaterLevel === level.value}
              onChange={(e) => setSkaterLevel(e.target.value)}
            />

            <span className="text-slate-700 font-medium">{level.label}</span>
          </label>

          <div
            className="
absolute

right-4
top-full
mt-2

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
            {level.tooltip}
          </div>
        </div>
      ))}
    </div>
  )
}
