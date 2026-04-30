import { describe, expect, it } from "vitest";

import { normalizeLeetcodeProblem } from "./leetcode-patterns";

describe("normalizeLeetcodeProblem", () => {
  it("keeps optional NeetCode solution links from object entries", () => {
    expect(
      normalizeLeetcodeProblem({
        number: "11",
        title: "Container With Most Water",
        leetcodeUrl: "https://leetcode.com/problems/container-with-most-water/",
        difficulty: "medium",
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
      solutions: {
        neetcode: {
          textUrl: "https://neetcode.io/solutions/container-with-most-water",
          videoUrl: "https://www.youtube.com/watch?v=UuiTKBwPgAo",
        },
      },
    });
  });
});
