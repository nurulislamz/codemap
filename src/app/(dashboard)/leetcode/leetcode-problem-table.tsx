"use client";

import { useMemo, useState } from "react";

export type LeetcodeProblemRow = {
  number: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  pattern: string;
  subPattern: string;
  leetcodeUrl: string;
  solutionUrl?: string;
  solutionVideoUrl?: string;
};

type LeetcodeProblemTableProps = {
  problems: LeetcodeProblemRow[];
};

const allOption = "all";

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function difficultyBadgeClass(difficulty: LeetcodeProblemRow["difficulty"]) {
  switch (difficulty) {
    case "easy":
      return "badge-success";
    case "medium":
      return "badge-warning";
    case "hard":
      return "badge-error";
  }
}

export function LeetcodeProblemTable({ problems }: LeetcodeProblemTableProps) {
  const [query, setQuery] = useState("");
  const [pattern, setPattern] = useState(allOption);
  const [subPattern, setSubPattern] = useState(allOption);
  const [difficulty, setDifficulty] = useState(allOption);

  const patternOptions = useMemo(
    () => uniqueSorted(problems.map((problem) => problem.pattern)),
    [problems],
  );

  const subPatternOptions = useMemo(
    () =>
      uniqueSorted(
        problems
          .filter((problem) => pattern === allOption || problem.pattern === pattern)
          .map((problem) => problem.subPattern),
      ),
    [pattern, problems],
  );

  const filteredProblems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return problems.filter((problem) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        problem.title.toLowerCase().includes(normalizedQuery) ||
        problem.number.includes(normalizedQuery);

      return (
        matchesQuery &&
        (pattern === allOption || problem.pattern === pattern) &&
        (subPattern === allOption || problem.subPattern === subPattern) &&
        (difficulty === allOption || problem.difficulty === difficulty)
      );
    });
  }, [difficulty, pattern, problems, query, subPattern]);

  return (
    <section className="space-y-4">
      <div className="grid gap-3 rounded-box border border-base-300 bg-base-100 p-4 shadow-sm md:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
        <label className="form-control">
          <span className="label-text font-semibold">Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="input input-bordered"
            placeholder="Problem name or number"
          />
        </label>

        <label className="form-control">
          <span className="label-text font-semibold">Pattern</span>
          <select
            value={pattern}
            onChange={(event) => {
              setPattern(event.target.value);
              setSubPattern(allOption);
            }}
            className="select select-bordered"
          >
            <option value={allOption}>All patterns</option>
            {patternOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="form-control">
          <span className="label-text font-semibold">Subpattern</span>
          <select
            value={subPattern}
            onChange={(event) => setSubPattern(event.target.value)}
            className="select select-bordered"
          >
            <option value={allOption}>All subpatterns</option>
            {subPatternOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="form-control">
          <span className="label-text font-semibold">Difficulty</span>
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            className="select select-bordered"
          >
            <option value={allOption}>All difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100 shadow-sm">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>No.</th>
              <th>Problem</th>
              <th>Pattern</th>
              <th>Difficulty</th>
              <th>Links</th>
              <th>Timer</th>
            </tr>
          </thead>
          <tbody>
            {filteredProblems.map((problem) => (
              <tr key={`${problem.pattern}:${problem.subPattern}:${problem.number}:${problem.title}`}>
                <td className="font-mono text-sm">{problem.number}</td>
                <td>
                  <div className="font-semibold">{problem.title}</div>
                  <div className="text-sm text-base-content/60">{problem.subPattern}</div>
                </td>
                <td>{problem.pattern}</td>
                <td>
                  <span className={`badge ${difficultyBadgeClass(problem.difficulty)}`}>
                    {problem.difficulty}
                  </span>
                </td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={problem.leetcodeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline btn-xs"
                    >
                      LeetCode
                    </a>
                    {problem.solutionUrl ? (
                      <a
                        href={problem.solutionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline btn-xs"
                      >
                        Text
                      </a>
                    ) : null}
                    {problem.solutionVideoUrl ? (
                      <a
                        href={problem.solutionVideoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline btn-xs"
                      >
                        Video
                      </a>
                    ) : null}
                  </div>
                </td>
                <td>
                  <a href={`/leetcode/${problem.number}/timer`} className="btn btn-primary btn-sm">
                    Start
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-base-content/60">
        Showing {filteredProblems.length} of {problems.length} problems.
      </p>
    </section>
  );
}
