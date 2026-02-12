
export default function AboutPage() {
  return (
    <main className="flex justify-center px-8 pt-44 pb-32">
      <div className="w-full max-w-3xl">

        {/* Title */}
        <h1 className="text-3xl font-semibold tracking-tight text-slate-800 mb-14 text-center">
          About WarmEdge
        </h1>

        {/* Intro */}
        <section className="mb-12">
          <p className="text-slate-700 leading-relaxed">
            WarmEdge was founded by <span className="font-medium">Charles Liu</span>, 
            an Engineering PhD from Dartmouth College and an adult figure skater.
          </p>
        </section>

        {/* Philosophy */}
        <section className="mb-12">
          <p className="text-slate-700 leading-relaxed">
            After spending countless hours at the rink, he began noticing the same small,
            recurring frustrations—details that were not dramatic enough to complain about,
            but distracting enough to affect every session. With an engineering mindset
            and firsthand rink experience, WarmEdge was built on a simple belief:
            small problems deserve proper design.
          </p>
        </section>

        {/* Product Layer */}
        <section className="mb-12">
          <p className="text-slate-700 leading-relaxed">
            WarmEdge creates minimal, purpose-built skate accessories designed to
            quietly improve consistency, comfort, and focus. No unnecessary features.
            No noise. Just thoughtful design for skaters who care about the details.
          </p>
        </section>

        {/* AI Layer */}
        <section className="mb-12">
          <h2 className="text-xl font-medium text-slate-800 mb-4">
            WarmEdge AI
          </h2>
          <p className="text-slate-700 leading-relaxed">
            WarmEdge AI is the technology arm of the brand. It powers WarmGPT,
            an AI assistant trained on real figure skating discussions and
            community experience. The goal is not to replace coaches, but to
            organize collective skating knowledge into something searchable,
            practical, and accessible.
          </p>
        </section>

        {/* Closing */}
        <section>
          <p className="text-slate-700 leading-relaxed">
            WarmEdge brings together physical design and intelligent systems.
            Because skating is already demanding. Your gear—and your information—
            should make it clearer, not more complicated.
          </p>
        </section>

      </div>
    </main>
  )
}
