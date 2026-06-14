"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import {
  formatAttemptDate,
  formatSecondsDuration,
  progressWidth,
  toPercentage,
} from "@/lib/leetcode/leetcode-formatters";
import { buildLeetcodeStats } from "@/lib/leetcode/leetcode-stats";
import { hydrateLeetcodeProblemsWithAttempts } from "@/lib/leetcode/progress";
import { getLocalLeetcodeAttempts } from "@/lib/leetcode/storage/local-attempt-storage";
import type { PomodoroSession } from "@/lib/firebase/pomodoro";
import { getLocalPomodoroSessions } from "@/lib/pomodoro/local-session-storage";
import {
  buildFocusByDay,
  buildPomodoroStats,
  buildRecentFocusDays,
} from "@/lib/pomodoro/pomodoro-stats";
import {
  leetcodeProblemDifficultyLabels,
  type LeetcodeAttemptRow,
  type LeetcodeProblemRow,
} from "@/lib/leetcode/types";
import {
  CodeIcon,
  SectionHero,
  AppPanel,
  StatCard,
  primaryActionClass,
} from "@/components/shared";
import {
  QualityIcon,
  StatIcon,
  buildQualityRows,
  buildRecentDisplayDays,
  buildSummaryCards,
  buildYAxisTicks,
  difficultyClass,
  formatDayLabel,
} from "./lib";

type LeetcodeStatsClientProps = {
  problems: LeetcodeProblemRow[];
  initialAttempts: LeetcodeAttemptRow[];
  initialPomodoroSessions?: PomodoroSession[];
};

export function LeetcodeStatsClient({
  problems: catalogProblems,
  initialAttempts,
  initialPomodoroSessions = [],
}: LeetcodeStatsClientProps) {
  const { status: authStatus } = useAuth();
  const [attempts, setAttempts] = useState(initialAttempts);
  const [pomodoroSessions, setPomodoroSessions] = useState(initialPomodoroSessions);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (authStatus === "signed-out" || authStatus === "unavailable") {
        setAttempts(
          getLocalLeetcodeAttempts().map((attempt) => ({
            attemptId: attempt.attemptId,
            problemId: attempt.problemId,
            problemTitle: attempt.problemTitle,
            isSuccessful: attempt.isSuccessful,
            startedAt: attempt.startedAt,
            endedAt: attempt.endedAt,
            durationSeconds: attempt.durationSeconds,
            language: attempt.language ?? null,
            notes: attempt.notes,
            failureReason: attempt.status === "timed_out" ? "Time ran out" : null,
          })),
        );
        setPomodoroSessions(getLocalPomodoroSessions());
        return;
      }

      setAttempts(initialAttempts);
      setPomodoroSessions(initialPomodoroSessions);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [authStatus, initialAttempts, initialPomodoroSessions]);

  const problems = useMemo(
    () => hydrateLeetcodeProblemsWithAttempts(catalogProblems, attempts),
    [attempts, catalogProblems],
  );
  const stats = useMemo(() => buildLeetcodeStats(problems, attempts), [attempts, problems]);
  const consistencyDays = buildRecentDisplayDays(stats.consistency.attemptsByDay, 14);
  const maxDailyAttempts = Math.max(1, ...consistencyDays.map((day) => day.attempts));
  const yAxisTicks = buildYAxisTicks(maxDailyAttempts);
  const summaryCards = buildSummaryCards(stats);
  const qualityRows = buildQualityRows(stats, attempts);
  const pomodoroStats = useMemo(
    () => buildPomodoroStats(pomodoroSessions),
    [pomodoroSessions],
  );
  const focusDays = useMemo(
    () => buildRecentFocusDays(buildFocusByDay(pomodoroSessions), 14),
    [pomodoroSessions],
  );
  const maxDailyFocusSeconds = Math.max(
    1,
    ...focusDays.map((day) => day.focusSeconds),
  );

  return (
    <div className="space-y-5 pb-4">
      <SectionHero
        icon={<CodeIcon className="h-9 w-9" />}
        title="Practice dashboard"
        description="Track completion, attempt quality, pattern coverage, and practice consistency from saved attempt history."
      >
        <Link
          href="/leetcode"
          className={primaryActionClass}
        >
          Back to problems
          <span className="text-2xl leading-none" aria-hidden="true">
            ›
          </span>
        </Link>
      </SectionHero>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <StatCard
            key={item.label}
            label={item.label}
            value={item.value}
            note={item.note}
            tone={item.tone}
            icon={<StatIcon icon={item.icon} />}
          />
        ))}
      </section>

      <AppPanel className="p-5">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="min-w-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-white">Consistency</h2>
                <p className="mt-2 max-w-2xl text-base leading-7 text-slate-300/76">
                  Attempts by day. Accepted attempts are shown in purple, others in muted gray.
                </p>
              </div>
              <div className="inline-flex h-12 w-fit items-center gap-8 rounded-lg border border-white/10 bg-[#0b1320]/65 px-5 text-sm font-semibold text-slate-200/85">
                Last 14 days
                <span className="text-slate-400" aria-hidden="true">
                  ˅
                </span>
              </div>
            </div>

            {consistencyDays.length > 0 ? (
              <div className="mt-3 overflow-x-auto">
                <div className="min-w-[48rem]">
                  <div className="grid h-[7.75rem] grid-cols-[2rem_minmax(0,1fr)] gap-4">
                    <div className="flex flex-col justify-between pt-2 text-right text-base font-semibold text-slate-300/75">
                      {yAxisTicks.map((tick) => (
                        <span key={tick}>{tick}</span>
                      ))}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 flex flex-col justify-between py-2">
                        {yAxisTicks.map((tick) => (
                          <div key={tick} className="border-t border-dashed border-slate-500/28" />
                        ))}
                      </div>
                      <div className="relative z-10 flex h-full items-end gap-5 px-2 pb-4">
                        {consistencyDays.map((day) => {
                          const rejected = Math.max(0, day.attempts - day.accepted);
                          const totalHeight = progressWidth(day.attempts, maxDailyAttempts);
                          const acceptedHeight = progressWidth(day.accepted, Math.max(day.attempts, 1));
                          const rejectedHeight = progressWidth(rejected, Math.max(day.attempts, 1));

                          return (
                            <div key={day.date} className="flex h-full min-w-9 flex-1 items-end justify-center">
                              <div
                                className="relative flex w-8 flex-col justify-end overflow-hidden rounded-t-md bg-slate-600/28 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                                style={{ height: totalHeight }}
                                title={`${day.attempts} attempts on ${day.date}`}
                              >
                                {rejected > 0 ? (
                                  <div
                                    className="w-full bg-slate-500/45"
                                    style={{ height: rejectedHeight }}
                                  />
                                ) : null}
                                {day.accepted > 0 ? (
                                  <div
                                    className="w-full bg-[#705cff] shadow-[0_0_18px_rgba(112,92,255,0.45)]"
                                    style={{ height: acceptedHeight }}
                                  />
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="ml-12 flex gap-5 px-2">
                    {consistencyDays.map((day) => (
                      <div key={day.date} className="min-w-9 flex-1 text-center">
                        <div className="whitespace-nowrap text-sm font-semibold text-slate-300/78">
                          {formatDayLabel(day.date)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-center gap-9 text-sm font-semibold text-slate-300/72">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded bg-[#705cff]" />
                      Accepted
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded bg-slate-500/45" />
                      Not accepted
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-white/10 bg-[#0b1320]/65 p-5 text-sm text-slate-300/70">
                No attempt history yet.
              </div>
            )}
          </div>

          <div className="self-center rounded-[16px] border border-amber-400/45 bg-amber-300/10 px-6 py-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="text-base font-extrabold uppercase tracking-[0.12em] text-amber-300">
              Streak
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-5xl font-extrabold text-amber-300">
              <span className="text-4xl" aria-hidden="true">
                🔥
              </span>
              <span>{stats.consistency.streakDays}</span>
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-200/80">days</div>
            <div className="mt-4 text-base text-slate-300/72">
              {stats.consistency.streakDays > 0 ? "Keep it up!" : "Start today."}
            </div>
          </div>
        </div>
      </AppPanel>

      <section className="grid gap-7 xl:grid-cols-[minmax(0,0.98fr)_minmax(0,0.9fr)]">
        <AppPanel className="p-7">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            Difficulty breakdown
          </h2>
          <p className="mt-2 text-base text-slate-300/72">
            Distribution of solved problems by difficulty.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {leetcodeProblemDifficultyLabels.map((difficulty) => {
              const item = stats.byDifficulty[difficulty];
              const styles = difficultyClass(difficulty);

              return (
                <div
                  key={difficulty}
                  className={`rounded-lg border px-5 py-5 ${styles.panel}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className={`text-lg font-extrabold capitalize ${styles.text}`}>
                      {difficulty}
                    </h3>
                    <span className="text-base font-bold text-slate-300/75">
                      {item.completed}/{item.total}
                    </span>
                  </div>
                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-500/25">
                    <div
                      className={`h-full rounded-full ${styles.bar}`}
                      style={{ width: progressWidth(item.completed, item.total) }}
                    />
                  </div>
                  <div className={`mt-5 text-xl font-extrabold ${styles.text}`}>
                    {toPercentage(item.completed, item.total)}%
                  </div>
                </div>
              );
            })}
          </div>
        </AppPanel>

        <AppPanel className="p-7">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Attempt quality</h2>
          <p className="mt-2 text-base text-slate-300/72">
            Review of attempt outcomes.
          </p>

          <div className="mt-5 space-y-5">
            {qualityRows.map((row) => (
              <div key={row.label} className="grid grid-cols-[2.25rem_8rem_minmax(0,1fr)_5.5rem] items-center gap-4">
                <QualityIcon tone={row.tone} />
                <span className="text-lg font-bold text-white">{row.label}</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-700/80">
                  <div
                    className={`h-full rounded-full ${row.color}`}
                    style={{ width: `${row.rate}%` }}
                  />
                </div>
                <span className="text-right text-base font-semibold text-slate-200/90">
                  {row.count} ({row.rate}%)
                </span>
              </div>
            ))}
          </div>

          <p className="mt-5 text-sm font-medium text-slate-300/66">
            Percentages are based on saved attempts. Avg accepted:{" "}
            {formatSecondsDuration(stats.attempts.averageSuccessfulDurationSeconds)}.
          </p>
        </AppPanel>
      </section>

      <section className="grid gap-7 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,0.78fr)]">
        <AppPanel className="p-7">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white">Pattern coverage</h2>
              <p className="mt-2 text-base text-slate-300/72">
                Compact view of high-volume pattern groups.
              </p>
            </div>
            <span className="text-sm font-semibold text-slate-300/60">
              Showing {Math.min(stats.byPattern.length, 8)} of {stats.byPattern.length}
            </span>
          </div>

          <div className="space-y-3">
            {stats.byPattern.slice(0, 8).map((pattern) => (
              <div key={pattern.pattern} className="rounded-lg border border-white/10 bg-[#0b1320]/55 p-4">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_4rem] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="truncate text-sm font-bold text-slate-100">{pattern.pattern}</h3>
                      <span className="shrink-0 text-xs font-semibold text-slate-300/65">
                        {pattern.completed}/{pattern.total}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-700/80">
                      <div
                        className="h-2 rounded-full bg-[#705cff]"
                        style={{ width: `${pattern.completionRate}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-right text-sm font-extrabold text-[#7d68ff]">
                    {pattern.completionRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </AppPanel>

        <AppPanel className="p-7">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Recent attempts</h2>
          <p className="mt-2 text-base text-slate-300/72">
            Latest saved attempt events.
          </p>

          <div className="mt-5 space-y-3">
            {stats.recentAttempts.length > 0 ? (
              stats.recentAttempts.map((attempt) => (
                <div
                  key={attempt.attemptId}
                  className="rounded-lg border border-white/10 bg-[#0b1320]/55 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold leading-snug text-white">
                        {attempt.problemTitle}
                      </div>
                      <div className="mt-1 text-xs font-medium text-slate-300/60">
                        {formatAttemptDate(attempt.endedAt)} ·{" "}
                        {formatSecondsDuration(attempt.durationSeconds)}
                        {attempt.language ? <> · {attempt.language}</> : null}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        attempt.isSuccessful
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-amber-400/10 text-amber-300"
                      }`}
                    >
                      {attempt.isSuccessful ? "Accepted" : "Review"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-white/10 bg-[#0b1320]/55 p-4 text-sm text-slate-300/70">
                No attempts recorded yet.
              </div>
            )}
          </div>
        </AppPanel>
      </section>

      <section className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)]">
        <AppPanel className="p-7">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Language breakdown</h2>
        <p className="mt-2 text-base text-slate-300/72">
          Attempts and success rate per language.
        </p>

        <div className="mt-5 space-y-4">
          {stats.byLanguage.length > 0 ? (
            stats.byLanguage.map((row) => (
              <div
                key={row.language}
                className="grid grid-cols-[8rem_minmax(0,1fr)_11rem] items-center gap-4"
              >
                <span className="truncate text-lg font-bold text-white">{row.language}</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-700/80">
                  <div
                    className="h-full rounded-full bg-[#705cff]"
                    style={{ width: `${row.successRate}%` }}
                  />
                </div>
                <span className="text-right text-base font-semibold text-slate-200/90">
                  {row.acceptedAttempts}/{row.totalAttempts} accepted ({row.successRate}%)
                </span>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-white/10 bg-[#0b1320]/55 p-4 text-sm text-slate-300/70">
              No attempts recorded yet.
            </div>
          )}
        </div>

        <p className="mt-5 text-sm font-medium text-slate-300/66">
          Bars show success rate per language. Attempts saved before language
          tracking appear as &quot;Not recorded&quot;.
        </p>
        </AppPanel>

        <AppPanel className="p-7">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Focus time</h2>
          <p className="mt-2 text-base text-slate-300/72">
            Pomodoro sessions recorded from the focus timer.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-white/10 bg-[#0b1320]/55 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-300/60">
                Total focus
              </div>
              <div className="mt-2 font-mono text-2xl font-extrabold text-white">
                {formatSecondsDuration(pomodoroStats.totalFocusSeconds)}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0b1320]/55 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-300/60">
                Sessions
              </div>
              <div className="mt-2 font-mono text-2xl font-extrabold text-white">
                {pomodoroStats.totalSessions}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0b1320]/55 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-300/60">
                Completed
              </div>
              <div className="mt-2 font-mono text-2xl font-extrabold text-emerald-300">
                {pomodoroStats.completedSessions} ({pomodoroStats.completionRate}%)
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0b1320]/55 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-300/60">
                Avg session
              </div>
              <div className="mt-2 font-mono text-2xl font-extrabold text-white">
                {formatSecondsDuration(pomodoroStats.averageSessionSeconds)}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-slate-300/60">
              <span>Focus over days</span>
              <span>Last 14 days</span>
            </div>
            <div className="mt-3 flex h-24 items-end gap-1.5">
              {focusDays.map((day) => (
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
                    }`}
                    style={{
                      height: `${Math.max(
                        4,
                        Math.round((day.focusSeconds / maxDailyFocusSeconds) * 100),
                      )}%`,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs font-semibold text-slate-300/60">
              <span>{formatDayLabel(focusDays[0]?.date ?? "")}</span>
              <span>{formatDayLabel(focusDays.at(-1)?.date ?? "")}</span>
            </div>
          </div>

          <p className="mt-5 text-sm font-medium text-slate-300/66">
            Based on the most recent saved sessions.
          </p>
        </AppPanel>
      </section>
    </div>
  );
}
