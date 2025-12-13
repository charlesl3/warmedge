export default function AboutPage() {
  return (
    <main className="flex justify-center px-8 pt-60 pb-32">
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

        {/* Background */}
        <section className="mb-12">
          <p className="text-slate-700 leading-relaxed">
            Spending countless hours at the rink, he began noticing the same small, 
            recurring frustrations—things that were not big enough to seem worth fixing, 
            but annoying enough to affect every session. With an engineering mindset 
            and firsthand rink experience, WarmEdge grew from the idea that even the 
            smallest details deserve to be designed properly.
          </p>
        </section>

        {/* Differentiation */}
        <section className="mb-14">
          <ul className="list-disc pl-5 space-y-3 text-slate-700">
            <li>Designed from real rink needs, not catalogs</li>
            <li>Focused on function, durability, and everyday usability</li>
            <li>Built by an engineer who skates, tests, and iterates</li>
          </ul>
        </section>

        {/* Closing */}
        <section>
          <p className="text-slate-700 leading-relaxed">
            WarmEdge exists to quietly solve the small but very real problems skaters 
            live with every day—the ones that do not ruin a session, but constantly 
            distract from it.
          </p>

          <p className="text-slate-700 leading-relaxed mt-6">
            Because skating is already hard enough. Your gear should NOT make it harder.
          </p>
        </section>

      </div>
    </main>
  )
}
