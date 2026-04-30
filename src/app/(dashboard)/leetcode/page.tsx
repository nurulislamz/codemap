import { getLeetcodePatternTree } from "@/lib/leetcode-patterns";

function difficultyBadgeClasses(difficulty: string) {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "medium":
      return "bg-amber-100 text-amber-900 border-amber-300";
    case "hard":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-slate-100 text-slate-800 border-slate-300";
  }
}

export default async function LeetCodePage() {
  const patternTree = getLeetcodePatternTree();

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
      <section aria-label="LeetCode pattern library" className="space-y-6">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Pattern library
          </h2>
          <p className="mt-2 text-base leading-7 text-slate-700">
            Loaded from the local JSON pattern data.
          </p>
        </div>

        <div className="space-y-8">
          {patternTree.map((pattern) => (
            <section key={pattern.topPattern} className="space-y-4">
              <header className="max-w-3xl">
                <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                  {pattern.topPattern}
                </h3>
              </header>

              <div className="space-y-8">
                {pattern.subPatterns.map((subPattern) => (
                  <div key={`${pattern.topPattern}:${subPattern.subPattern}`} className="space-y-4">
                    <div className="max-w-3xl">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-800">
                        {subPattern.subPattern}
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {subPattern.problems.map((problem) => {
                        return (
                          <article
                            key={`${pattern.topPattern}:${subPattern.subPattern}:${problem.number}:${problem.title}`}
                            className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                          >
                            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
                              {`${pattern.topPattern} / ${subPattern.subPattern}`}
                            </p>
                            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                              {problem.title}
                            </h2>
                            <span
                              className={`mt-3 inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${difficultyBadgeClasses(
                                problem.difficulty
                              )}`}
                            >
                              {problem.difficulty}
                            </span>
                            <p className="mt-3 flex-1 text-base leading-7 text-slate-600">
                              {`No. ${problem.number} • Difficulty: ${problem.difficulty}`}
                            </p>
                            <div className="mt-6 flex flex-wrap gap-2">
                              <a
                                href={`/leetcode/${problem.number}/timer`}
                                className="inline-flex w-fit rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-950"
                              >
                                Start timer
                              </a>
                              <a
                                href={problem.leetcodeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex w-fit rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                              >
                                Open LeetCode
                              </a>
                              {problem.solutions?.neetcode?.textUrl ? (
                                <a
                                  href={problem.solutions.neetcode.textUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex w-fit rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-emerald-700 hover:text-emerald-800"
                                >
                                  NeetCode text
                                </a>
                              ) : null}
                              {problem.solutions?.neetcode?.videoUrl ? (
                                <a
                                  href={problem.solutions.neetcode.videoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex w-fit rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-emerald-700 hover:text-emerald-800"
                                >
                                  NeetCode video
                                </a>
                              ) : null}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
