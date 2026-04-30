import Link from "next/link";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { TimerPanel } from "@/ui/timer-panel";
import {
  createStarterAttempt,
  type StarterAttemptDisplay,
} from "../../leetcode-db-client";
import { completeAttemptFromForm, completeDbAttemptFromForm } from "./actions";
import { createDbAttemptOrNull, getDbAttemptOrNull } from "./db-attempts";

type TimerPageProps = {
  params: Promise<{
    assignmentId: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const attemptStatuses = [
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "skipped", label: "Skipped" },
] as const;

export default async function LeetCodeTimerPage({ params, searchParams }: TimerPageProps) {
  // NOTE: This route prefers persisting attempts to Supabase, but still supports
  // the starter in-memory store when seeds are not imported yet.
  const [{ assignmentId }, search] = await Promise.all([params, searchParams]);
  const dbAttemptId = typeof search.attempt === "string" ? search.attempt : null;

  let attempt: StarterAttemptDisplay;
  let completionAction: (formData: FormData) => Promise<void>;

  try {
    if (dbAttemptId) {
      const dbAttempt = await getDbAttemptOrNull(dbAttemptId, assignmentId);
      if (dbAttempt) {
        completionAction = completeDbAttemptFromForm.bind(null, dbAttempt.attemptId);
        return (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <TimerPanel
              problemTitle={dbAttempt.title}
              startedAt={dbAttempt.startedAt}
              timeLimitMinutes={dbAttempt.timeLimitMinutes}
            />
            <aside className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  {dbAttempt.pattern} / {dbAttempt.subpattern}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  Record attempt
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Saved to Supabase when seeds are imported. Elapsed time is
                  calculated on the server from this attempt start time.
                </p>
              </div>
              <form action={completionAction} className="space-y-4">
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
                href={dbAttempt.sourceUrl}
                className="inline-flex text-sm font-semibold text-emerald-800 underline-offset-4 hover:underline"
              >
                Open problem on LeetCode
              </Link>
            </aside>
          </div>
        );
      }
    }

    // No attempt id yet: try to create a DB attempt, then redirect to stable URL.
    const created = await createDbAttemptOrNull(assignmentId);
    if (created) {
      redirect(`/leetcode/${assignmentId}/timer?attempt=${created.attemptId}`);
    }

    // Fallback to in-memory starter attempt.
    attempt = createStarterAttempt(assignmentId);
    completionAction = completeAttemptFromForm.bind(null, attempt.attemptId);
  } catch {
    notFound();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <TimerPanel
        problemTitle={attempt.title}
        startedAt={attempt.startedAt}
        timeLimitMinutes={attempt.timeLimitMinutes}
      />
      <aside className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
            {attempt.pattern} / {attempt.subpattern}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Record attempt
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Submit with a DB-valid final status. Elapsed time is calculated on
            the server from this attempt start time.
          </p>
        </div>
        <form action={completionAction} className="space-y-4">
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
          href={attempt.sourceUrl}
          className="inline-flex text-sm font-semibold text-emerald-800 underline-offset-4 hover:underline"
        >
          Open problem on LeetCode
        </Link>
      </aside>
    </div>
  );
}
