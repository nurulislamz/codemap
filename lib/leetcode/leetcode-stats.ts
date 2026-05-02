import type { LeetcodeAttemptRow, LeetcodeProblemRow } from "./types";

type Difficulty = LeetcodeProblemRow["difficulty"];

type DifficultyStats = {
  total: number;
  attempted: number;
  completed: number;
  estimatedMinutes: number;
  remainingEstimatedMinutes: number;
};

type PatternStats = {
  pattern: string;
  total: number;
  attempted: number;
  completed: number;
  estimatedMinutes: number;
  remainingEstimatedMinutes: number;
  completionRate: number;
};

type DailyAttemptStats = {
  date: string;
  attempts: number;
  accepted: number;
};

export type LeetcodeStats = {
  summary: {
    totalProblems: number;
    attemptedProblems: number;
    completedProblems: number;
    completionRate: number;
    totalEstimatedMinutes: number;
    remainingEstimatedMinutes: number;
  };
  attempts: {
    totalAttempts: number;
    acceptedAttempts: number;
    successRate: number;
    averageSuccessfulDurationSeconds: number | null;
  };
  byDifficulty: Record<Difficulty, DifficultyStats>;
  byPattern: PatternStats[];
  consistency: {
    activeDays: number;
    streakDays: number;
    maxAttemptsInDay: number;
    attemptsByDay: DailyAttemptStats[];
  };
  recentAttempts: LeetcodeAttemptRow[];
};

const difficulties: Difficulty[] = ["easy", "medium", "hard"];

export function buildLeetcodeStats(
  problems: LeetcodeProblemRow[],
  attempts: LeetcodeAttemptRow[],
): LeetcodeStats {
  const attemptedProblems = problems.filter((problem) => problem.attemptCount > 0);
  const completedProblems = problems.filter((problem) => problem.isCompleted);
  const successfulAttempts = attempts.filter((attempt) => attempt.isSuccessful);
  const totalEstimatedMinutes = sum(problems.map((problem) => problem.estimatedMinutes));
  const remainingEstimatedMinutes = sum(
    problems
      .filter((problem) => !problem.isCompleted)
      .map((problem) => problem.estimatedMinutes),
  );

  return {
    summary: {
      totalProblems: problems.length,
      attemptedProblems: attemptedProblems.length,
      completedProblems: completedProblems.length,
      completionRate: percentage(completedProblems.length, problems.length),
      totalEstimatedMinutes,
      remainingEstimatedMinutes,
    },
    attempts: {
      totalAttempts: attempts.length,
      acceptedAttempts: successfulAttempts.length,
      successRate: percentage(successfulAttempts.length, attempts.length),
      averageSuccessfulDurationSeconds: averageOrNull(
        successfulAttempts.map((attempt) => attempt.durationSeconds),
      ),
    },
    byDifficulty: buildDifficultyStats(problems),
    byPattern: buildPatternStats(problems),
    consistency: buildConsistencyStats(attempts),
    recentAttempts: attempts
      .toSorted(
        (left, right) =>
          new Date(right.endedAt).getTime() - new Date(left.endedAt).getTime(),
      )
      .slice(0, 6),
  };
}

function buildConsistencyStats(attempts: LeetcodeAttemptRow[]): LeetcodeStats["consistency"] {
  const byDate = new Map<string, DailyAttemptStats>();

  for (const attempt of attempts) {
    const date = new Date(attempt.endedAt).toISOString().slice(0, 10);
    const current = byDate.get(date) ?? { date, attempts: 0, accepted: 0 };

    byDate.set(date, {
      date,
      attempts: current.attempts + 1,
      accepted: current.accepted + (attempt.isSuccessful ? 1 : 0),
    });
  }

  const attemptsByDay = Array.from(byDate.values()).toSorted((left, right) =>
    left.date.localeCompare(right.date),
  );

  return {
    activeDays: attemptsByDay.length,
    streakDays: calculateLatestStreakDays(attemptsByDay.map((day) => day.date)),
    maxAttemptsInDay: Math.max(0, ...attemptsByDay.map((day) => day.attempts)),
    attemptsByDay,
  };
}

function calculateLatestStreakDays(dates: string[]): number {
  if (dates.length === 0) return 0;

  const uniqueDates = Array.from(new Set(dates)).toSorted();
  let streak = 1;

  for (let index = uniqueDates.length - 1; index > 0; index -= 1) {
    const current = Date.parse(`${uniqueDates[index]}T00:00:00.000Z`);
    const previous = Date.parse(`${uniqueDates[index - 1]}T00:00:00.000Z`);
    const diffDays = (current - previous) / 86_400_000;

    if (diffDays !== 1) break;
    streak += 1;
  }

  return streak;
}

function buildDifficultyStats(
  problems: LeetcodeProblemRow[],
): Record<Difficulty, DifficultyStats> {
  return difficulties.reduce<Record<Difficulty, DifficultyStats>>(
    (stats, difficulty) => {
      const matchingProblems = problems.filter((problem) => problem.difficulty === difficulty);
      stats[difficulty] = {
        total: matchingProblems.length,
        attempted: matchingProblems.filter((problem) => problem.attemptCount > 0).length,
        completed: matchingProblems.filter((problem) => problem.isCompleted).length,
        estimatedMinutes: sum(matchingProblems.map((problem) => problem.estimatedMinutes)),
        remainingEstimatedMinutes: sum(
          matchingProblems
            .filter((problem) => !problem.isCompleted)
            .map((problem) => problem.estimatedMinutes),
        ),
      };
      return stats;
    },
    {
      easy: emptyDifficultyStats(),
      medium: emptyDifficultyStats(),
      hard: emptyDifficultyStats(),
    },
  );
}

function buildPatternStats(problems: LeetcodeProblemRow[]): PatternStats[] {
  const grouped = new Map<string, LeetcodeProblemRow[]>();

  for (const problem of problems) {
    grouped.set(problem.pattern, [...(grouped.get(problem.pattern) ?? []), problem]);
  }

  return Array.from(grouped.entries())
    .map(([pattern, patternProblems]) => {
      const completed = patternProblems.filter((problem) => problem.isCompleted).length;

      return {
        pattern,
        total: patternProblems.length,
        attempted: patternProblems.filter((problem) => problem.attemptCount > 0).length,
        completed,
        estimatedMinutes: sum(patternProblems.map((problem) => problem.estimatedMinutes)),
        remainingEstimatedMinutes: sum(
          patternProblems
            .filter((problem) => !problem.isCompleted)
            .map((problem) => problem.estimatedMinutes),
        ),
        completionRate: percentage(completed, patternProblems.length),
      };
    })
    .toSorted((left, right) => right.total - left.total || left.pattern.localeCompare(right.pattern));
}

function emptyDifficultyStats(): DifficultyStats {
  return {
    total: 0,
    attempted: 0,
    completed: 0,
    estimatedMinutes: 0,
    remainingEstimatedMinutes: 0,
  };
}

function averageOrNull(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(sum(values) / values.length);
}

function percentage(part: number, whole: number): number {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 100);
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
