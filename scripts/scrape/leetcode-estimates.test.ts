import { describe, expect, it } from "vitest";

import {
  addEstimatedMinutes,
  estimateProblemMinutes,
  parseLeetcodePatterns,
  serializeLeetcodePatterns,
} from "./leetcode-estimates";

describe("estimateProblemMinutes", () => {
  it("keeps straightforward easy problems short", () => {
    expect(
      estimateProblemMinutes({
        title: "Valid Anagram",
        difficulty: "easy",
        pattern: "Hash Map",
        subPattern: "Frequency Counting",
      }),
    ).toBe(15);
  });

  it("adds time for medium dynamic programming problems", () => {
    expect(
      estimateProblemMinutes({
        title: "Longest Increasing Subsequence",
        difficulty: "medium",
        pattern: "Dynamic Programming",
        subPattern: "1D DP",
      }),
    ).toBe(45);
  });

  it("adds extra time for hard design/cache problems", () => {
    expect(
      estimateProblemMinutes({
        title: "LFU Cache",
        difficulty: "hard",
        pattern: "Design",
        subPattern: "Cache",
      }),
    ).toBe(75);
  });
});

describe("addEstimatedMinutes", () => {
  it("adds estimates to object problems while preserving comments", () => {
    const input = `// local note

{
  "patterns": [
    {
      "name": "Two Pointer",
      "subPatterns": [
        {
          "name": "Converging",
          "problems": [
            {
              "number": "11",
              "title": "Container With Most Water",
              "leetcodeUrl": "https://leetcode.com/problems/container-with-most-water/",
              "difficulty": "medium"
            }
          ]
        }
      ]
    }
  ]
}
`;

    const parsed = parseLeetcodePatterns(input);
    addEstimatedMinutes(parsed.data);
    const output = serializeLeetcodePatterns(parsed);

    expect(output.startsWith("// local note")).toBe(true);
    expect(output).toContain('"estimatedMinutes": 30');
  });
});
