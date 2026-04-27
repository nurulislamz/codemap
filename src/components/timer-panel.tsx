"use client";

import { useEffect, useState } from "react";

type TimerPanelProps = {
  problemTitle: string;
  startedAt: string;
  timeLimitMinutes: number;
};

export function TimerPanel({
  problemTitle,
  startedAt,
  timeLimitMinutes,
}: TimerPanelProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    calculateRemainingSeconds(startedAt, timeLimitMinutes),
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRemainingSeconds(calculateRemainingSeconds(startedAt, timeLimitMinutes));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [startedAt, timeLimitMinutes]);

  return (
    <section className="rounded-[2rem] border border-slate-900/10 bg-slate-950 p-8 text-white shadow-xl">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
        Timed LeetCode attempt
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
        {problemTitle}
      </h1>
      <p className="mt-3 text-base text-slate-300">{timeLimitMinutes} minute limit</p>
      <div className="mt-8 rounded-3xl bg-white/10 p-6">
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
