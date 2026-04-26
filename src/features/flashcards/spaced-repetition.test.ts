import { describe, expect, it } from "vitest";
import { nextReviewDate } from "./spaced-repetition";

describe("nextReviewDate", () => {
  it.each([
    [0, "2026-04-27T00:00:00.000Z"],
    [1, "2026-04-27T00:00:00.000Z"],
    [2, "2026-04-28T00:00:00.000Z"],
    [3, "2026-04-30T00:00:00.000Z"],
    [4, "2026-05-03T00:00:00.000Z"],
    [5, "2026-05-10T00:00:00.000Z"],
  ])("maps recall rating %i to its next review interval", (rating, expected) => {
    expect(nextReviewDate("2026-04-26T00:00:00Z", rating).toISOString()).toBe(
      expected,
    );
  });

  it("throws for recall ratings outside 0 through 5", () => {
    expect(() => nextReviewDate("2026-04-26T00:00:00Z", -1)).toThrow(/0 and 5/);
    expect(() => nextReviewDate("2026-04-26T00:00:00Z", 6)).toThrow(/0 and 5/);
  });

  it("throws a clear error for invalid review timestamps", () => {
    expect(() => nextReviewDate("not-a-date", 3)).toThrow(/Invalid reviewedAt/);
  });
});
