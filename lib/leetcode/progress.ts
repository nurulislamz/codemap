import type {
  LeetcodeAttemptRow,
  LeetcodeProblemProgressRow,
  LeetcodeProblemRow,
} from "@/lib/leetcode/types";

type GetLeetcodePracticeRowsInput = {
  problems: LeetcodeProblemProgressRow[];
  selectedPattern: string | null;
  selectedSubPatterns: string[];
  query: string;
};

export function hydrateLeetcodeProblemsWithAttempts(
  problems: LeetcodeProblemRow[],
  attempts: LeetcodeAttemptRow[],
): LeetcodeProblemProgressRow[] {
  const groupedAttempts = attemptsByProblemId(attempts);

  return problems.map((problem) => {
    const problemAttempts = groupedAttempts.get(problem.number) ?? [];
    const latestAttempt = problemAttempts[0];

    return {
      ...problem,
      isCompleted: problemAttempts.some((attempt) => attempt.isSuccessful),
      lastAttemptedAt: latestAttempt?.endedAt ?? null,
      attemptCount: problemAttempts.length,
      bestDurationSeconds: bestSuccessfulDuration(problemAttempts),
    };
  });
}

export function getLeetcodePracticeRows({
  problems,
  selectedPattern,
  selectedSubPatterns,
  query,
}: GetLeetcodePracticeRowsInput) {
  const selectedPatternProblems = selectedPattern
    ? problems.filter((problem) => problem.pattern === selectedPattern)
    : problems;
  const validSubPatternNames = new Set(
    selectedPatternProblems.map((problem) => problem.subPattern),
  );
  const validSelectedSubPatterns = selectedSubPatterns.filter((subPattern) =>
    validSubPatternNames.has(subPattern),
  );
  const patternProblems =
    validSelectedSubPatterns.length > 0
      ? selectedPatternProblems.filter((problem) =>
          validSelectedSubPatterns.includes(problem.subPattern),
        )
      : selectedPatternProblems;
  const normalizedQuery = query.trim().toLowerCase();

  return normalizedQuery
    ? patternProblems.filter(
        (problem) =>
          problem.title.toLowerCase().includes(normalizedQuery) ||
          problem.number.includes(normalizedQuery),
      )
    : patternProblems;
}

function attemptsByProblemId(attempts: LeetcodeAttemptRow[]) {
  const grouped = new Map<string, LeetcodeAttemptRow[]>();

  for (const attempt of attempts) {
    grouped.set(attempt.problemId, [
      ...(grouped.get(attempt.problemId) ?? []),
      attempt,
    ]);
  }

  return grouped;
}

function bestSuccessfulDuration(attempts: LeetcodeAttemptRow[]) {
  const durations = attempts
    .filter((attempt) => attempt.isSuccessful)
    .map((attempt) => attempt.durationSeconds);

  return durations.length > 0 ? Math.min(...durations) : null;
}
