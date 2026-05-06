"use client";

import {
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import type {
  LeetcodeAttemptStatus,
  LeetcodeProblemRow,
  SaveLeetcodeAttemptAction,
} from "@/lib/leetcode/types";
import {
  getLatestLocalLeetcodeNotes,
  saveLocalLeetcodeAttempt,
} from "@/lib/leetcode/storage/local-attempt-storage";
import { useAuth } from "@/components/auth/auth-provider";

type LeetcodeAttemptOverlayButtonProps = {
  problem: LeetcodeProblemRow;
  actionLabel?: string;
  className: string;
  lastNotes?: string | null;
  saveAttemptAction?: SaveLeetcodeAttemptAction;
  onAttemptSaved?: () => void;
  children?: ReactNode;
};

const attemptStatuses: { value: LeetcodeAttemptStatus; label: string }[] = [
  { value: "completed", label: "Completed" },
  { value: "completed_overtime", label: "Completed after time limit" },
  { value: "failed", label: "Failed" },
  { value: "skipped", label: "Skipped" },
  { value: "timed_out", label: "Time ran out" },
];

const timeLimitMinutes = 30;
const timeLimitSeconds = timeLimitMinutes * 60;
const launchDelayMs = 500;
const warningThresholds = new Set([300, 60, 0]);

export function LeetcodeAttemptOverlayButton({
  problem,
  actionLabel = "Start",
  className,
  lastNotes,
  saveAttemptAction,
  onAttemptSaved,
  children,
}: LeetcodeAttemptOverlayButtonProps) {
  const { status: authStatus, getIdToken, signInWithGoogle } = useAuth();
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [endedAt, setEndedAt] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(timeLimitSeconds);
  const [resultMode, setResultMode] = useState(false);
  const [showLastNotes, setShowLastNotes] = useState(false);
  const [localLastNotes, setLocalLastNotes] = useState<string | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<LeetcodeAttemptStatus>("completed");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const openedTabRef = useRef<Window | null>(null);
  const originalTitleRef = useRef<string | null>(null);
  const warnedThresholdsRef = useRef<Set<number>>(new Set());
  const effectiveLastNotes = localLastNotes ?? lastNotes ?? null;
  const shouldSaveLocally = authStatus !== "signed-in";

  function openOverlay() {
    setLocalLastNotes(getLatestLocalLeetcodeNotes(problem.number));
    setIsOpen(true);
    setStartedAt(null);
    setEndedAt(null);
    setError(null);
    setResultMode(false);
    setShowLastNotes(false);
    setDefaultStatus("completed");
    setRemainingSeconds(timeLimitSeconds);
    warnedThresholdsRef.current = new Set();
  }

  function startAttempt() {
    openedTabRef.current = window.open("about:blank", "_blank");
    window.setTimeout(() => {
      if (openedTabRef.current) {
        openedTabRef.current.location.href = problem.leetcodeUrl;
      } else {
        window.open(problem.leetcodeUrl, "_blank");
      }
    }, launchDelayMs);

    setStartedAt(new Date().toISOString());
    setEndedAt(null);
    setResultMode(false);
    setRemainingSeconds(timeLimitSeconds);
    warnedThresholdsRef.current = new Set();
  }

  function closeOverlay() {
    if (isPending) return;

    setIsOpen(false);
    setStartedAt(null);
    setEndedAt(null);
    setResultMode(false);
    setError(null);
  }

  function showResults(status: LeetcodeAttemptStatus = remainingSeconds === 0 ? "timed_out" : "completed") {
    if (!startedAt) return;

    setEndedAt(new Date().toISOString());
    setDefaultStatus(status);
    setResultMode(true);
  }

  function submitAttempt(formData: FormData) {
    const status = String(formData.get("status")) as LeetcodeAttemptStatus;
    const notes = String(formData.get("notes") ?? "").trim();

    if (!startedAt || !endedAt) {
      setError("Unable to save this attempt right now.");
      return;
    }

    const input = {
      problemId: problem.number,
      status,
      startedAt,
      endedAt,
      notes: notes || null,
    };

    if (shouldSaveLocally) {
      saveLocalLeetcodeAttempt(problem, input);
      onAttemptSaved?.();
      setIsOpen(false);
      setStartedAt(null);
      setEndedAt(null);
      setResultMode(false);
      setError(null);
      return;
    }

    if (!saveAttemptAction) {
      setError("Unable to save this attempt right now.");
      return;
    }

    startTransition(async () => {
      try {
        const idToken = await getIdToken();

        await saveAttemptAction({ ...input, idToken });
        onAttemptSaved?.();
        setIsOpen(false);
        setStartedAt(null);
        setEndedAt(null);
        setResultMode(false);
        setError(null);
      } catch {
        setError("Attempt could not be saved. Try again.");
      }
    });
  }

  useEffect(() => {
    if (!startedAt || endedAt) return;

    originalTitleRef.current = document.title;

    const intervalId = window.setInterval(() => {
      const elapsedSeconds = Math.max(
        0,
        Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
      );
      const nextRemainingSeconds = Math.max(0, timeLimitSeconds - elapsedSeconds);

      setRemainingSeconds(nextRemainingSeconds);
      document.title = `${formatRemainingTime(nextRemainingSeconds)} - ${problem.title}`;

      if (
        warningThresholds.has(nextRemainingSeconds) &&
        !warnedThresholdsRef.current.has(nextRemainingSeconds)
      ) {
        warnedThresholdsRef.current.add(nextRemainingSeconds);
        playWarningSound();
      }

      if (nextRemainingSeconds === 0) {
        setEndedAt(new Date().toISOString());
        setDefaultStatus("timed_out");
        setResultMode(true);
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
      if (originalTitleRef.current !== null) {
        document.title = originalTitleRef.current;
      }
    };
  }, [endedAt, problem.title, startedAt]);

  return (
    <>
      <button type="button" className={`${className} cursor-pointer`} onClick={openOverlay}>
        {children ?? actionLabel}
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center bg-black/70 p-4"
          onClick={closeOverlay}
        >
          <div
            className="grid max-h-[calc(100vh-2rem)] w-full max-w-5xl cursor-default overflow-y-auto rounded-2xl border border-[#26364d] bg-[#0b1626] shadow-2xl shadow-black/60 lg:grid-cols-[minmax(0,1fr)_22rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <section className="bg-slate-950 p-6 text-white sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8f73ff]">
                    Timed LeetCode attempt
                  </p>
                  <h2 id={titleId} className="mt-4 text-3xl font-bold tracking-tight">
                    {problem.title}
                  </h2>
                  <p className="mt-3 text-base text-slate-300">
                    {problem.pattern} / {problem.subPattern}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Review your last notes first, then start the timer when you are ready.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close attempt overlay"
                  className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-lg border border-slate-700 text-xl text-slate-300 transition hover:border-slate-500 hover:text-white"
                  onClick={closeOverlay}
                >
                  ×
                </button>
              </div>

              <div className="mt-8">
                <div className="rounded-3xl bg-white/10 p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                    Time remaining
                  </p>
                  <p
                    aria-label="Time remaining"
                    className="mt-2 font-mono text-6xl font-bold tracking-tight text-emerald-200"
                  >
                    {formatRemainingTime(remainingSeconds)}
                  </p>
                </div>
              </div>

              {!startedAt ? (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    className="cursor-pointer rounded-xl bg-[#6747ff] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#775bff]"
                    onClick={startAttempt}
                  >
                    Start timer
                  </button>
                  <button
                    type="button"
                    className="cursor-pointer rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-slate-500 hover:text-white"
                    onClick={() => setShowLastNotes((current) => !current)}
                  >
                    {showLastNotes ? "Hide last notes" : "Show last notes"}
                  </button>
                </div>
              ) : !resultMode ? (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    className="cursor-pointer rounded-xl bg-[#6747ff] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#775bff]"
                    onClick={() => showResults()}
                  >
                    Finish attempt
                  </button>
                  <button
                    type="button"
                    className="cursor-pointer rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-slate-500 hover:text-white"
                    onClick={() => showResults("skipped")}
                  >
                    Skip
                  </button>
                </div>
              ) : null}
            </section>

            <aside className="space-y-5 p-6 text-slate-200">
              {shouldSaveLocally ? (
                <div className="rounded-xl border border-[#ff8b3d]/30 bg-[#41271d] p-4 text-sm leading-6 text-[#ffd6ba]">
                  You are not signed in. Attempts will save to this browser only.{" "}
                  {authStatus === "signed-out" ? (
                    <>
                      <button
                        type="button"
                        className="cursor-pointer font-bold underline underline-offset-4"
                        onClick={() => void signInWithGoogle()}
                      >
                        Sign in
                      </button>{" "}
                      to persist them.
                    </>
                  ) : null}
                </div>
              ) : null}

              {!startedAt ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Ready to start</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      The problem tab will open only after you start the timer.
                    </p>
                  </div>
                  {showLastNotes ? (
                    <div className="rounded-xl border border-[#26364d] bg-[#101a2a] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        Last notes
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                        {effectiveLastNotes || "No notes yet."}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : !resultMode ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Attempt running</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Solve in LeetCode, then come back here to record the result.
                    </p>
                  </div>
                  <a
                    href={problem.leetcodeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-sm font-semibold text-[#a48bff] underline-offset-4 hover:underline"
                  >
                    Open problem on LeetCode
                  </a>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-xl font-bold text-white">Record attempt</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Submit the result when the attempt is done.
                    </p>
                  </div>

                  <form action={submitAttempt} className="space-y-4">
                    <fieldset className="space-y-3">
                      <legend className="text-sm font-semibold text-slate-300">
                        Final status
                      </legend>
                      {attemptStatuses.map((status) => (
                        <label
                          key={status.value}
                          className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#26364d] bg-[#101a2a] px-4 py-3 text-sm font-semibold text-slate-200"
                        >
                          <input
                            type="radio"
                            name="status"
                            value={status.value}
                            defaultChecked={status.value === defaultStatus}
                            className="size-4 accent-[#6747ff]"
                          />
                          {status.label}
                        </label>
                      ))}
                    </fieldset>

                    <label className="block text-sm font-semibold text-slate-300">
                      Notes
                      <textarea
                        name="notes"
                        rows={3}
                        maxLength={200}
                        defaultValue={effectiveLastNotes ?? ""}
                        className="mt-2 w-full rounded-xl border border-[#26364d] bg-[#101a2a] p-3 text-sm text-slate-100 outline-none transition focus:border-[#6747ff]"
                      />
                    </label>

                    {error ? <p className="text-sm font-semibold text-[#ff6f91]">{error}</p> : null}

                    <button
                      type="submit"
                      className="w-full cursor-pointer rounded-xl bg-[#6747ff] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#775bff] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isPending}
                    >
                      {isPending ? "Saving..." : "Save attempt"}
                    </button>
                  </form>
                </>
              )}
            </aside>
          </div>
        </div>
      ) : null}
    </>
  );
}

function formatRemainingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function playWarningSound() {
  const AudioContextCtor = window.AudioContext;

  if (!AudioContextCtor) return;

  const audioContext = new AudioContextCtor();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.frequency.value = 880;
  gain.gain.value = 0.04;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.12);
}
