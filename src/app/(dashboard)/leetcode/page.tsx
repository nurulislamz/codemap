import { getLeetcodePatternTree } from "@/lib/leetcode-patterns";
import {
  LeetcodeProblemTable,
  type LeetcodeProblemRow,
} from "./leetcode-problem-table";

export default async function LeetCodePage() {
  const problems: LeetcodeProblemRow[] = getLeetcodePatternTree().flatMap((pattern) =>
    pattern.subPatterns.flatMap((subPattern) =>
      subPattern.problems.map((problem) => ({
        number: problem.number,
        title: problem.title,
        difficulty: problem.difficulty,
        pattern: pattern.topPattern,
        subPattern: subPattern.subPattern,
        leetcodeUrl: problem.leetcodeUrl,
        solutionUrl: problem.solutions?.neetcode?.textUrl,
        solutionVideoUrl: problem.solutions?.neetcode?.videoUrl,
      })),
    ),
  );

  return (
    <div className="space-y-8">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
          LeetCode practice
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
          Pattern-first timed attempts
        </h1>
        <p className="mt-5 text-lg leading-8 text-base-content/70">
          Filter the problem set by pattern, subpattern, difficulty, or name.
        </p>
      </section>

      <LeetcodeProblemTable problems={problems} />
    </div>
  );
}
