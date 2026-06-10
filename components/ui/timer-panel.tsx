"use client";

import { useEffect, useState } from "react";

type CountdownTimerProps = {
  startedAt: string;
  timeLimitMinutes: number;
  label?: string;
  onComplete?: () => void;
};

type TimerPanelProps = {
  problemTitle: string;
  startedAt: string;
  timeLimitMinutes: number;
};

export function CountdownTimer({
  startedAt,
  timeLimitMinutes,
  label = "Time remaining",
  onComplete,
}: CountdownTimerProps) {
  // Seed with the full limit rather than calling Date.now() during render: the
  // initializer would run on the server and again on the client with a
  // different clock, producing a hydration mismatch. The effect computes the
  // real value immediately after mount.
  const [remainingSeconds, setRemainingSeconds] = useState(
    () => timeLimitMinutes * 60,
  );

  useEffect(() => {
    function syncRemaining() {
      setRemainingSeconds((currentSeconds) => {
        const nextSeconds = calculateRemainingSeconds(startedAt, timeLimitMinutes);
        if (currentSeconds > 0 && nextSeconds === 0) {
          onComplete?.();
        }

        return nextSeconds;
      });
    }

    // Defer the first real reading off the synchronous effect body (avoids a
    // cascading render) and run subsequent updates on the interval.
    const initialId = window.setTimeout(syncRemaining, 0);
    const intervalId = window.setInterval(syncRemaining, 1000);

    return () => {
      window.clearTimeout(initialId);
      window.clearInterval(intervalId);
    };
  }, [onComplete, startedAt, timeLimitMinutes]);

  return (
    <div className="rounded-3xl bg-white/10 p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
        {label}
      </p>
      <p
        aria-label={label}
        className="mt-2 font-mono text-6xl font-bold tracking-tight text-emerald-200"
      >
        {formatRemainingTime(remainingSeconds)}
      </p>
    </div>
  );
}

export function TimerPanel({
  problemTitle,
  startedAt,
  timeLimitMinutes,
}: TimerPanelProps) {
  return (
    <section className="rounded-[2rem] border border-slate-900/10 bg-slate-950 p-8 text-white shadow-xl">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
        Timed LeetCode attempt
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
        {problemTitle}
      </h1>
      <p className="mt-3 text-base text-slate-300">{timeLimitMinutes} minute limit</p>
      <div className="mt-8">
        <CountdownTimer startedAt={startedAt} timeLimitMinutes={timeLimitMinutes} />
      </div>
    </section>
  );
}

function calculateRemainingSeconds(startedAt: string, timeLimitMinutes: number) {
  const startedTime = new Date(startedAt).getTime();
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedTime) / 1000));
  const timeLimitSeconds = timeLimitMinutes * 60;

  return Math.max(0, timeLimitSeconds - elapsedSeconds);
}

function formatRemainingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
