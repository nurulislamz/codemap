import { TaskCard } from "@/components/task-card";

const starterCards = [
  {
    track: "LeetCode",
    title: "Pattern practice",
    description: "Review today's algorithm assignment and start a timed attempt.",
    actionHref: "/leetcode",
    actionLabel: "Open LeetCode",
  },
  {
    track: "Roadmap",
    title: "Backend fundamentals",
    description: "Continue the next reading from the backend engineering roadmap.",
    actionHref: "/dashboard/roadmap",
    actionLabel: "Open Roadmap",
  },
  {
    track: "System Design",
    title: "Design prompt",
    description: "Practice a focused architecture prompt with expected concepts.",
    actionHref: "/dashboard/system-design",
    actionLabel: "Open Prompts",
  },
  {
    track: "Flashcards",
    title: "Due reviews",
    description: "Review weak areas and keep spaced repetition moving.",
    actionHref: "/dashboard/flashcards",
    actionLabel: "Review Cards",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-800">
          Today&apos;s focus
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
          Backend interview command center
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-700">
          A private dashboard for LeetCode practice, roadmap study, system
          design reps, and flashcard reviews.
        </p>
      </section>
      <section
        aria-label="Starter tasks"
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
      >
        {starterCards.map((card) => (
          <TaskCard key={card.track} {...card} />
        ))}
      </section>
    </div>
  );
}
