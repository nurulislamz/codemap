import { TaskCard } from "@/components/task-card";

const starterPrompts = [
  {
    id: "design-tinyurl",
    track: "URL Shortener",
    title: "Design TinyURL",
    description:
      "Cover ID generation, redirect reads, custom aliases, analytics tradeoffs, and cache placement.",
    actionHref: "/system-design#design-tinyurl",
  },
  {
    id: "rate-limiter",
    track: "Rate Limiter",
    title: "Design an API Rate Limiter",
    description:
      "Compare token bucket, fixed window, sliding window, distributed counters, and failure modes.",
    actionHref: "/system-design#rate-limiter",
  },
];

export default function SystemDesignPage() {
  return (
    <div className="space-y-10">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-800">
          System design practice
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
          Focused architecture reps
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-700">
          Start with common backend interview prompts. These cards are static
          until seeded system design prompts are connected to storage.
        </p>
      </section>
      <section
        aria-label="System design starter prompts"
        className="grid gap-5 md:grid-cols-2"
      >
        {starterPrompts.map((prompt) => (
          <div id={prompt.id} key={prompt.id}>
            <TaskCard
              actionHref={prompt.actionHref}
              actionLabel="Practice"
              description={prompt.description}
              title={prompt.title}
              track={prompt.track}
            />
          </div>
        ))}
      </section>
    </div>
  );
}
