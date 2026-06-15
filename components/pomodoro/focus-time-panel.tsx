"use client";

import { useEffect, useMemo, useState } from "react";

import { AppPanel } from "@/components/shared";
import { formatSecondsDuration } from "@/lib/leetcode/leetcode-formatters";
import type { PomodoroSession } from "@/lib/firebase/pomodoro";
import {
  buildCurrentFocusStreak,
  buildFocusByDay,
  buildPomodoroStats,
  buildRecentFocusDays,
} from "@/lib/pomodoro/pomodoro-stats";
import { formatDayLabel } from "@/lib/stats/recent-days";

const RANGE_OPTIONS = [7, 14, 30] as const;
type RangeDays = (typeof RANGE_OPTIONS)[number];

type FocusTimePanelProps = {
  sessions: PomodoroSession[];
  className?: string;
};

export function FocusTimePanel({ sessions, className = "p-7" }: FocusTimePanelProps) {
  const [rangeDays, setRangeDays] = useState<RangeDays>(14);
  // The chart window, streak, and "today" highlight all depend on the current
  // date. Reading the clock during render would risk a server/client hydration
  // mismatch, so resolve "now" only after mount. Defer the set off the
  // synchronous effect body to avoid a cascading render.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => setNow(new Date()), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const stats = useMemo(() => buildPomodoroStats(sessions), [sessions]);
  const focusByDay = useMemo(() => buildFocusByDay(sessions), [sessions]);
  const focusDays = useMemo(
    () => (now ? buildRecentFocusDays(focusByDay, rangeDays, now) : []),
    [focusByDay, rangeDays, now],
  );
  const streak = useMemo(
    () => (now ? buildCurrentFocusStreak(focusByDay, now) : 0),
    [focusByDay, now],
  );

  const maxDailyFocusSeconds = Math.max(1, ...focusDays.map((day) => day.focusSeconds));
  const todayIso = now ? now.toISOString().slice(0, 10) : null;

  return (
    <AppPanel className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Focus time</h2>
          <p className="mt-2 text-base text-slate-300/72">
            Focus sessions recorded from the timer.
          </p>
        </div>
        <div
          className="flex gap-1 rounded-lg border border-[#26364d] bg-[#101a2a] p-1"
          role="group"
          aria-label="Chart range"
        >
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={option === rangeDays}
              className={`cursor-pointer rounded-md px-3 py-1 text-xs font-bold transition ${
                option === rangeDays
                  ? "bg-[#241d55] text-white"
                  : "text-slate-300 hover:text-white"
              }`}
              onClick={() => setRangeDays(option)}
            >
              {option}d
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <FocusStat label="Total focus" value={formatSecondsDuration(stats.totalFocusSeconds)} />
        <FocusStat label="Sessions" value={stats.totalSessions} />
        <FocusStat
          label="Completed"
          value={`${stats.completedSessions} (${stats.completionRate}%)`}
          valueClassName="text-emerald-300"
        />
        <FocusStat
          label="Avg session"
          value={formatSecondsDuration(stats.averageSessionSeconds ?? 0)}
        />
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-slate-300/60">
          <span>Focus over days</span>
          <span className="text-[#ff942f]">
            {streak > 0 ? `🔥 ${streak} day${streak === 1 ? "" : "s"} streak` : "No active streak"}
          </span>
        </div>
        <div className="mt-3 flex h-24 items-end gap-1.5">
          {focusDays.map((day) => {
            const isToday = day.date === todayIso;

            return (
              <div
                key={day.date}
                className="flex h-full flex-1 items-end"
                title={`${formatSecondsDuration(day.focusSeconds)} over ${day.sessions} sessions on ${formatDayLabel(day.date)}`}
              >
                <div
                  className={`w-full rounded-t-md ${
                    day.focusSeconds > 0
                      ? "bg-[#705cff] shadow-[0_0_18px_rgba(112,92,255,0.45)]"
                      : "bg-slate-600/28"
                  } ${isToday ? "ring-2 ring-[#a997ff] ring-offset-1 ring-offset-[#0b1626]" : ""}`}
                  style={{
                    height: `${Math.max(
                      4,
                      Math.round((day.focusSeconds / maxDailyFocusSeconds) * 100),
                    )}%`,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-xs font-semibold text-slate-300/60">
          <span>{formatDayLabel(focusDays[0]?.date ?? "")}</span>
          <span>{formatDayLabel(focusDays.at(-1)?.date ?? "")}</span>
        </div>
      </div>
    </AppPanel>
  );
}

function FocusStat({
  label,
  value,
  valueClassName = "text-white",
}: {
  label: string;
  value: number | string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0b1320]/55 p-4">
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-300/60">
        {label}
      </div>
      <div className={`mt-2 font-mono text-2xl font-extrabold ${valueClassName}`}>
        {value}
      </div>
    </div>
  );
}
