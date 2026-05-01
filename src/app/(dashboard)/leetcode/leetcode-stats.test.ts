import { describe, expect, it } from "vitest";

import { buildLeetcodeStats } from "./leetcode-stats";
import type { LeetcodeAttemptRow, LeetcodeProblemRow } from "./leetcode-types";

const problems: LeetcodeProblemRow[] = [
  {
    number: "1",
    title: "Two Sum",
    difficulty: "easy",
    pattern: "Hash Map",
    subPattern: "Lookup",
    leetcodeUrl: "https://leetcode.com/problems/two-sum/",
    estimatedMinutes: 15,
    isCompleted: true,
    lastAttemptedAt: "2026-04-29T10:20:00.000Z",
    attemptCount: 2,
    bestDurationSeconds: 700,
  },
  {
    number: "2",
    title: "Longest Increasing Subsequence",
    difficulty: "medium",
    pattern: "Dynamic Programming",
    subPattern: "1D DP",
    leetcodeUrl: "https://leetcode.com/problems/longest-increasing-subsequence/",
    estimatedMinutes: 45,
    isCompleted: false,
    lastAttemptedAt: "2026-04-30T11:00:00.000Z",
    attemptCount: 1,
    bestDurationSeconds: null,
  },
  {
    number: "3",
    title: "LFU Cache",
    difficulty: "hard",
    pattern: "Design",
    subPattern: "Cache",
    leetcodeUrl: "https://leetcode.com/problems/lfu-cache/",
    estimatedMinutes: 75,
    isCompleted: false,
    lastAttemptedAt: null,
    attemptCount: 0,
    bestDurationSeconds: null,
  },
];

const attempts: LeetcodeAttemptRow[] = [
  {
    attemptId: "a1",
    problemId: "1",
    problemTitle: "Two Sum",
    isSuccessful: true,
    startedAt: "2026-04-29T10:00:00.000Z",
    endedAt: "2026-04-29T10:20:00.000Z",
    durationSeconds: 700,
  },
  {
    attemptId: "a2",
    problemId: "1",
    problemTitle: "Two Sum",
    isSuccessful: false,
    startedAt: "2026-04-28T10:00:00.000Z",
    endedAt: "2026-04-28T10:30:00.000Z",
    durationSeconds: 1800,
  },
  {
    attemptId: "a3",
    problemId: "2",
    problemTitle: "Longest Increasing Subsequence",
    isSuccessful: false,
    startedAt: "2026-04-30T10:00:00.000Z",
    endedAt: "2026-04-30T11:00:00.000Z",
    durationSeconds: 3600,
  },
];

describe("buildLeetcodeStats", () => {
  it("summarizes completion, attempts, timing, difficulty, and pattern progress", () => {
    const stats = buildLeetcodeStats(problems, attempts);

    expect(stats.summary).toMatchObject({
      totalProblems: 3,
      attemptedProblems: 2,
      completedProblems: 1,
      completionRate: 33,
      totalEstimatedMinutes: 135,
      remainingEstimatedMinutes: 120,
    });
    expect(stats.attempts).toMatchObject({
      totalAttempts: 3,
      acceptedAttempts: 1,
      successRate: 33,
      averageSuccessfulDurationSeconds: 700,
    });
    expect(stats.byDifficulty.easy).toMatchObject({
      total: 1,
      completed: 1,
      attempted: 1,
      estimatedMinutes: 15,
    });
    expect(stats.byPattern.find((item) => item.pattern === "Hash Map")).toMatchObject({
      pattern: "Hash Map",
      total: 1,
      completed: 1,
      attempted: 1,
      completionRate: 100,
    });
    expect(stats.recentAttempts[0]?.attemptId).toBe("a3");
    expect(stats.consistency).toMatchObject({
      activeDays: 3,
      streakDays: 3,
      maxAttemptsInDay: 1,
    });
    expect(stats.consistency.attemptsByDay).toEqual([
      { date: "2026-04-28", attempts: 1, accepted: 0 },
      { date: "2026-04-29", attempts: 1, accepted: 1 },
      { date: "2026-04-30", attempts: 1, accepted: 0 },
    ]);
  });
});
