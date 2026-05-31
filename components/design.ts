export const appShell = `
h-[100dvh]
flex
relative
overflow-hidden
text-slate-900

bg-[#edf6ff]

before:absolute
before:inset-0
before:pointer-events-none
before:z-0
before:bg-[radial-gradient(circle_at_15%_10%,rgba(56,189,248,0.20),transparent_25%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.16),transparent_25%),radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.10),transparent_35%)]

after:absolute
after:inset-0
after:pointer-events-none
after:z-0
`
export const glass =
  'bg-white/58 backdrop-blur-2xl border border-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.10)]'

export const glassStrong =
  'bg-white/78 backdrop-blur-2xl border border-white/80 shadow-[0_28px_90px_rgba(15,23,42,0.13)]'

export const portalCard = `
bg-white/78
backdrop-blur-2xl

border border-white/80

rounded-[28px]

shadow-[0_24px_80px_rgba(15,23,42,0.10)]

p-6
`

export const darkBubble =
  'bg-[linear-gradient(135deg,rgba(99,102,241,0.78),rgba(168,85,247,0.72))] text-white border border-white/20 backdrop-blur-[24px] shadow-[0_20px_60px_rgba(99,102,241,0.18)]'

export const softBubble = `
relative overflow-hidden

bg-[linear-gradient(
145deg,
rgba(255,255,255,0.86),
rgba(245,249,255,0.80),
rgba(232,242,255,0.76)
)]

backdrop-blur-[34px]

border-[2.8px]
border-[#38bdf8]

rounded-[2rem]

shadow-[

0_0_0_1px_rgba(255,255,255,0.72),

0_0_14px_rgba(56,189,248,0.72),

0_0_32px_rgba(14,165,233,0.58),

0_0_68px_rgba(37,99,235,0.42),

0_0_120px_rgba(59,130,246,0.28),

0_28px_85px_rgba(37,99,235,0.16)

]

before:absolute
before:inset-0
before:pointer-events-none
before:rounded-[inherit]

before:bg-[linear-gradient(
135deg,
rgba(255,255,255,0.70),
transparent_26%,
transparent_72%,
rgba(125,211,252,0.10)
)]

after:absolute
after:inset-0
after:pointer-events-none
after:rounded-[inherit]

after:border-[1.8px]
after:border-cyan-200/65

after:shadow-[

inset_0_0_20px_rgba(255,255,255,0.36),

inset_0_0_52px_rgba(56,189,248,0.34),

inset_0_0_90px_rgba(37,99,235,0.16)

]
`

export const iconBtn = `
relative

h-10 w-10

rounded-2xl

bg-[linear-gradient(
145deg,
rgba(255,255,255,0.82),
rgba(255,255,255,0.58)
)]

backdrop-blur-2xl

border border-white/70

text-slate-700

shadow-[0_10px_35px_rgba(15,23,42,0.07)]

overflow-hidden

before:absolute
before:inset-0
before:pointer-events-none

before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),transparent_40%)]

hover:bg-white
hover:border-sky-100

hover:text-sky-700

hover:shadow-[0_14px_40px_rgba(14,165,233,0.14)]

active:scale-95

transition-all duration-250
`

export const navBtn = `
w-full text-left

rounded-2xl

px-4 py-3

text-sm font-medium
text-slate-700

bg-white/18
backdrop-blur-xl

border border-white/40

shadow-[0_6px_24px_rgba(15,23,42,0.04)]

hover:bg-white/55
hover:border-white/70
hover:shadow-[0_14px_40px_rgba(14,165,233,0.10)]

hover:text-sky-700

active:scale-[0.985]

transition-all duration-250
`

export const pillBtn = `
rounded-full

bg-white/28
backdrop-blur-xl

border border-white/50

text-slate-700

shadow-[0_8px_24px_rgba(15,23,42,0.05)]

hover:bg-white/65
hover:border-sky-200
hover:text-sky-700

hover:shadow-[0_12px_35px_rgba(14,165,233,0.12)]

active:scale-95

transition-all duration-250
`

export const hoverTooltip = `
absolute

px-3 py-1.5

text-[11px]
font-medium
text-slate-600

bg-[linear-gradient(
145deg,
rgba(255,255,255,0.82),
rgba(255,255,255,0.62)
)]

backdrop-blur-2xl

border border-white/80

rounded-xl

shadow-[0_10px_30px_rgba(15,23,42,0.08)]

opacity-0
group-hover:opacity-100

transition-all duration-200

pointer-events-none
whitespace-nowrap
z-50
`
