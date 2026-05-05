import "server-only";

import { UnauthorizedError, getRequestUserId } from "@/lib/auth/identity";
import { getLeetcodeCatalog } from "@/lib/leetcode/catalog";
import { getAllLeetCodeAttempts } from "./db-server";
import type {
  LeetcodeAttemptRow,
  LeetcodeMinorPatternCountsByPattern,
  LeetcodePatternSummary,
  LeetcodeProblemRow,
} from "@/lib/leetcode/types";

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
  minorPatternsByPattern: LeetcodeMinorPatternCountsByPattern;
  problems: LeetcodeProblemRow[];
  attempts: LeetcodeAttemptRow[];
}> {
  const catalog = getLeetcodeCatalog();
  const userId = await getOptionalRequestUserId();
  const remoteAttempts = userId ? await getAllLeetCodeAttempts(userId) : [];
  const sortedAttempts = remoteAttempts.toSorted(
    (left, right) => new Date(right.endedAt).getTime() - new Date(left.endedAt).getTime(),
  );
  const attemptsByProblemId = new Map<string, typeof sortedAttempts>();

  for (const attempt of sortedAttempts) {
    attemptsByProblemId.set(attempt.problemId, [
      ...(attemptsByProblemId.get(attempt.problemId) ?? []),
      attempt,
    ]);
  }

  const problems: LeetcodeProblemRow[] = catalog.problems.map((problem) => {
    const problemAttempts = attemptsByProblemId.get(problem.number) ?? [];
    const latestAttempt = problemAttempts[0];

    return {
      ...problem,
      isCompleted: problemAttempts.some((attempt) => attempt.isSuccessful),
      lastAttemptedAt: latestAttempt?.endedAt ?? null,
      attemptCount: problemAttempts.length,
      bestDurationSeconds: bestSuccessfulDuration(problemAttempts),
    };
  });
  const attempts: LeetcodeAttemptRow[] = sortedAttempts.map((attempt) => ({
    attemptId: attempt.attemptId,
    problemId: attempt.problemId,
    problemTitle:
      catalog.problemTitleByNumber.get(attempt.problemId) ?? attempt.problemId,
    isSuccessful: attempt.isSuccessful,
    startedAt: attempt.startedAt,
    endedAt: attempt.endedAt,
    durationSeconds: attempt.durationSeconds,
    notes: attempt.notes,
    failureReason: attempt.failureReason,
  }));

  return {
    patterns: catalog.majorPatternCounts,
    minorPatternsByPattern: catalog.minorPatternCountsByPattern,
    problems,
    attempts,
  };
}

async function getOptionalRequestUserId() {
  try {
    return await getRequestUserId();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return null;
    }

    throw error;
  }
}
