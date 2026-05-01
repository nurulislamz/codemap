import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultDataPath = "src/data/leetcode/leetcode-patterns.json";

type Difficulty = "easy" | "medium" | "hard";

type ProblemEntry = {
  number?: string | null;
  title?: string | null;
  leetcodeUrl?: string | null;
  difficulty?: Difficulty | null;
  estimatedMinutes?: number | null;
  solutions?: unknown;
};

type SubPatternEntry = {
  name: string;
  problems: Array<string | ProblemEntry>;
};

type PatternEntry = {
  name: string;
  subPatterns: SubPatternEntry[];
};

export type LeetcodePatternsData = {
  patterns: PatternEntry[];
};

export type ParsedLeetcodePatterns = {
  header: string;
  data: LeetcodePatternsData;
};

type EstimateInput = {
  title: string;
  difficulty: Difficulty;
  pattern: string;
  subPattern: string;
};

type CliOptions = {
  dataPath: string;
  write: boolean;
};

const baseMinutesByDifficulty: Record<Difficulty, number> = {
  easy: 15,
  medium: 30,
  hard: 55,
};

export function estimateProblemMinutes(input: EstimateInput): number {
  const text = `${input.title} ${input.pattern} ${input.subPattern}`.toLowerCase();
  let minutes = baseMinutesByDifficulty[input.difficulty];

  if (containsAny(text, ["dynamic programming", " dp", "trie", "segment tree", "binary indexed tree"])) {
    minutes += 15;
  }

  if (containsAny(text, ["graph", "topological", "dijkstra", "union find", "tarjan", "minimum spanning"])) {
    minutes += 10;
  }

  if (containsAny(text, ["design", "iterator", "data stream", "autocomplete", "snapshot"])) {
    minutes += 10;
  }

  if (containsAny(text, ["cache", "lfu", "lru"])) {
    minutes += 10;
  }

  if (containsAny(text, ["median", "regex", "regular expression", "wildcard", "maximal rectangle", "minimum window"])) {
    minutes += 10;
  }

  if (containsAny(text, ["ii", "iii", "iv", "k group", "k-th", "kth", "at least k"])) {
    minutes += 5;
  }

  return clamp(roundToFive(minutes), 10, 75);
}

export function addEstimatedMinutes(data: LeetcodePatternsData): void {
  for (const pattern of data.patterns) {
    for (const subPattern of pattern.subPatterns) {
      for (const problem of subPattern.problems) {
        if (typeof problem === "string") continue;
        problem.estimatedMinutes = estimateProblemMinutes({
          title: problem.title ?? "",
          difficulty: normalizeDifficulty(problem.difficulty),
          pattern: pattern.name,
          subPattern: subPattern.name,
        });
      }
    }
  }
}

export function parseLeetcodePatterns(content: string): ParsedLeetcodePatterns {
  const headerMatch = content.match(/^((?:\s*\/\/.*\n|\s*\n)*)/);
  const header = headerMatch?.[1] ?? "";
  const jsonContent = content.slice(header.length);

  return {
    header,
    data: JSON.parse(jsonContent) as LeetcodePatternsData,
  };
}

export function serializeLeetcodePatterns(parsed: ParsedLeetcodePatterns): string {
  const header = parsed.header.trimEnd();
  const body = JSON.stringify(parsed.data, null, 2);
  return `${header ? `${header}\n\n` : ""}${body}\n`;
}

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));
  const parsed = parseLeetcodePatterns(await readFile(options.dataPath, "utf8"));
  addEstimatedMinutes(parsed.data);

  if (options.write) {
    await writeFile(options.dataPath, serializeLeetcodePatterns(parsed), "utf8");
  }

  const counts = summarizeEstimates(parsed.data);
  console.log(
    `LeetCode estimates ${options.write ? "wrote data" : "dry run"}. total=${counts.total} min=${counts.min} max=${counts.max} avg=${counts.average}`,
  );
}

function parseCliOptions(args: string[]): CliOptions {
  const options: CliOptions = {
    dataPath: defaultDataPath,
    write: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    switch (arg) {
      case "--data":
        options.dataPath = requireValue(arg, next);
        index += 1;
        break;
      case "--write":
        options.write = true;
        break;
      case "--dry-run":
        options.write = false;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function summarizeEstimates(data: LeetcodePatternsData): {
  total: number;
  min: number;
  max: number;
  average: number;
} {
  const estimates = data.patterns.flatMap((pattern) =>
    pattern.subPatterns.flatMap((subPattern) =>
      subPattern.problems.flatMap((problem) =>
        typeof problem === "string" || typeof problem.estimatedMinutes !== "number"
          ? []
          : [problem.estimatedMinutes],
      ),
    ),
  );

  const total = estimates.length;
  const sum = estimates.reduce((accumulator, estimate) => accumulator + estimate, 0);

  return {
    total,
    min: Math.min(...estimates),
    max: Math.max(...estimates),
    average: Math.round(sum / total),
  };
}

function normalizeDifficulty(value: Difficulty | null | undefined): Difficulty {
  return value === "easy" || value === "medium" || value === "hard" ? value : "medium";
}

function containsAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}

function roundToFive(value: number): number {
  return Math.round(value / 5) * 5;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function requireValue(flag: string, value: string | undefined): string {
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value.`);
  }
  return value;
}

const thisFile = fileURLToPath(import.meta.url);
if (resolve(process.argv[1] ?? "") === thisFile) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
