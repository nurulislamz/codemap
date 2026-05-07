import { describe, expect, it } from "vitest";

import {
  getDailyTrackProblemTasks,
  selectDailyTrackDay,
  type DailyTrack,
} from "./daily-track";
import {
  LeetcodeProblemDifficultyLabel,
  type LeetcodeProblemProgressRow,
} from "./types";

const track: DailyTrack = {
  version: 2,
  generatedFrom: "data/leetcode/leetcode-patterns.json",
  days: [
    {
      day: 1,
      focus: {
        pattern: "Two Pointer",
        subPattern: "Converging",
        label: "Converging practice",
      },
      estimatedMinutes: 45,
      tasks: [
        { slot: 1, role: "warmup", problemId: "1" },
        { slot: 2, role: "core", problemId: "2" },
      ],
    },
    {
      day: 2,
      focus: {
        pattern: "Sliding Window",
        subPattern: "Fixed Window",
        label: "Fixed Window practice",
      },
      estimatedMinutes: 30,
      tasks: [{ slot: 1, role: "core", problemId: "3" }],
    },
  ],
};

const problems = new Map<string, LeetcodeProblemProgressRow>([
  [
    "1",
    problem({
      number: "1",
      title: "Two Sum",
      isCompleted: true,
      attemptCount: 1,
    }),
  ],
  [
    "2",
    problem({
      number: "2",
      title: "3Sum",
      isCompleted: false,
      attemptCount: 2,
    }),
  ],
  [
    "3",
    problem({
      number: "3",
      title: "Minimum Size Subarray Sum",
      isCompleted: false,
      attemptCount: 0,
    }),
  ],
]);

describe("daily track helpers", () => {
  it("starts a new user on the first daily track day", () => {
    expect(selectDailyTrackDay(track, new Date("2026-05-08T12:00:00Z"), null).day).toBe(1);
  });

  it("selects a daily track day from the user's start date", () => {
    const startedAt = new Date("2026-05-08T12:00:00Z");

    expect(selectDailyTrackDay(track, new Date("2026-05-08T12:00:00Z"), startedAt).day).toBe(1);
    expect(selectDailyTrackDay(track, new Date("2026-05-09T12:00:00Z"), startedAt).day).toBe(2);
    expect(selectDailyTrackDay(track, new Date("2026-05-10T12:00:00Z"), startedAt).day).toBe(1);
  });

  it("maps track tasks to progress rows", () => {
    const tasks = getDailyTrackProblemTasks(track.days[0], problems);

    expect(tasks).toHaveLength(2);
    expect(tasks[0]).toMatchObject({
      label: "Task 1",
      role: "warmup",
      status: "completed",
      problem: { title: "Two Sum" },
    });
    expect(tasks[1]).toMatchObject({
      label: "Task 2",
      role: "core",
      status: "in-progress",
      problem: { title: "3Sum" },
    });
  });
});

function problem({
  number,
  title,
  isCompleted,
  attemptCount,
}: {
  number: string;
  title: string;
  isCompleted: boolean;
  attemptCount: number;
}): LeetcodeProblemProgressRow {
  return {
    number,
    title,
    difficulty: LeetcodeProblemDifficultyLabel.Medium,
    pattern: "Two Pointer",
    subPattern: "Converging",
    leetcodeUrl: `https://leetcode.com/problems/${number}/`,
    estimatedMinutes: 30,
    isCompleted,
    lastAttemptedAt: attemptCount > 0 ? "2026-05-01T12:00:00.000Z" : null,
    attemptCount,
    bestDurationSeconds: isCompleted ? 900 : null,
  };
}
