import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

type RawLeetcodeProblem = {
  number: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedMinutes: number;
};

type RawLeetcodePatterns = {
  patterns: Array<{
    name: string;
    subPatterns: Array<{
      name: string;
      problems: RawLeetcodeProblem[];
    }>;
  }>;
};

type DailyTrackTaskRole = "warmup" | "core" | "stretch";

type DailyTrackTask = {
  slot: number;
  role: DailyTrackTaskRole;
  problemId: string;
};

type DailyTrackDay = {
  day: number;
  focus: {
    pattern: string;
    subPattern: string;
    label: string;
  };
  estimatedMinutes: number;
  tasks: DailyTrackTask[];
};

type DailyTrack = {
  version: 2;
  generatedFrom: string;
  days: DailyTrackDay[];
};

type TrackProblem = RawLeetcodeProblem & {
  pattern: string;
  subPattern: string;
};

const sourcePath = "data/leetcode/leetcode-patterns.json";
const outputPath = "data/leetcode/daily-track.json";
const maxTasksPerDay = 3;
const maxMinutesPerDay = 120;
const difficultyRank = {
  easy: 1,
  medium: 2,
  hard: 3,
} satisfies Record<RawLeetcodeProblem["difficulty"], number>;

export function buildDailyTrack(catalog: RawLeetcodePatterns): DailyTrack {
  const seenProblemIds = new Set<string>();
  const days: DailyTrackDay[] = [];

  for (const pattern of catalog.patterns) {
    for (const subPattern of pattern.subPatterns) {
      const problems = subPattern.problems
        .filter((problem) => {
          if (seenProblemIds.has(problem.number)) return false;

          seenProblemIds.add(problem.number);
          return true;
        })
        .map((problem) => ({
          ...problem,
          pattern: pattern.name,
          subPattern: subPattern.name,
        }))
        .toSorted(compareProblemsForPractice);

      for (const group of groupProblemsIntoDays(problems)) {
        days.push({
          day: days.length + 1,
          focus: {
            pattern: pattern.name,
            subPattern: subPattern.name,
            label: `${subPattern.name} practice`,
          },
          estimatedMinutes: group.reduce(
            (total, problem) => total + problem.estimatedMinutes,
            0,
          ),
          tasks: group.map((problem, index) => ({
            slot: index + 1,
            role: taskRole(index, group.length),
            problemId: problem.number,
          })),
        });
      }
    }
  }

  return {
    version: 2,
    generatedFrom: sourcePath,
    days,
  };
}

function compareProblemsForPractice(
  left: RawLeetcodeProblem,
  right: RawLeetcodeProblem,
) {
  const difficultyDifference =
    difficultyRank[left.difficulty] - difficultyRank[right.difficulty];
  if (difficultyDifference !== 0) return difficultyDifference;

  const timeDifference = left.estimatedMinutes - right.estimatedMinutes;
  if (timeDifference !== 0) return timeDifference;

  return Number(left.number) - Number(right.number);
}

function groupProblemsIntoDays(problems: TrackProblem[]) {
  const groups: TrackProblem[][] = [];
  let currentGroup: TrackProblem[] = [];
  let currentMinutes = 0;

  for (const problem of problems) {
    const hasHardProblem = currentGroup.some((item) => item.difficulty === "hard");
    const shouldStartNextDay =
      currentGroup.length > 0 &&
      (currentGroup.length === maxTasksPerDay ||
        currentMinutes + problem.estimatedMinutes > maxMinutesPerDay ||
        (hasHardProblem && problem.difficulty === "hard"));

    if (shouldStartNextDay) {
      groups.push(currentGroup);
      currentGroup = [];
      currentMinutes = 0;
    }

    currentGroup.push(problem);
    currentMinutes += problem.estimatedMinutes;
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

function taskRole(index: number, count: number): DailyTrackTaskRole {
  if (count === 1) return "core";
  if (count === 2) return index === 0 ? "warmup" : "core";
  if (index === 0) return "warmup";
  if (index === 1) return "core";
  return "stretch";
}

async function main() {
  const catalog = JSON.parse(
    await readFile(resolve(sourcePath), "utf8"),
  ) as RawLeetcodePatterns;
  const track = buildDailyTrack(catalog);
  const resolvedOutputPath = resolve(outputPath);

  await mkdir(dirname(resolvedOutputPath), { recursive: true });
  await writeFile(resolvedOutputPath, `${JSON.stringify(track, null, 2)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
