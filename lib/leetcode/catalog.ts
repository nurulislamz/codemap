import "server-only";

import rawPatterns from "@/data/leetcode/leetcode-patterns.json";
import {
  LeetcodeProblemDifficultyLabel,
  type LeetcodePatternGroup,
  type LeetcodePatternSummary,
  type LeetcodeProblemRow,
} from "@/lib/leetcode/types";

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

type LeetcodeCatalog = {
  problems: LeetcodeProblemRow[];
  patternGroups: LeetcodePatternGroup[];
  index: LeetcodeCatalogIndex;
};

export type LeetcodeCatalogIndex = {
  patterns: Map<string, LeetcodeCatalogPatternEntry>;
  problems: Map<string, LeetcodeProblemRow>;
};

export type LeetcodeCatalogPatternEntry = {
  group: LeetcodePatternGroup;
  subPatterns: Map<string, LeetcodeCatalogSubPatternEntry>;
  problems: LeetcodeProblemRow[];
};

export type LeetcodeCatalogSubPatternEntry = {
  summary: LeetcodePatternSummary;
  problems: LeetcodeProblemRow[];
};

let cachedCatalog: LeetcodeCatalog | null = null;

export function getLeetcodeCatalog(): LeetcodeCatalog {
  if (cachedCatalog) return cachedCatalog;

  assertRawLeetcodePatterns(rawPatterns);
  const data = rawPatterns;
  const problems: LeetcodeProblemRow[] = [];
  const patternGroups: LeetcodePatternGroup[] = [];
  const index: LeetcodeCatalogIndex = {
    patterns: new Map(),
    problems: new Map(),
  };

  for (const pattern of data.patterns) {
    let majorPatternCount = 0;
    const subPatterns: LeetcodePatternSummary[] = [];
    const patternProblems: LeetcodeProblemRow[] = [];
    const indexedSubPatterns = new Map<string, LeetcodeCatalogSubPatternEntry>();

    for (const subPattern of pattern.subPatterns) {
      majorPatternCount += subPattern.problems.length;
      const summary = {
        name: subPattern.name,
        count: subPattern.problems.length,
      };
      const subPatternProblems: LeetcodeProblemRow[] = [];

      subPatterns.push(summary);

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

        problems.push(row);
        patternProblems.push(row);
        subPatternProblems.push(row);
        index.problems.set(row.number, row);
      }

      indexedSubPatterns.set(subPattern.name, {
        summary,
        problems: subPatternProblems,
      });
    }

    const group = {
      name: pattern.name,
      count: majorPatternCount,
      subPatterns,
    };

    patternGroups.push(group);
    index.patterns.set(pattern.name, {
      group,
      subPatterns: indexedSubPatterns,
      problems: patternProblems,
    });
  }

  cachedCatalog = {
    problems,
    patternGroups,
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
