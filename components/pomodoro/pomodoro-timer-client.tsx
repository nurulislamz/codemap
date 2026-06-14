"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { CountdownTimer } from "@/components/ui/timer-panel";
import { AppPanel } from "@/components/shared";
import type { PomodoroSession } from "@/lib/firebase/pomodoro";
import type { SavePomodoroSessionInput } from "@/lib/pomodoro/actions";
import {
  getLocalPomodoroSessions,
  saveLocalPomodoroSession,
} from "@/lib/pomodoro/local-session-storage";
import {
  formatAttemptDate,
  formatSecondsDuration,
} from "@/lib/leetcode/leetcode-formatters";

type PomodoroTimerClientProps = {
  saveSessionAction: (input: SavePomodoroSessionInput) => Promise<void>;
};

type SessionsResponse = {
  sessions?: PomodoroSession[];
};

const targetMinuteOptions = [15, 25, 50] as const;

export function PomodoroTimerClient({ saveSessionAction }: PomodoroTimerClientProps) {
  const { status: authStatus, user, getIdToken, signInWithGoogle } = useAuth();
  const [targetMinutes, setTargetMinutes] = useState<number>(25);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const shouldSaveLocally = authStatus !== "signed-in";

  const loadSessions = useCallback(
    async (signal?: AbortSignal) => {
      if (authStatus !== "signed-in" || !user) {
        setSessions(getLocalPomodoroSessions().slice(0, 20));
        return;
      }

      try {
        const idToken = await getIdToken();
        const response = await fetch("/api/pomodoro/sessions", {
          cache: "no-store",
          headers: idToken ? { authorization: `Bearer ${idToken}` } : {},
          signal,
        });

        if (!response.ok) {
          console.warn(`Pomodoro sessions request failed: ${response.status}`);
          return;
        }

        const data = (await response.json()) as SessionsResponse;
        setSessions(data.sessions ?? []);
      } catch (error) {
        if (!signal?.aborted) {
          console.warn("Pomodoro sessions request failed", error);
        }
      }
    },
    [authStatus, getIdToken, user],
  );

  useEffect(() => {
    if (authStatus === "loading") {
      return;
    }

    const controller = new AbortController();
    // Defer off the synchronous effect body to avoid a cascading render.
    const timeoutId = window.setTimeout(() => void loadSessions(controller.signal), 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [authStatus, loadSessions]);

  function startSession() {
    setMessage(null);
    setStartedAt(new Date().toISOString());
  }

  function discardSession() {
    setStartedAt(null);
    setMessage("Session discarded.");
  }

  function finishSession(completed: boolean) {
    if (!startedAt) return;

    const sessionStart = startedAt;
    const endedAt = new Date().toISOString();
    setStartedAt(null);

    if (completed) {
      playCompletionChime();
    }

    startTransition(async () => {
      const durationSeconds = Math.max(
        1,
        Math.floor(
          (new Date(endedAt).getTime() - new Date(sessionStart).getTime()) / 1000,
        ),
      );

      if (shouldSaveLocally) {
        saveLocalPomodoroSession({
          sessionId: crypto.randomUUID(),
          startedAt: sessionStart,
          endedAt,
          durationSeconds,
          targetMinutes,
          completed,
        });
        setSessions(getLocalPomodoroSessions().slice(0, 20));
        setMessage("Saved locally.");
        return;
      }

      try {
        const idToken = await getIdToken();

        if (!idToken) {
          setMessage("Sign in again before saving.");
          return;
        }

        await saveSessionAction({
          startedAt: sessionStart,
          endedAt,
          targetMinutes,
          completed,
          idToken,
        });
        setMessage(completed ? "Session complete. Saved." : "Stopped early. Saved.");
        await loadSessions();
      } catch (saveError) {
        console.error("Failed to save pomodoro session", saveError);
        setMessage("Session could not be saved. Try again.");
      }
    });
  }

  const todaySeconds = sessions
    .filter((session) => isToday(session.startedAt))
    .reduce((total, session) => total + session.durationSeconds, 0);

  return (
    <div className="space-y-5">
      {shouldSaveLocally && authStatus !== "loading" ? (
        <div className="rounded-xl border border-[#ff8b3d]/30 bg-[#41271d] p-4 text-sm leading-6 text-[#ffd6ba]">
          You are not signed in. Sessions will save to this browser only.{" "}
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

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <AppPanel className="p-7">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Focus timer</h2>
          <p className="mt-2 text-base text-slate-300/72">
            Pick a length, start the timer, and stay on one task until it rings.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {targetMinuteOptions.map((minutes) => (
              <button
                key={minutes}
                type="button"
                disabled={startedAt !== null}
                className={`cursor-pointer rounded-xl border px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  targetMinutes === minutes
                    ? "border-[#7c68ff] bg-[#241d55] text-white"
                    : "border-[#26364d] bg-[#101a2a] text-slate-200 hover:border-[#516278]"
                }`}
                onClick={() => setTargetMinutes(minutes)}
              >
                {minutes} min
              </button>
            ))}
          </div>

          <div className="mt-6">
            {startedAt ? (
              <CountdownTimer
                label="Focus remaining"
                startedAt={startedAt}
                timeLimitMinutes={targetMinutes}
                onComplete={() => finishSession(true)}
              />
            ) : (
              <div className="rounded-3xl bg-white/10 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Focus remaining
                </p>
                <p className="mt-2 font-mono text-6xl font-bold tracking-tight text-emerald-200">
                  {targetMinutes}:00
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {!startedAt ? (
              <button
                type="button"
                disabled={isPending}
                className="cursor-pointer rounded-xl bg-[#6747ff] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#775bff] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={startSession}
              >
                {isPending ? "Saving..." : "Start focus session"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="cursor-pointer rounded-xl bg-[#6747ff] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#775bff]"
                  onClick={() => finishSession(false)}
                >
                  Stop and save
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-slate-500 hover:text-white"
                  onClick={discardSession}
                >
                  Discard
                </button>
              </>
            )}
          </div>

          {message ? (
            <p className="mt-4 text-sm font-semibold text-slate-400" role="status">
              {message}
            </p>
          ) : null}
        </AppPanel>

        <AppPanel className="self-start p-7 text-center">
          <div className="text-base font-extrabold uppercase tracking-[0.12em] text-[#a997ff]">
            Focused today
          </div>
          <div className="mt-4 font-mono text-5xl font-extrabold text-white">
            {formatSecondsDuration(todaySeconds)}
          </div>
          <div className="mt-3 text-base text-slate-300/72">
            {sessions.filter((session) => isToday(session.startedAt)).length} sessions
          </div>
        </AppPanel>
      </section>

      <AppPanel className="p-7">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Recent sessions</h2>
        <p className="mt-2 text-base text-slate-300/72">
          Latest saved focus sessions.
        </p>

        <div className="mt-5 space-y-3">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <div
                key={session.sessionId}
                className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-[#0b1320]/55 p-4"
              >
                <div>
                  <div className="font-bold leading-snug text-white">
                    {formatSecondsDuration(session.durationSeconds)} focus
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-300/60">
                    {formatAttemptDate(session.startedAt)} · {session.targetMinutes} min target
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    session.completed
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-amber-400/10 text-amber-300"
                  }`}
                >
                  {session.completed ? "Completed" : "Stopped early"}
                </span>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-white/10 bg-[#0b1320]/55 p-4 text-sm text-slate-300/70">
              No sessions recorded yet.
            </div>
          )}
        </div>
      </AppPanel>
    </div>
  );
}

function isToday(isoDate: string) {
  const date = new Date(isoDate);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function playCompletionChime() {
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
  oscillator.stop(audioContext.currentTime + 0.4);
}
