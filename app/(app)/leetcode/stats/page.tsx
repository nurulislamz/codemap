import Link from "next/link";

import {
  formatAttemptDate,
  formatSecondsDuration,
  progressWidth,
  toPercentage,
} from "@/lib/leetcode/leetcode-formatters";
import { getLeetcodePageData } from "@/lib/leetcode/page-data";
import { buildLeetcodeStats } from "@/lib/leetcode/leetcode-stats";
import type { LeetcodeProblemRow } from "@/lib/leetcode/types";
import {
  CodeIcon,
  LeetcodeHeroPanel,
  LeetcodePanel,
  LeetcodeStatCard,
  leetcodePrimaryActionClass,
} from "@/components/leetcode/leetcode-ui";

export const dynamic = "force-dynamic";

type StatIcon = "layers" | "check" | "target" | "trend";

type DisplayDay = {
  date: string;
  attempts: number;
  accepted: number;
};

function difficultyClass(difficulty: LeetcodeProblemRow["difficulty"]) {
  switch (difficulty) {
    case "easy":
      return {
        text: "text-emerald-300",
        bar: "bg-emerald-400",
        panel: "border-emerald-400/45 bg-emerald-400/10",
      };
    case "medium":
      return {
        text: "text-amber-300",
        bar: "bg-amber-400",
        panel: "border-amber-400/45 bg-amber-400/10",
      };
    case "hard":
      return {
        text: "text-rose-300",
        bar: "bg-rose-400",
        panel: "border-rose-400/45 bg-rose-400/10",
      };
  }
}

function formatDayLabel(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

function toIsoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildRecentDisplayDays(days: DisplayDay[], count: number): DisplayDay[] {
  if (days.length === 0) return [];

  const byDate = new Map(days.map((day) => [day.date, day]));
  const latestDate = new Date(`${days.at(-1)?.date}T00:00:00.000Z`);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(latestDate);
    date.setUTCDate(latestDate.getUTCDate() - (count - index - 1));
    const isoDate = toIsoDay(date);

    return byDate.get(isoDate) ?? { date: isoDate, attempts: 0, accepted: 0 };
  });
}

function StatIcon({ icon }: { icon: StatIcon }) {
  const common = "h-7 w-7";

  if (icon === "layers") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="m4 12 8 4.5 8-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m4 16.5 8 4.5 8-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "check") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
        <path d="m8.5 12.1 2.3 2.3 4.9-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "target") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
        <path d="M16.5 7.5 20 4m-1 0h1v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m4 16 5.2-5.2 3.7 3.7L20 7.5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.5 7.5H20V12" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function QualityIcon({ tone }: { tone: "accepted" | "reviewed" | "needsWork" }) {
  const className =
    tone === "accepted"
      ? "text-[#7a63ff]"
      : tone === "reviewed"
        ? "text-[#4fa2ff]"
        : "text-amber-400";

  if (tone === "accepted") {
    return (
      <svg className={`h-7 w-7 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
        <path d="m8.5 12.1 2.3 2.3 4.9-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (tone === "reviewed") {
    return (
      <svg className={`h-7 w-7 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 5.5c2.4 0 4.3.6 5.7 1.8v11.2C9.3 17.3 7.4 16.7 5 16.7V5.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M19 5.5c-2.4 0-4.3.6-5.7 1.8v11.2c1.4-1.2 3.3-1.8 5.7-1.8V5.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg className={`h-7 w-7 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4 21 20H3L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 9.5v4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 17.1h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default async function LeetcodeStatsPage() {
  const { problems, attempts } = await getLeetcodePageData();
  const stats = buildLeetcodeStats(problems, attempts);
  const consistencyDays = buildRecentDisplayDays(stats.consistency.attemptsByDay, 14);
  const maxDailyAttempts = Math.max(1, ...consistencyDays.map((day) => day.attempts));
  const yAxisTicks = Array.from(
    new Set([maxDailyAttempts, Math.ceil(maxDailyAttempts / 2), 0]),
  ).toSorted((left, right) => right - left);
  const failedAttempts = attempts.filter((attempt) => !attempt.isSuccessful);
  const reviewedAttempts = failedAttempts.filter((attempt) => attempt.notes);
  const needsWorkAttempts = failedAttempts.length - reviewedAttempts.length;
  const qualityRows = [
    {
      label: "Accepted",
      count: stats.attempts.acceptedAttempts,
      rate: toPercentage(stats.attempts.acceptedAttempts, stats.attempts.totalAttempts),
      color: "bg-[#7a63ff]",
      tone: "accepted" as const,
    },
    {
      label: "Reviewed",
      count: reviewedAttempts.length,
      rate: toPercentage(reviewedAttempts.length, stats.attempts.totalAttempts),
      color: "bg-[#4fa2ff]",
      tone: "reviewed" as const,
    },
    {
      label: "Needs work",
      count: needsWorkAttempts,
      rate: toPercentage(needsWorkAttempts, stats.attempts.totalAttempts),
      color: "bg-amber-400",
      tone: "needsWork" as const,
    },
  ];

  return (
    <div className="space-y-5 pb-4">
      <LeetcodeHeroPanel
        icon={<CodeIcon className="h-9 w-9" />}
        title="Practice dashboard"
        description="Track completion, attempt quality, pattern coverage, and practice consistency from saved attempt history."
      >
        <Link
          href="/leetcode"
          className={leetcodePrimaryActionClass}
        >
          Back to problems
          <span className="text-2xl leading-none" aria-hidden="true">
            ›
          </span>
        </Link>
      </LeetcodeHeroPanel>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Problems",
            value: stats.summary.totalProblems,
            note: "In problem set",
            icon: "layers" as const,
            tone: "primary" as const,
          },
          {
            label: "Completed",
            value: stats.summary.completedProblems,
            note: `${stats.summary.completionRate}% complete`,
            icon: "check" as const,
            tone: "success" as const,
          },
          {
            label: "Attempted",
            value: stats.summary.attemptedProblems,
            note: "Touched at least once",
            icon: "target" as const,
            tone: "info" as const,
          },
          {
            label: "Success Rate",
            value: `${stats.attempts.successRate}%`,
            note: `${stats.attempts.acceptedAttempts}/${stats.attempts.totalAttempts} accepted`,
            icon: "trend" as const,
            tone: "warning" as const,
          },
        ].map((item) => (
          <LeetcodeStatCard
            key={item.label}
            label={item.label}
            value={item.value}
            note={item.note}
            tone={item.tone}
            icon={<StatIcon icon={item.icon} />}
          />
        ))}
      </section>

      <LeetcodePanel className="p-5">
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
      </LeetcodePanel>

      <section className="grid gap-7 xl:grid-cols-[minmax(0,0.98fr)_minmax(0,0.9fr)]">
        <LeetcodePanel className="p-7">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            Difficulty breakdown
          </h2>
          <p className="mt-2 text-base text-slate-300/72">
            Distribution of solved problems by difficulty.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {(["easy", "medium", "hard"] as const).map((difficulty) => {
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
        </LeetcodePanel>

        <LeetcodePanel className="p-7">
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
        </LeetcodePanel>
      </section>

      <section className="grid gap-7 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,0.78fr)]">
        <LeetcodePanel className="p-7">
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
        </LeetcodePanel>

        <LeetcodePanel className="p-7">
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
        </LeetcodePanel>
      </section>
    </div>
  );
}
