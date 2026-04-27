import { TaskCard } from "@/components/task-card";
import { getSeedContent } from "@/server/data/seed-content";
import { listLeetcodePatternsFromDb } from "@/server/data/leetcode-patterns-db";
import { starterLeetCodeAssignments } from "./assignments";

export default async function LeetCodePage() {
  const seed = await getSeedContent();
  const dbPatterns = await listLeetcodePatternsFromDb();

  function parseProblemsCsv(value: string): string[] {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }

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

      <section aria-label="LeetCode pattern library" className="space-y-6">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Pattern library
          </h2>
          <p className="mt-2 text-base leading-7 text-slate-700">
            Loaded from the local SQLite database when available. Falls back to Markdown seeds.
          </p>
        </div>

        <div className="space-y-8">
          {dbPatterns.length
            ? (() => {
                const rows = dbPatterns.flatMap((major) =>
                  major.minors.flatMap((minor) => {
                    const problems = parseProblemsCsv(minor.problemsCsv);
                    return (problems.length ? problems : ["—"]).map((problem, idx) => ({
                      major: major.name,
                      minor: minor.name,
                      problem,
                      key: `${minor.id}:${idx}`,
                    }));
                  }),
                );

                return (
                  <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full border-collapse text-left text-sm">
                      <thead className="bg-[#fffaf0] text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                        <tr>
                          <th className="px-5 py-4">Major</th>
                          <th className="px-5 py-4">Minor</th>
                          <th className="px-5 py-4">Problem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, idx) => (
                          <tr
                            key={row.key}
                            className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}
                          >
                            <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                              {row.major}
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-slate-800">
                              {row.minor}
                            </td>
                            <td className="min-w-[32rem] px-5 py-4 leading-6 text-slate-700">
                              {row.problem}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()
            : seed.leetcode.patterns.map((pattern) => {
                const subpatterns = seed.leetcode.subpatterns.filter(
                  (subpattern) => subpattern.patternSlug === pattern.slug,
                );

                return (
                  <section key={pattern.slug} className="space-y-4">
                    <header className="max-w-3xl">
                      <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                        {pattern.name}
                      </h3>
                      <p className="mt-2 leading-7 text-slate-600">{pattern.description}</p>
                    </header>

                    <div className="space-y-6">
                      {subpatterns.map((subpattern) => {
                        const problems = seed.leetcode.problems.filter(
                          (problem) => problem.subpatternSlug === subpattern.slug,
                        );

                        return (
                          <div key={subpattern.slug} className="space-y-4">
                            <div className="max-w-3xl">
                              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-800">
                                {subpattern.name}
                              </p>
                              {subpattern.description ? (
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  {subpattern.description}
                                </p>
                              ) : null}
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                              {problems.map((problem) => (
                                <TaskCard
                                  key={problem.slug}
                                  track={`${problem.difficulty} • ${problem.estimatedMinutes} min`}
                                  title={problem.title}
                                  description={
                                    problem.tags.length ? `Tags: ${problem.tags.join(", ")}` : undefined
                                  }
                                  actionHref={problem.sourceUrl}
                                  actionLabel="Open problem"
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
        </div>
      </section>
    </div>
  );
}
