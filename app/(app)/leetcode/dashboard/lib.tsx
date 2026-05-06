import {
  type LeetcodeDashboardDifficultyFilterOption,
  type LeetcodeDashboardProblemRow,
} from "@/components/leetcode/leetcode-dashboard-client";
import { LeetcodePanel } from "@/components/leetcode/leetcode-ui";
import {
  LeetcodeProblemDifficultyLabel,
  type LeetcodeAttemptRow,
  type LeetcodeProblemProgressRow,
  type LeetcodeProblemRow,
} from "@/lib/leetcode/types";

export const difficultyFilters: LeetcodeDashboardDifficultyFilterOption[] = [
  {
    label: "All",
    selectedClassName: "border-[#5a4fc2] bg-[#272059] text-[#a895ff]",
    value: "all",
  },
  {
    label: "Easy",
    selectedClassName: "border-[#1d7452] bg-[#123a32] text-[#38e68a]",
    value: LeetcodeProblemDifficultyLabel.Easy,
  },
  {
    label: "Medium",
    selectedClassName: "border-[#74561b] bg-[#352913] text-[#ffd323]",
    value: LeetcodeProblemDifficultyLabel.Medium,
  },
  {
    label: "Hard",
    selectedClassName: "border-[#74304a] bg-[#341827] text-[#ff6f91]",
    value: LeetcodeProblemDifficultyLabel.Hard,
  },
];

export function isSameLocalDay(value: string, date: Date) {
  const input = new Date(value);

  return (
    input.getFullYear() === date.getFullYear() &&
    input.getMonth() === date.getMonth() &&
    input.getDate() === date.getDate()
  );
}

export function calculateStreak(attempts: LeetcodeAttemptRow[]) {
  const successfulDays = new Set(
    attempts
      .filter((attempt) => attempt.isSuccessful)
      .map((attempt) => new Date(attempt.endedAt).toISOString().slice(0, 10)),
  );

  let streak = 0;
  const cursor = new Date();

  while (successfulDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function latestAttemptNotes(attempts: LeetcodeAttemptRow[]) {
  const latestNotes = new Map<string, { endedAt: string; notes: string }>();

  for (const attempt of attempts) {
    const notes = attempt.notes?.trim();

    if (!notes) continue;

    const current = latestNotes.get(attempt.problemId);

    if (!current || new Date(attempt.endedAt) > new Date(current.endedAt)) {
      latestNotes.set(attempt.problemId, { endedAt: attempt.endedAt, notes });
    }
  }

  return latestNotes;
}

export function dashboardProblemRow(
  problem: LeetcodeProblemProgressRow,
  notesByProblemId: Map<string, { endedAt: string; notes: string }>,
): LeetcodeDashboardProblemRow {
  const status = statusForProblem(problem);

  return {
    ...problem,
    actionLabel: status.action,
    difficultyClassName: difficultyClasses(problem.difficulty),
    lastNotes: notesByProblemId.get(problem.number)?.notes ?? null,
    statusClassName: status.className,
    statusLabel: status.label,
  };
}

function difficultyClasses(difficulty: LeetcodeProblemRow["difficulty"]) {
  switch (difficulty) {
    case LeetcodeProblemDifficultyLabel.Easy:
      return "border-[#1d7452] bg-[#113a32] text-[#38e68a]";
    case LeetcodeProblemDifficultyLabel.Medium:
      return "border-[#74561b] bg-[#352913] text-[#ffd323]";
    case LeetcodeProblemDifficultyLabel.Hard:
      return "border-[#74304a] bg-[#341827] text-[#ff6f91]";
  }
}

function statusForProblem(problem: LeetcodeProblemProgressRow) {
  if (problem.isCompleted) {
    return {
      label: "Review",
      action: "Start",
      className: "border-[#4d2c80] bg-[#2b1a52] text-[#c188ff]",
    };
  }

  if (problem.attemptCount > 0) {
    return {
      label: "In Progress",
      action: "Resume",
      className: "border-[#245c90] bg-[#123255] text-[#58a8ff]",
    };
  }

  return {
    label: "Not Started",
    action: "Start",
    className: "border-[#334258] bg-[#172233] text-slate-300",
  };
}

export function Icon({
  name,
  className = "h-6 w-6",
}: {
  name:
    | "calendar"
    | "check"
    | "chevron"
    | "clock"
    | "code"
    | "flame"
    | "grid"
    | "layers"
    | "sparkle"
    | "tree";
  className?: string;
}) {
  const paths = {
    calendar: (
      <>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <path d="M3 9h18" />
        <rect x="4" y="5" width="16" height="16" rx="3" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    code: (
      <>
        <path d="m9 8-4 4 4 4" />
        <path d="m15 8 4 4-4 4" />
        <path d="m13 5-2 14" />
      </>
    ),
    flame: (
      <>
        <path d="M12 22c4 0 7-2.6 7-6.8 0-3-1.8-5.1-4.1-7.6-.8 2.4-2 3.6-3.4 4.4.4-3.1-.8-5.6-3.3-8C7.6 7.7 5 10.4 5 15.2 5 19.4 8 22 12 22Z" />
        <path d="M12 18c1.5 0 2.7-1 2.7-2.6 0-1.1-.6-2-1.7-3.1-.3 1-.8 1.5-1.5 1.9.2-1.4-.3-2.4-1.3-3.5-.6 1.7-1.1 2.8-1.1 4.7 0 1.6 1.2 2.6 2.9 2.6Z" />
      </>
    ),
    grid: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5" />
        <path d="m3 16 9 5 9-5" />
      </>
    ),
    sparkle: (
      <>
        <path d="M12 3 10.5 8.5 5 10l5.5 1.5L12 17l1.5-5.5L19 10l-5.5-1.5L12 3Z" />
        <path d="M19 15 18.2 18.2 15 19l3.2.8L19 23l.8-3.2L23 19l-3.2-.8L19 15Z" />
      </>
    ),
    tree: (
      <>
        <path d="M12 3 5 15h14L12 3Z" />
        <path d="M12 12 7 21h10l-5-9Z" />
        <path d="M12 21v-3" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      {paths[name]}
    </svg>
  );
}

export function StatCard({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  value: string;
  note: string;
  tone: "green" | "orange" | "purple";
}) {
  const iconClass =
    tone === "green"
      ? "bg-[#153b33] text-[#31d17d]"
      : tone === "orange"
        ? "bg-[#352618] text-[#ff942f]"
        : "bg-[#241d55] text-[#8d72ff]";

  return (
    <LeetcodePanel className="flex min-h-32 items-center gap-5 p-4">
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${iconClass}`}>
        <Icon name={icon} className="h-7 w-7" />
      </div>
      <div>
        <div className="text-base font-medium text-slate-200">{label}</div>
        <div className="mt-2 whitespace-nowrap text-[2rem] font-extrabold leading-none text-[#8068ff]">
          {value}
        </div>
        <div className="mt-2 text-base text-slate-400">{note}</div>
      </div>
    </LeetcodePanel>
  );
}

export function ProgressRing({ percent }: { percent: number }) {
  return (
    <div
      className="grid h-36 w-36 place-items-center rounded-full"
      style={{
        background: `conic-gradient(#7359ff ${percent}%, #263448 ${percent}% 100%)`,
      }}
    >
      <div className="grid h-28 w-28 place-items-center rounded-full bg-[#101a2a]">
        <span className="text-4xl font-extrabold text-white">{percent}%</span>
      </div>
    </div>
  );
}
