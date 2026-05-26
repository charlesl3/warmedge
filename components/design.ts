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

export const darkBubble =
  'bg-[linear-gradient(135deg,rgba(99,102,241,0.78),rgba(168,85,247,0.72))] text-white border border-white/20 backdrop-blur-[24px] shadow-[0_20px_60px_rgba(99,102,241,0.18)]'

export const softBubble =
  'bg-white/40 backdrop-blur-[28px] border border-white/50 shadow-[0_20px_70px_rgba(15,23,42,0.05)]'
export const iconBtn =
  'h-10 w-10 rounded-2xl bg-white/72 backdrop-blur-xl border border-white/80 shadow-sm hover:bg-white hover:shadow-md active:scale-95 transition-all'

export const navBtn =
  'w-full text-left rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-white/70 hover:shadow-sm active:scale-[0.99] transition-all'

export const pillBtn =
  'rounded-full bg-white/72 backdrop-blur-xl border border-white/80 shadow-sm hover:bg-white hover:shadow-md active:scale-95 transition-all'
