type Props = {
  thinking?: boolean
  speaking?: boolean
}

export default function AssistantAvatar({ thinking, speaking }: Props) {
  return (
    <div className="relative shrink-0">
      {/* glow */}
      <div
        className={`
absolute inset-0 rounded-full blur-xl opacity-60

${thinking ? 'animate-pulse' : ''}

bg-[radial-gradient(circle,rgba(139,92,246,0.35),transparent_70%)]
`}
      />

      {/* avatar */}
      <div
        className={`
relative

w-full h-full
rounded-full

bg-white/70
backdrop-blur-md

border border-white/50

shadow-[0_8px_30px_rgba(99,102,241,0.18)]

flex items-center justify-center

${speaking ? 'scale-105' : ''}

transition-all duration-300
`}
      >
        <img
          src="/logo1.jpg"
          alt="WarmGPT"
          className="w-full h-full object-cover rounded-full"
        />
      </div>
    </div>
  )
}
