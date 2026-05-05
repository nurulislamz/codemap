import { describe, expect, it } from "vitest";

import dailyTrack from "./daily-track.json";
import patterns from "./leetcode-patterns.json";

type DailyTrack = Record<string, string[]>;
type CatalogProblem = { number: string };
type CatalogPatterns = {
  patterns: Array<{
    subPatterns: Array<{
      problems: CatalogProblem[];
    }>;
  }>;
};

function catalogProblemIds(): Set<string> {
  const ids = new Set<string>();
  const catalog = patterns as CatalogPatterns;

  for (const pattern of catalog.patterns) {
    for (const subPattern of pattern.subPatterns) {
      for (const problem of subPattern.problems) {
        ids.add(problem.number);
      }
    }
  }

  return ids;
}

describe("dailyTrack", () => {
  it("groups catalog problem ids into sequential days of at most three problems", () => {
    const track = dailyTrack as DailyTrack;
    const dayNumbers = Object.keys(track).map(Number);
    const catalogIds = catalogProblemIds();
    const seenIds = new Set<string>();

    expect(dayNumbers.length).toBeGreaterThan(0);

    dayNumbers.forEach((dayNumber, index) => {
      expect(dayNumber).toBe(index + 1);

      const problemIds = track[String(dayNumber)];
      expect(problemIds.length).toBeGreaterThan(0);
      expect(problemIds.length).toBeLessThanOrEqual(3);

      for (const problemId of problemIds) {
        expect(catalogIds.has(problemId)).toBe(true);
        expect(seenIds.has(problemId)).toBe(false);
        seenIds.add(problemId);
      }
    });

    expect(seenIds).toEqual(catalogIds);
  });
});
