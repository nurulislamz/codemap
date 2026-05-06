import { toPercentage } from "@/lib/leetcode/leetcode-formatters";
import type { LeetcodeStats } from "@/lib/leetcode/leetcode-stats";
import {
  LeetcodeProblemDifficultyLabel,
  type LeetcodeAttemptRow,
  type LeetcodeProblemRow,
} from "@/lib/leetcode/types";

export type StatIconName = "layers" | "check" | "target" | "trend";

type DisplayDay = {
  date: string;
  attempts: number;
  accepted: number;
};

export function difficultyClass(difficulty: LeetcodeProblemRow["difficulty"]) {
  switch (difficulty) {
    case LeetcodeProblemDifficultyLabel.Easy:
      return {
        text: "text-emerald-300",
        bar: "bg-emerald-400",
        panel: "border-emerald-400/45 bg-emerald-400/10",
      };
    case LeetcodeProblemDifficultyLabel.Medium:
      return {
        text: "text-amber-300",
        bar: "bg-amber-400",
        panel: "border-amber-400/45 bg-amber-400/10",
      };
    case LeetcodeProblemDifficultyLabel.Hard:
      return {
        text: "text-rose-300",
        bar: "bg-rose-400",
        panel: "border-rose-400/45 bg-rose-400/10",
      };
  }
}

export function formatDayLabel(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

function toIsoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function buildRecentDisplayDays(days: DisplayDay[], count: number): DisplayDay[] {
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

export function buildYAxisTicks(maxDailyAttempts: number) {
  return Array.from(new Set([maxDailyAttempts, Math.ceil(maxDailyAttempts / 2), 0])).toSorted(
    (left, right) => right - left,
  );
}

export function buildSummaryCards(stats: LeetcodeStats) {
  return [
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
  ];
}

export function buildQualityRows(stats: LeetcodeStats, attempts: LeetcodeAttemptRow[]) {
  const failedAttempts = attempts.filter((attempt) => !attempt.isSuccessful);
  const reviewedAttempts = failedAttempts.filter((attempt) => attempt.notes);
  const needsWorkAttempts = failedAttempts.length - reviewedAttempts.length;

  return [
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
}

export function StatIcon({ icon }: { icon: StatIconName }) {
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

export function QualityIcon({ tone }: { tone: "accepted" | "reviewed" | "needsWork" }) {
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
