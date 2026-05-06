import "server-only";

import rawPatterns from "@/data/leetcode/leetcode-patterns.json";
import {
  type LeetcodePatternCounts,
  LeetcodeProblemDifficultyLabel,
  type LeetcodeProblemRow,
} from "@/lib/leetcode/types";
import { StringValidation } from "zod/v3";

export type LeetcodeCatalog = {
  problems: Map<number, LeetcodeProblemRow[]>;
  patternCounts: Map<string, LeetcodePatternCounts>;
  index: Map<string, LeetcodeCatalogPatternEntry>;
};

export type LeetcodeCatalogPatternEntry = {
  subPatterns: Map<string, LeetcodeCatalogSubPatternEntry>;
  problemIndexes: number[];
};

export type LeetcodeCatalogSubPatternEntry = {
  name: string;
  problemIndexes: number[];
};

let cachedCatalog: LeetcodeCatalog | null = null;

export function getLeetcodeCatalog(): LeetcodeCatalog {
  if (cachedCatalog) return cachedCatalog;

  assertRawLeetcodePatterns(rawPatterns);
  const data = rawPatterns;
  const problems = new Map<number, LeetcodeProblemRow[]>();
  const patternCounts = new Map<string, LeetcodePatternCounts>();
  const index = new Map<string, LeetcodeCatalogPatternEntry>();

  for (const pattern of data.patterns) {
    let majorPatternCount = 0;
    const subPatternCounts: LeetcodePatternCounts[] = [];
    const patternProblemIndexes: number[] = [];
    const indexedSubPatterns = new Map<string, LeetcodeCatalogSubPatternEntry>();

    for (const subPattern of pattern.subPatterns) {
      majorPatternCount += subPattern.problems.length;
      const subPatternProblemIndexes: number[] = [];

      subPatternCounts.push({
        count: subPattern.problems.length,
      });

      for (const rawProblem of subPattern.problems) {
        const problem = normalizeLeetcodeProblem(rawProblem);

        const row = {
          number: problem.number,
          title: problem.title,
          difficulty: problem.difficulty,
          pattern: pattern.name,
          subPattern: subPattern.name,
          leetcodeUrl: problem.leetcodeUrl,
          estimatedMinutes: problem.estimatedMinutes,
          solutionUrl: problem.solutions?.neetcode?.textUrl,
          solutionVideoUrl: problem.solutions?.neetcode?.videoUrl,
        };
        const problemIndex = problems.size;

        problems.set(problemIndex, [row]);
        patternProblemIndexes.push(problemIndex);
        subPatternProblemIndexes.push(problemIndex);
      }

      indexedSubPatterns.set(subPattern.name, {
        name: subPattern.name,
        problemIndexes: subPatternProblemIndexes,
      });
    }

    patternCounts.set(pattern.name, {
      count: majorPatternCount,
      children: subPatternCounts,
    });

    index.set(pattern.name, {
      subPatterns: indexedSubPatterns,
      problemIndexes: patternProblemIndexes,
    });
  }

  cachedCatalog = {
    problems,
    patternCounts,
    index,
  };

  return cachedCatalog;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDifficulty(value: unknown): value is RawLeetcodeProblemDifficulty {
  return value === "easy" || value === "medium" || value === "hard";
}

function normalizeDifficulty(
  difficulty: RawLeetcodeProblemDifficulty,
): LeetcodeProblemDifficultyLabel {
  switch (difficulty) {
    case "easy":
      return LeetcodeProblemDifficultyLabel.Easy;
    case "medium":
      return LeetcodeProblemDifficultyLabel.Medium;
    case "hard":
      return LeetcodeProblemDifficultyLabel.Hard;
  }
}

export function assertRawLeetcodePatterns(
  value: unknown,
): asserts value is RawLeetcodePatterns {
  if (!isRecord(value) || !Array.isArray(value.patterns)) {
    throw new Error("LeetCode catalog must have a patterns array.");
  }

  for (const pattern of value.patterns) {
    if (!isRecord(pattern) || typeof pattern.name !== "string") {
      throw new Error("LeetCode catalog patterns must have a name.");
    }

    if (!Array.isArray(pattern.subPatterns)) {
      throw new Error(`LeetCode pattern "${pattern.name}" must have subPatterns.`);
    }

    for (const subPattern of pattern.subPatterns) {
      if (!isRecord(subPattern) || typeof subPattern.name !== "string") {
        throw new Error(
          `LeetCode pattern "${pattern.name}" has an invalid sub-pattern.`,
        );
      }

      if (!Array.isArray(subPattern.problems)) {
        throw new Error(
          `LeetCode sub-pattern "${subPattern.name}" must have problems.`,
        );
      }

      for (const problem of subPattern.problems) {
        if (!isRecord(problem)) {
          throw new Error(
            `LeetCode sub-pattern "${subPattern.name}" contains a non-object problem.`,
          );
        }

        if (
          typeof problem.number !== "string" ||
          typeof problem.title !== "string" ||
          typeof problem.leetcodeUrl !== "string" ||
          !isDifficulty(problem.difficulty) ||
          typeof problem.estimatedMinutes !== "number" ||
          !Number.isFinite(problem.estimatedMinutes)
        ) {
          throw new Error(
            `LeetCode problem in "${subPattern.name}" is missing required fields.`,
          );
        }
      }
    }
  }
}

type RawLeetcodeProblemDifficulty = "easy" | "medium" | "hard";

type RawLeetcodeProblem = {
  number: string;
  title: string;
  leetcodeUrl: string;
  difficulty: RawLeetcodeProblemDifficulty;
  estimatedMinutes: number;
  solutions?: {
    neetcode?: {
      textUrl?: string | null;
      videoUrl?: string | null;
    } | null;
  } | null;
};

type RawLeetcodePatterns = {
  patterns: {
    name: string;
    subPatterns: {
      name: string;
      problems: RawLeetcodeProblem[];
    }[];
  }[];
};

export type NormalizedProblem = {
  number: string;
  title: string;
  leetcodeUrl: string;
  difficulty: LeetcodeProblemDifficultyLabel;
  estimatedMinutes: number;
  solutions?: {
    neetcode?: {
      textUrl: string;
      videoUrl?: string;
    };
  };
};

export function normalizeLeetcodeProblem(
  problem: RawLeetcodeProblem,
): NormalizedProblem {
  const neetcode = problem.solutions?.neetcode;
  const solutions =
    neetcode?.textUrl
      ? {
          neetcode: {
            textUrl: neetcode.textUrl,
            ...(neetcode.videoUrl ? { videoUrl: neetcode.videoUrl } : {}),
          },
        }
      : null;

  return {
    number: problem.number,
    title: problem.title,
    leetcodeUrl: problem.leetcodeUrl,
    difficulty: normalizeDifficulty(problem.difficulty),
    estimatedMinutes: problem.estimatedMinutes,
    ...(solutions ? { solutions } : {}),
  };
}
