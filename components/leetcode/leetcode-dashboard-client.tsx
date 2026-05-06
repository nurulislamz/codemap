"use client";

import { useMemo, useState } from "react";
import { LeetcodeAttemptOverlayButton } from "./leetcode-attempt-overlay";
import {
  type LeetcodeProblemProgressRow,
  type LeetcodeProblemRow,
  type SaveLeetcodeAttemptAction,
} from "@/lib/leetcode/types";
import { LeetcodePanel } from "./leetcode-ui";

export type LeetcodeDashboardProblemRow = LeetcodeProblemProgressRow & {
  actionLabel: string;
  difficultyClassName: string;
  lastNotes: string | null;
  statusClassName: string;
  statusLabel: string;
};

export type LeetcodeDashboardDifficultyFilter = "all" | LeetcodeProblemRow["difficulty"];

export type LeetcodeDashboardDifficultyFilterOption = {
  label: string;
  selectedClassName: string;
  value: LeetcodeDashboardDifficultyFilter;
};

type LeetcodeDashboardProblemTableClientProps = {
  difficultyFilters: LeetcodeDashboardDifficultyFilterOption[];
  problems: LeetcodeDashboardProblemRow[];
  saveAttemptAction?: SaveLeetcodeAttemptAction;
};

function SearchIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

export function LeetcodeDashboardProblemTableClient({
  difficultyFilters,
  problems,
  saveAttemptAction,
}: LeetcodeDashboardProblemTableClientProps) {
  const [difficulty, setDifficulty] = useState<LeetcodeDashboardDifficultyFilter>("all");
  const [query, setQuery] = useState("");
  const normalizedQuery = useMemo(() => query.trim().toLowerCase(), [query]);
  const filteredProblems = useMemo(
    () =>
      problems.filter((problem) => {
        const matchesDifficulty = difficulty === "all" || problem.difficulty === difficulty;
        const matchesQuery =
          normalizedQuery.length === 0 ||
          problem.title.toLowerCase().includes(normalizedQuery) ||
          problem.pattern.toLowerCase().includes(normalizedQuery);

        return matchesDifficulty && matchesQuery;
      }),
    [difficulty, normalizedQuery, problems],
  );

  return (
    <LeetcodePanel className="p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Today&apos;s Problems</h2>
          <p className="mt-1 text-lg text-slate-400">
            {problems.length} selected problems for your practice session
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {difficultyFilters.map((filter) => {
              const isSelected = difficulty === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  className={`h-10 rounded-xl border px-4 text-sm font-bold transition ${
                    isSelected
                      ? filter.selectedClassName
                      : "border-[#26364d] bg-[#101a2a] text-slate-300 hover:border-[#5a4fc2]"
                  }`}
                  onClick={() => setDifficulty(filter.value)}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex h-12 w-full items-center gap-3 rounded-xl border border-[#26364d] bg-[#172337] px-4 lg:w-80">
          <SearchIcon className="h-5 w-5 text-slate-500" />
          <input
            className="min-w-0 flex-1 bg-transparent text-base text-slate-200 outline-none placeholder:text-slate-500"
            placeholder="Search problems..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-[#26364d]">
        <table className="w-full min-w-[58rem] text-left">
          <thead className="bg-[#111d30] text-sm font-semibold text-slate-400">
            <tr>
              <th className="w-16 px-5 py-4">
                <span className="block h-5 w-5 rounded border border-[#516278]" />
              </th>
              <th className="px-4 py-4">Problem</th>
              <th className="px-4 py-4">Pattern</th>
              <th className="px-4 py-4">Difficulty</th>
              <th className="px-4 py-4">Est. Time</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#243149] bg-[#101a2a]/60">
            {filteredProblems.map((problem, index) => (
              <tr key={problem.number} className="text-sm text-slate-300">
                <td className="px-5 py-4">
                  <span className="block h-5 w-5 rounded border border-[#516278]" />
                </td>
                <td className="px-4 py-4 font-semibold text-white">
                  {index + 1}. {problem.title}
                </td>
                <td className="px-4 py-4 text-slate-300">{problem.pattern}</td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-lg border px-4 py-2 text-sm font-bold capitalize ${problem.difficultyClassName}`}
                  >
                    {problem.difficulty}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-300">{problem.estimatedMinutes}m</td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-lg border px-4 py-2 text-sm font-semibold ${problem.statusClassName}`}
                  >
                    {problem.statusLabel}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <LeetcodeAttemptOverlayButton
                    problem={problem}
                    actionLabel={problem.actionLabel}
                    lastNotes={problem.lastNotes}
                    saveAttemptAction={saveAttemptAction}
                    className="inline-flex h-10 min-w-20 items-center justify-center rounded-lg bg-[#6747ff] px-5 text-sm font-bold text-white transition hover:bg-[#775bff]"
                  >
                    {problem.actionLabel}
                  </LeetcodeAttemptOverlayButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LeetcodePanel>
  );
}
