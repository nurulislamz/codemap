export default function FlashcardsPage() {
  return (
    <div className="space-y-10">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-800">
          Flashcards
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
          Due-card review
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-700">
          A starter review surface for weak backend concepts. Scheduling and
          persisted recall ratings arrive in later tasks.
        </p>
      </section>
      <article className="max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
          Due today
        </p>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
          What happens during DNS resolution?
        </h2>
        <p className="mt-3 leading-7 text-slate-600">
          Answer from memory first, then open the hint if you need a nudge.
        </p>
        <details className="mt-5 rounded-2xl border border-slate-200 bg-[#fffaf0] p-4">
          <summary className="cursor-pointer font-semibold text-slate-900">
            Show hint
          </summary>
          <p className="mt-3 leading-7 text-slate-700">
            Think resolver, root nameserver, TLD nameserver, authoritative
            nameserver, record lookup, and TTL.
          </p>
        </details>
      </article>
    </div>
  );
}
