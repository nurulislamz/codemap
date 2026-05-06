import "server-only";

import { UnauthorizedError, getRequestUserId } from "@/lib/auth/identity";
import { getLeetcodeCatalog } from "@/lib/leetcode/catalog";
import type { LeetCodeAttemptEvent } from "@/lib/firebase/leetcode";
import { getAllLeetCodeAttempts } from "./db-server";
import type {
  LeetcodeAttemptRow,
  LeetcodeProblemProgressRow,
  LeetcodeProblemRow,
} from "@/lib/leetcode/types";

export async function getSortedLeetcodeAttemptEventsForUser(
  userId: string,
): Promise<LeetCodeAttemptEvent[]> {
  const attempts = await getAllLeetCodeAttempts(userId);

  return sortAttemptsByEndDate(attempts);
}

export async function getSortedLeetcodeAttemptEventsForRequest(): Promise<
  LeetCodeAttemptEvent[]
> {
  try {
    const userId = await getRequestUserId();
    return getSortedLeetcodeAttemptEventsForUser(userId);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return [];
    }

    throw error;
  }
}

export async function getLeetcodeAttemptRowsForUser(
  userId: string,
): Promise<LeetcodeAttemptRow[]> {
  const catalog = getLeetcodeCatalog();
  const attempts = await getSortedLeetcodeAttemptEventsForUser(userId);

  return toLeetcodeAttemptRows(attempts, catalog.index.problems);
}

export function hydrateProblemsWithAttempts(
  problems: LeetcodeProblemRow[],
  attempts: LeetCodeAttemptEvent[],
): LeetcodeProblemProgressRow[] {
  const attemptsByProblemId = groupAttemptsByProblemId(attempts);

  return problems.map((problem) => {
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
}

export function toLeetcodeAttemptRows(
  attempts: LeetCodeAttemptEvent[],
  problemsByNumber: Map<string, LeetcodeProblemRow>,
): LeetcodeAttemptRow[] {
  return attempts.map((attempt) => ({
    attemptId: attempt.attemptId,
    problemId: attempt.problemId,
    problemTitle: problemsByNumber.get(attempt.problemId)?.title ?? attempt.problemId,
    isSuccessful: attempt.isSuccessful,
    startedAt: attempt.startedAt,
    endedAt: attempt.endedAt,
    durationSeconds: attempt.durationSeconds,
    notes: attempt.notes,
    failureReason: attempt.failureReason,
  }));
}

function sortAttemptsByEndDate(attempts: LeetCodeAttemptEvent[]) {
  return attempts.toSorted(
    (left, right) =>
      new Date(right.endedAt).getTime() - new Date(left.endedAt).getTime(),
  );
}

function groupAttemptsByProblemId(attempts: LeetCodeAttemptEvent[]) {
  const attemptsByProblemId = new Map<string, LeetCodeAttemptEvent[]>();

  for (const attempt of attempts) {
    attemptsByProblemId.set(attempt.problemId, [
      ...(attemptsByProblemId.get(attempt.problemId) ?? []),
      attempt,
    ]);
  }

  return attemptsByProblemId;
}

function bestSuccessfulDuration(
  attempts: Array<{ durationSeconds: number; isSuccessful: boolean }>,
) {
  const successfulDurations = attempts
    .filter((attempt) => attempt.isSuccessful)
    .map((attempt) => attempt.durationSeconds);

  return successfulDurations.length > 0 ? Math.min(...successfulDurations) : null;
}
