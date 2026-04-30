import rawPatterns from "@/data/leetcode/leetcode-patterns.json";

type RawPattern = {
  name: string;
  subPatterns: {
    name: string;
    problems: Array<
      | string
      | {
          number?: string | null;
          title?: string | null;
          leetcodeUrl?: string | null;
          difficulty?: "easy" | "medium" | "hard" | null;
          solutions?: {
            neetcode?: {
              textUrl?: string | null;
              videoUrl?: string | null;
            } | null;
          } | null;
        }
    >;
  }[];
};

type RawLeetcodePatterns = {
  patterns: RawPattern[];
};

type NormalizedPattern = {
  topPattern: string;
  subPatterns: {
    subPattern: string;
    problems: NormalizedProblem[];
  }[];
};

export type NormalizedProblem = {
  number: string;
  title: string;
  leetcodeUrl: string;
  difficulty: "easy" | "medium" | "hard";
  solutions?: {
    neetcode?: {
      textUrl: string;
      videoUrl?: string;
    };
  };
};

const DATA = rawPatterns as unknown as RawLeetcodePatterns;

export function getLeetcodePatternTree(): NormalizedPattern[] {
  return DATA.patterns.map((pattern) => ({
    topPattern: pattern.name,
    subPatterns: pattern.subPatterns.map((subPattern) => ({
      subPattern: subPattern.name,
      problems: subPattern.problems.map(normalizeLeetcodeProblem),
    })),
  }));
}

export function normalizeLeetcodeProblem(problem: RawPattern["subPatterns"][number]["problems"][number]): NormalizedProblem {
  if (typeof problem === "string") {
    const trimmed = problem.trim();
    const match = trimmed.match(/^(\d+)\.\s*(.+)$/);
    return {
      number: match?.[1] ?? "Problem",
      title: match?.[2] ?? trimmed,
      leetcodeUrl: "https://leetcode.com/problemset/",
      difficulty: "medium",
    };
  }

  const neetcode = problem.solutions?.neetcode;
  const solutions =
    neetcode?.textUrl
      ? {
          neetcode: {
            textUrl: neetcode.textUrl,
            ...(neetcode.videoUrl ? { videoUrl: neetcode.videoUrl } : {}),
          },
        }
      : undefined;

  return {
    number: problem.number ?? "Problem",
    title: problem.title ?? "LeetCode problem",
    leetcodeUrl: problem.leetcodeUrl ?? "https://leetcode.com/problemset/",
    difficulty:
      problem.difficulty === "easy" || problem.difficulty === "medium" || problem.difficulty === "hard"
        ? problem.difficulty
        : "medium",
    ...(solutions ? { solutions } : {}),
  };
}

export function getTopPattern(topPattern: string): NormalizedPattern | undefined {
  return getLeetcodePatternTree().find(
    (pattern) => pattern.topPattern.toLowerCase() === topPattern.toLowerCase(),
  );
}
