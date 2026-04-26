import Link from "next/link";
import { notFound } from "next/navigation";
import { TimerPanel } from "@/components/timer-panel";
import { findStarterLeetCodeAssignment } from "../../assignments";
import { completeAttemptFromForm } from "./actions";

type TimerPageProps = {
  params: Promise<{
    assignmentId: string;
  }>;
};

const attemptStatuses = [
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "skipped", label: "Skipped" },
] as const;

export default async function LeetCodeTimerPage({ params }: TimerPageProps) {
  const { assignmentId } = await params;
  const assignment = findStarterLeetCodeAssignment(assignmentId);

  if (!assignment) {
    notFound();
  }

  const startedAt = new Date().toISOString();

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <TimerPanel
        problemTitle={assignment.problemTitle}
        startedAt={startedAt}
        timeLimitMinutes={assignment.timeLimitMinutes}
      />
      <aside className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
            {assignment.pattern} / {assignment.subpattern}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Record attempt
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Submit with a DB-valid final status. Elapsed time is calculated on
            the server from this attempt start time.
          </p>
        </div>
        <form action={completeAttemptFromForm} className="space-y-4">
          <input type="hidden" name="startedAt" value={startedAt} />
          <input
            type="hidden"
            name="timeLimitMinutes"
            value={assignment.timeLimitMinutes}
          />
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
          href={assignment.sourceUrl}
          className="inline-flex text-sm font-semibold text-emerald-800 underline-offset-4 hover:underline"
        >
          Open problem on LeetCode
        </Link>
      </aside>
    </div>
  );
}
