import { describe, expect, it } from "vitest";

import {
  assertRawLeetcodePatterns,
  getLeetcodeCatalog,
  normalizeLeetcodeProblem,
} from "./catalog";
import { LeetcodeProblemDifficultyLabel } from "./types";

describe("normalizeLeetcodeProblem", () => {
  it("keeps optional NeetCode solution links from object entries", () => {
    expect(
      normalizeLeetcodeProblem({
        number: "11",
        title: "Container With Most Water",
        leetcodeUrl: "https://leetcode.com/problems/container-with-most-water/",
        difficulty: "medium",
        estimatedMinutes: 30,
        solutions: {
          neetcode: {
            textUrl: "https://neetcode.io/solutions/container-with-most-water",
            videoUrl: "https://www.youtube.com/watch?v=UuiTKBwPgAo",
          },
        },
      }),
    ).toMatchObject({
      number: "11",
      title: "Container With Most Water",
      estimatedMinutes: 30,
      solutions: {
        neetcode: {
          textUrl: "https://neetcode.io/solutions/container-with-most-water",
          videoUrl: "https://www.youtube.com/watch?v=UuiTKBwPgAo",
        },
      },
    });
  });

  it("rejects string problem entries in catalog data", () => {
    expect(() =>
      assertRawLeetcodePatterns({
        patterns: [
          {
            name: "Two Pointer",
            subPatterns: [
              {
                name: "Converging",
                problems: ["11. Container With Most Water"],
              },
            ],
          },
        ],
      }),
    ).toThrow(/non-object problem/);
  });

  it("normalizes raw catalog difficulty values to display labels", () => {
    const catalog = getLeetcodeCatalog();
    const container = Array.from(catalog.problems.values())
      .flat()
      .find((problem) => problem.number === "11");

    expect(container?.difficulty).toBe(LeetcodeProblemDifficultyLabel.Medium);
  });

  it("builds a hierarchical catalog index for patterns and problems", () => {
    const catalog = getLeetcodeCatalog();

    const twoPointer = catalog.index.get("Two Pointer");
    const converging = twoPointer?.subPatterns.get("Converging");

    expect(
      twoPointer?.problemIndexes.some(
        (problemIndex) => catalog.problems.get(problemIndex)?.[0]?.number === "11",
      ),
    ).toBe(true);
    expect(
      converging?.problemIndexes.map(
        (problemIndex) => catalog.problems.get(problemIndex)?.[0]?.number,
      ),
    ).toContain("11");
  });

  it("stores major patterns and sub-patterns in the flat pattern count map", () => {
    const catalog = getLeetcodeCatalog();

    expect(catalog.patternCounts.get("Two Pointer")?.count).toBeGreaterThan(0);
    expect(catalog.patternCounts.get("Converging")?.count).toBeGreaterThan(0);
  });
});
