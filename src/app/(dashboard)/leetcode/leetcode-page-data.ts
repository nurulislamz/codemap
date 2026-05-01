import "server-only";

import { getLeetcodePatternTree } from "@/lib/leetcode-patterns";
import { getAllLeetCodeAttempts } from "./leetcode-db-server";
import type {
  LeetcodeAttemptRow,
  LeetcodePatternSummary,
  LeetcodeProblemRow,
} from "./leetcode-types";

function bestSuccessfulDuration(
  attempts: Array<{ durationSeconds: number; isSuccessful: boolean }>,
) {
  const successfulDurations = attempts
    .filter((attempt) => attempt.isSuccessful)
    .map((attempt) => attempt.durationSeconds);

  return successfulDurations.length > 0 ? Math.min(...successfulDurations) : null;
}

export async function getLeetcodePageData(): Promise<{
  patterns: LeetcodePatternSummary[];
  problems: LeetcodeProblemRow[];
  attempts: LeetcodeAttemptRow[];
}> {
  const patternTree = getLeetcodePatternTree();
  const sortedAttempts = (await getAllLeetCodeAttempts()).toSorted(
    (left, right) => new Date(right.endedAt).getTime() - new Date(left.endedAt).getTime(),
  );
  const attemptsByProblemId = new Map<string, typeof sortedAttempts>();

  for (const attempt of sortedAttempts) {
    attemptsByProblemId.set(attempt.problemId, [
      ...(attemptsByProblemId.get(attempt.problemId) ?? []),
      attempt,
    ]);
  }

  const problems: LeetcodeProblemRow[] = patternTree.flatMap((pattern) =>
    pattern.subPatterns.flatMap((subPattern) =>
      subPattern.problems.map((problem) => {
        const problemAttempts = attemptsByProblemId.get(problem.number) ?? [];
        const latestAttempt = problemAttempts[0];

        return {
          number: problem.number,
          title: problem.title,
          difficulty: problem.difficulty,
          pattern: pattern.topPattern,
          subPattern: subPattern.subPattern,
          leetcodeUrl: problem.leetcodeUrl,
          estimatedMinutes: problem.estimatedMinutes,
          solutionUrl: problem.solutions?.neetcode?.textUrl,
          solutionVideoUrl: problem.solutions?.neetcode?.videoUrl,
          isCompleted: problemAttempts.some((attempt) => attempt.isSuccessful),
          lastAttemptedAt: latestAttempt?.endedAt ?? null,
          attemptCount: problemAttempts.length,
          bestDurationSeconds: bestSuccessfulDuration(problemAttempts),
        };
      }),
    ),
  );
  const problemTitleByNumber = new Map(
    problems.map((problem) => [problem.number, problem.title]),
  );
  const attempts: LeetcodeAttemptRow[] = sortedAttempts.map((attempt) => ({
    attemptId: attempt.attemptId,
    problemId: attempt.problemId,
    problemTitle: problemTitleByNumber.get(attempt.problemId) ?? attempt.problemId,
    isSuccessful: attempt.isSuccessful,
    startedAt: attempt.startedAt,
    endedAt: attempt.endedAt,
    durationSeconds: attempt.durationSeconds,
    notes: attempt.notes,
    failureReason: attempt.failureReason,
  }));
  const patterns = patternTree.map((pattern) => ({
    name: pattern.topPattern,
    count: pattern.subPatterns.reduce(
      (total, subPattern) => total + subPattern.problems.length,
      0,
    ),
  }));

  return { patterns, problems, attempts };
}
