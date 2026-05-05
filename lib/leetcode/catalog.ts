import "server-only";

import rawPatterns from "@/data/leetcode/leetcode-patterns.json";
import type {
  LeetcodePatternGroup,
  LeetcodePatternSummary,
  LeetcodeProblemDifficultyLabel,
  LeetcodeProblemRow,
} from "@/lib/leetcode/types";

type RawLeetcodeProblem = {
  number: string;
  title: string;
  leetcodeUrl: string;
  difficulty: LeetcodeProblemDifficultyLabel;
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
    difficulty: problem.difficulty,
    estimatedMinutes: problem.estimatedMinutes,
    ...(solutions ? { solutions } : {}),
  };
}

type LeetcodeCatalog = {
  problems: LeetcodeProblemRow[];
  patternGroups: LeetcodePatternGroup[];
  problemTitleByNumber: Map<string, string>;
};

let cachedCatalog: LeetcodeCatalog | null = null;

export function getLeetcodeCatalog(): LeetcodeCatalog {
  if (cachedCatalog) return cachedCatalog;

  assertRawLeetcodePatterns(rawPatterns);
  const data = rawPatterns;
  const problems: LeetcodeProblemRow[] = [];
  const patternGroups: LeetcodePatternGroup[] = [];

  for (const pattern of data.patterns) {
    let majorPatternCount = 0;
    const subPatterns: LeetcodePatternSummary[] = [];

    for (const subPattern of pattern.subPatterns) {
      majorPatternCount += subPattern.problems.length;
      subPatterns.push({
        name: subPattern.name,
        count: subPattern.problems.length,
      });

      for (const rawProblem of subPattern.problems) {
        const problem = normalizeLeetcodeProblem(rawProblem);

        problems.push({
          number: problem.number,
          title: problem.title,
          difficulty: problem.difficulty,
          pattern: pattern.name,
          subPattern: subPattern.name,
          leetcodeUrl: problem.leetcodeUrl,
          estimatedMinutes: problem.estimatedMinutes,
          solutionUrl: problem.solutions?.neetcode?.textUrl,
          solutionVideoUrl: problem.solutions?.neetcode?.videoUrl,
        });
      }
    }

    patternGroups.push({
      name: pattern.name,
      count: majorPatternCount,
      subPatterns,
    });
  }

  cachedCatalog = {
    problems,
    patternGroups,
    problemTitleByNumber: new Map(
      problems.map((problem) => [problem.number, problem.title]),
    ),
  };

  return cachedCatalog;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDifficulty(value: unknown): value is LeetcodeProblemRow["difficulty"] {
  return value === "easy" || value === "medium" || value === "hard";
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
