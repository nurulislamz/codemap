import { describe, expect, it } from "vitest";
import {
  completeAttemptFromAssignment,
  getLeetcodeAssignment,
} from "./assignment-lookup";

describe("getLeetcodeAssignment", () => {
  it("returns a server-owned startedAt value with the starter assignment limit", () => {
    const assignment = getLeetcodeAssignment(
      "two-sum-ii",
      "2026-04-26T10:00:00.000Z",
    );

    expect(assignment).toEqual({
      id: "two-sum-ii",
      title: "Two Sum II - Input Array Is Sorted",
      timeLimitMinutes: 30,
      startedAt: "2026-04-26T10:00:00.000Z",
    });
  });

  it("throws for unknown assignment IDs", () => {
    expect(() => getLeetcodeAssignment("missing-assignment")).toThrow(
      /Unknown LeetCode assignment/,
    );
  });
});

describe("completeAttemptFromAssignment", () => {
  it("uses the server assignment time limit when calculating overtime", () => {
    const assignment = getLeetcodeAssignment(
      "two-sum-ii",
      "2026-04-26T10:00:00.000Z",
    );

    const result = completeAttemptFromAssignment({
      assignment,
      endedAt: "2026-04-26T10:31:00.000Z",
      status: "completed",
    });

    expect(result).toEqual({
      elapsedSeconds: 1860,
      isOverTime: true,
      status: "completed",
    });
  });
});
