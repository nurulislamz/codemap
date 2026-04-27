import { TaskCard } from "@/components/task-card";
import { buildDailyPlanItems } from "@/server/data/daily-plan";

const trackMeta: Record<string, { label: string; actionLabel: string; description: string }> = {
  leetcode: {
    label: "LeetCode",
    actionLabel: "Start timer",
    description: "Timed attempt for today's algorithm assignment.",
  },
  roadmap: {
    label: "Roadmap",
    actionLabel: "Read",
    description: "One focused backend fundamentals reading.",
  },
  system_design: {
    label: "System Design",
    actionLabel: "Practice",
    description: "One system design prompt to run as a rep.",
  },
  flashcards: {
    label: "Flashcards",
    actionLabel: "Review",
    description: "Due-card review to keep recall sharp.",
  },
};

export default async function DashboardPage() {
  const items = await buildDailyPlanItems();

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
          A private dashboard for LeetCode practice, roadmap study, system design reps,
          and flashcard reviews.
        </p>
      </section>
      <section
        aria-label="Today's plan"
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
      >
        {items.map((item) => {
          const meta = trackMeta[item.track] ?? {
            label: item.track,
            actionLabel: "Open",
            description: "",
          };

          return (
            <TaskCard
              key={`${item.track}-${item.href}`}
              track={meta.label}
              title={item.title}
              description={meta.description}
              actionHref={item.href}
              actionLabel={meta.actionLabel}
            />
          );
        })}
      </section>
    </div>
  );
}

