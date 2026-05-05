import "server-only";

import { getLeetcodePatternTree } from "@/lib/leetcode/leetcode-patterns";
import type {
  LeetcodeCatalogProblem,
  LeetcodeMinorPatternCountsByPattern,
  LeetcodePatternSummary,
} from "@/lib/leetcode/types";

type LeetcodeCatalog = {
  problems: LeetcodeCatalogProblem[];
  majorPatternCounts: LeetcodePatternSummary[];
  minorPatternCountsByPattern: LeetcodeMinorPatternCountsByPattern;
  problemTitleByNumber: Map<string, string>;
};

let cachedCatalog: LeetcodeCatalog | null = null;

export function getLeetcodeCatalog(): LeetcodeCatalog {
  if (cachedCatalog) return cachedCatalog;

  const problems: LeetcodeCatalogProblem[] = [];
  const majorPatternCounts: LeetcodePatternSummary[] = [];
  const minorPatternCountsByPattern: LeetcodeMinorPatternCountsByPattern = {};
  const patternTree = getLeetcodePatternTree();

  for (const pattern of patternTree) {
    let majorPatternCount = 0;
    const minorPatternCounts: LeetcodePatternSummary[] = [];

    for (const subPattern of pattern.subPatterns) {
      majorPatternCount += subPattern.problems.length;
      minorPatternCounts.push({
        name: subPattern.subPattern,
        count: subPattern.problems.length,
      });

      for (const problem of subPattern.problems) {
        problems.push({
          number: problem.number,
          title: problem.title,
          difficulty: problem.difficulty,
          pattern: pattern.topPattern,
          subPattern: subPattern.subPattern,
          leetcodeUrl: problem.leetcodeUrl,
          estimatedMinutes: problem.estimatedMinutes,
          solutionUrl: problem.solutions?.neetcode?.textUrl,
          solutionVideoUrl: problem.solutions?.neetcode?.videoUrl,
        });
      }
    }

    majorPatternCounts.push({
      name: pattern.topPattern,
      count: majorPatternCount,
    });
    minorPatternCountsByPattern[pattern.topPattern] = minorPatternCounts;
  }

  cachedCatalog = {
    problems,
    majorPatternCounts,
    minorPatternCountsByPattern,
    problemTitleByNumber: new Map(
      problems.map((problem) => [problem.number, problem.title]),
    ),
  };

  return cachedCatalog;
}
