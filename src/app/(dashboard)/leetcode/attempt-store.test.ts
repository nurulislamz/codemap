import { describe, expect, it } from "vitest";
import { completeStarterAttempt, createStarterAttempt } from "./attempt-store";

describe("starter attempt store", () => {
  it("completes attempts using the stored assignment time limit", () => {
    const attempt = createStarterAttempt(
      "two-sum-ii",
      new Date("2026-04-26T10:00:00.000Z"),
    );

    const result = completeStarterAttempt({
      attemptId: attempt.attemptId,
      status: "completed",
      endedAt: new Date("2026-04-26T10:31:00.000Z"),
    });

    expect(result).toEqual({
      elapsedSeconds: 1860,
      isOverTime: true,
      status: "completed",
    });
  });

  it("throws for unknown attempt IDs", () => {
    expect(() =>
      completeStarterAttempt({
        attemptId: "missing-attempt",
        status: "completed",
      }),
    ).toThrow(/Unknown LeetCode attempt/);
  });

  it("rejects statuses outside the DB-valid attempt set", () => {
    const attempt = createStarterAttempt(
      "two-sum-ii",
      new Date("2026-04-26T10:00:00.000Z"),
    );

    expect(() =>
      completeStarterAttempt({
        attemptId: attempt.attemptId,
        status: "abandoned",
      }),
    ).toThrow(/Invalid attempt status.*abandoned/);
  });

  it("throws for invalid assignment IDs", () => {
    expect(() => createStarterAttempt("missing-assignment")).toThrow(
      /Unknown LeetCode assignment/,
    );
  });
});
