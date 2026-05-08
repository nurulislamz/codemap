import {
  type LeetcodeDashboardProblemRow,
} from "@/components/leetcode/leetcode-dashboard-client";
import {
  type LeetcodeAttemptRow,
  type LeetcodeProblemProgressRow,
  type LeetcodeProblemRow,
  LeetcodeProblemDifficultyLabel,
} from "@/lib/leetcode/types";

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
    default:
      return "border-[#334258] bg-[#172233] text-slate-300";
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
