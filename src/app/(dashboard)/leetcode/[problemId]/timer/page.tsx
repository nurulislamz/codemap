import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeetcodePatternTree } from "@/lib/leetcode-patterns";
import { TimerPanel } from "@/ui/timer-panel";
import { saveLeetCodeAttemptFromForm } from "./actions";

type TimerPageProps = {
  params: Promise<{
    problemId: string;
  }>;
};

const attemptStatuses = [
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "skipped", label: "Skipped" },
] as const;

function findProblem(problemId: string) {
  for (const pattern of getLeetcodePatternTree()) {
    for (const subPattern of pattern.subPatterns) {
      const problem = subPattern.problems.find((item) => item.number === problemId);

      if (problem) {
        return {
          ...problem,
          pattern: pattern.topPattern,
          subpattern: subPattern.subPattern,
        };
      }
    }
  }

  return null;
}

export default async function LeetCodeTimerPage({ params }: TimerPageProps) {
  const { problemId } = await params;
  const problem = findProblem(problemId);

  if (!problem) {
    notFound();
  }

  const startedAt = new Date().toISOString();
  const saveAttempt = saveLeetCodeAttemptFromForm.bind(null, problemId, startedAt);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <TimerPanel
        problemTitle={problem.title}
        startedAt={startedAt}
        timeLimitMinutes={30}
      />
      <aside className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
            {problem.pattern} / {problem.subpattern}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Record attempt
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Submit the result when the attempt is done.
          </p>
        </div>
        <form action={saveAttempt} className="space-y-4">
          <input type="hidden" name="attemptId" value={crypto.randomUUID()} />
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-slate-700">
              Final status
            </legend>
            {attemptStatuses.map((status) => (
              <label
                key={status.value}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                <input
                  type="radio"
                  name="status"
                  value={status.value}
                  defaultChecked={status.value === "completed"}
                  className="size-4 accent-emerald-700"
                />
                {status.label}
              </label>
            ))}
          </fieldset>
          <button
            type="submit"
            className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Save attempt
          </button>
        </form>
        <Link
          href={problem.leetcodeUrl}
          className="inline-flex text-sm font-semibold text-emerald-800 underline-offset-4 hover:underline"
        >
          Open problem on LeetCode
        </Link>
      </aside>
    </div>
  );
}
