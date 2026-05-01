import { getLeetcodePatternTree } from "@/lib/leetcode-patterns";
import {
  type LeetcodeAttemptRow,
  type LeetcodeProblemRow,
} from "../leetcode-problem-table";
import { getLeetCodeAttempts } from "../leetcode-db-server";
import { LeetcodeDashboardClient } from "./leetcode-dashboard-client";

export const dynamic = "force-dynamic";

function formatBestDuration(attempts: { durationSeconds: number; isSuccessful: boolean }[]) {
  const successfulDurations = attempts
    .filter((attempt) => attempt.isSuccessful)
    .map((attempt) => attempt.durationSeconds);

  return successfulDurations.length > 0 ? Math.min(...successfulDurations) : null;
}

export default async function LeetcodeDashboardPage() {
  const patternTree = getLeetcodePatternTree();
  const attempts = await getLeetCodeAttempts();
  const problems: LeetcodeProblemRow[] = patternTree.flatMap((pattern) =>
    pattern.subPatterns.flatMap((subPattern) =>
      subPattern.problems.map((problem) => {
        const problemAttempts = attempts.filter((attempt) => attempt.problemId === problem.number);
        const latestAttempt = problemAttempts.toSorted(
          (left, right) => new Date(right.endedAt).getTime() - new Date(left.endedAt).getTime(),
        )[0];

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
          bestDurationSeconds: formatBestDuration(problemAttempts),
        };
      }),
    ),
  );
  const problemTitleByNumber = new Map(
    problems.map((problem) => [problem.number, problem.title]),
  );
  const attemptRows: LeetcodeAttemptRow[] = attempts
    .map((attempt) => ({
      attemptId: attempt.attemptId,
      problemId: attempt.problemId,
      problemTitle: problemTitleByNumber.get(attempt.problemId) ?? attempt.problemId,
      isSuccessful: attempt.isSuccessful,
      startedAt: attempt.startedAt,
      endedAt: attempt.endedAt,
      durationSeconds: attempt.durationSeconds,
    }))
    .toSorted(
      (left, right) => new Date(right.endedAt).getTime() - new Date(left.endedAt).getTime(),
    );
  const patterns = patternTree.map((pattern) => ({
    name: pattern.topPattern,
    count: pattern.subPatterns.reduce(
      (total, subPattern) => total + subPattern.problems.length,
      0,
    ),
  }));

  return (
    <LeetcodeDashboardClient
      patterns={patterns}
      problems={problems}
      attempts={attemptRows}
    />
  );
}
