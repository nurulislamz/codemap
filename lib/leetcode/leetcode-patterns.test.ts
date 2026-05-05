import { describe, expect, it } from "vitest";

import {
  assertRawLeetcodePatterns,
  normalizeLeetcodeProblem,
} from "./catalog";

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
});
