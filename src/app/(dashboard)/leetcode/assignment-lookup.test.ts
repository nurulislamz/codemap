import { describe, expect, it } from "vitest";
import { getLeetcodeAssignment } from "./assignment-lookup";

describe("getLeetcodeAssignment", () => {
  it("returns starter assignment display data and its server-owned limit", () => {
    const assignment = getLeetcodeAssignment("two-sum-ii");

    expect(assignment).toEqual({
      id: "two-sum-ii",
      title: "Two Sum II - Input Array Is Sorted",
      timeLimitMinutes: 30,
    });
  });

  it("throws for unknown assignment IDs", () => {
    expect(() => getLeetcodeAssignment("missing-assignment")).toThrow(
      /Unknown LeetCode assignment/,
    );
  });
});
