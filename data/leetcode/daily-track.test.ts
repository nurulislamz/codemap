import { describe, expect, it } from "vitest";

import dailyTrack from "./daily-track.json";
import patterns from "./leetcode-patterns.json";

type DailyTrackV2 = {
  version: 2;
  generatedFrom: string;
  days: Array<{
    day: number;
    focus: {
      pattern: string;
      subPattern: string;
      label: string;
    };
    estimatedMinutes: number;
    tasks: Array<{
      slot: number;
      role: "warmup" | "core" | "stretch";
      problemId: string;
    }>;
  }>;
};
type CatalogProblem = {
  number: string;
  difficulty: string;
  estimatedMinutes: number;
};
type CatalogPatterns = {
  patterns: Array<{
    name: string;
    subPatterns: Array<{
      name: string;
      problems: CatalogProblem[];
    }>;
  }>;
};

function catalogProblemsById() {
  const problemsById = new Map<
    string,
    CatalogProblem & { pattern: string; subPattern: string }
  >();
  const catalog = patterns as CatalogPatterns;

  for (const pattern of catalog.patterns) {
    for (const subPattern of pattern.subPatterns) {
      for (const problem of subPattern.problems) {
        if (!problemsById.has(problem.number)) {
          problemsById.set(problem.number, {
            ...problem,
            pattern: pattern.name,
            subPattern: subPattern.name,
          });
        }
      }
    }
  }

  return problemsById;
}

describe("dailyTrack", () => {
  it("stores a versioned, annotated daily curriculum with task slots", () => {
    const track = dailyTrack as DailyTrackV2;
    const catalogProblems = catalogProblemsById();
    const seenIds = new Set<string>();
    const validRoles = new Set(["warmup", "core", "stretch"]);

    expect(track.version).toBe(2);
    expect(track.generatedFrom).toBe("data/leetcode/leetcode-patterns.json");
    expect(track.days.length).toBeGreaterThan(0);

    track.days.forEach((day, index) => {
      expect(day.day).toBe(index + 1);
      expect(day.focus.pattern.trim().length).toBeGreaterThan(0);
      expect(day.focus.subPattern.trim().length).toBeGreaterThan(0);
      expect(day.focus.label.trim().length).toBeGreaterThan(0);
      expect(day.tasks.length).toBeGreaterThan(0);
      expect(day.tasks.length).toBeLessThanOrEqual(3);

      let estimatedMinutes = 0;

      day.tasks.forEach((task, taskIndex) => {
        const problem = catalogProblems.get(task.problemId);

        expect(task.slot).toBe(taskIndex + 1);
        expect(validRoles.has(task.role)).toBe(true);
        expect(problem).toBeDefined();
        expect(problem?.pattern).toBe(day.focus.pattern);
        expect(problem?.subPattern).toBe(day.focus.subPattern);
        expect(seenIds.has(task.problemId)).toBe(false);

        seenIds.add(task.problemId);
        estimatedMinutes += problem?.estimatedMinutes ?? 0;
      });

      expect(day.estimatedMinutes).toBe(estimatedMinutes);
      expect(day.estimatedMinutes).toBeLessThanOrEqual(120);
    });

    expect(seenIds).toEqual(new Set(catalogProblems.keys()));
  });
});
