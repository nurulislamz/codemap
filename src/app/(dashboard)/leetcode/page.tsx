import { TaskCard } from "@/components/task-card";
import { starterLeetCodeAssignments } from "./assignments";

export default function LeetCodePage() {
  return (
    <div className="space-y-10">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-800">
          LeetCode practice
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
          Pattern-first timed attempts
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-700">
          Start with focused starter tasks that map common backend interview
          problems to repeatable techniques.
        </p>
      </section>
      <section
        aria-label="LeetCode starter tasks"
        className="grid gap-5 md:grid-cols-2"
      >
        {starterLeetCodeAssignments.map((assignment) => (
          <TaskCard
            key={assignment.id}
            track={`${assignment.pattern} / ${assignment.subpattern}`}
            title={assignment.problemTitle}
            description={`${assignment.description} Target: ${assignment.timeLimitMinutes} minutes.`}
            actionHref={`/leetcode/${assignment.id}/timer`}
            actionLabel="Start timer"
          />
        ))}
      </section>
    </div>
  );
}
