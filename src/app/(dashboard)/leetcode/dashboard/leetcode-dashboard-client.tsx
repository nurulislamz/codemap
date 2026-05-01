"use client";

import { useMemo, useState } from "react";
import {
  LeetcodeProblemTable,
  type LeetcodeAttemptRow,
  type LeetcodeProblemRow,
} from "../leetcode-problem-table";

type PatternSummary = {
  name: string;
  count: number;
};

type LeetcodeDashboardClientProps = {
  patterns: PatternSummary[];
  problems: LeetcodeProblemRow[];
  attempts: LeetcodeAttemptRow[];
};

export function LeetcodeDashboardClient({
  patterns,
  problems,
  attempts,
}: LeetcodeDashboardClientProps) {
  const [selectedPattern, setSelectedPattern] = useState<string | null>(
    patterns[0]?.name ?? null,
  );

  const selectedProblemCount = useMemo(
    () =>
      selectedPattern
        ? problems.filter((problem) => problem.pattern === selectedPattern).length
        : problems.length,
    [problems, selectedPattern],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="rounded-3xl border border-base-300 bg-base-100/80 p-5 shadow-lg shadow-black/10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-base-content">Major Patterns</h2>
            <button
              type="button"
              className="btn btn-ghost btn-xs cursor-pointer rounded-full"
              onClick={() => setSelectedPattern(null)}
            >
              All
            </button>
          </div>

          <div className="space-y-1">
            {patterns.map((pattern) => {
              const isSelected = pattern.name === selectedPattern;

              return (
                <button
                  key={pattern.name}
                  type="button"
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-base-200 ${
                    isSelected
                      ? "border border-primary/30 bg-primary/10 text-primary"
                      : "text-base-content/70"
                  }`}
                  onClick={() => setSelectedPattern(pattern.name)}
                >
                  <span>{pattern.name}</span>
                  <span className="rounded-lg bg-base-200 px-2 py-1 text-xs text-base-content/60">
                    {pattern.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl border border-warning/20 bg-warning/10 p-4 text-xs leading-5 text-base-content/70">
            Select a pattern to instantly filter the problems table.
          </div>
        </aside>

        <main className="space-y-5">
          <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {selectedPattern ?? "All Problems"}
              </h1>
              <p className="mt-2 text-sm text-base-content/60">
                Showing {selectedProblemCount} problems using the main LeetCode table.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="btn btn-primary rounded-xl px-8">Today</button>
              <button className="btn btn-outline rounded-xl px-8">Next 30 Days</button>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Due Today", "-", "problems", "-"],
              ["This Week", "-", "problems", "-"],
              ["30-Day Plan", "-", "problems", "-"],
              ["Pattern mastery", "-", "", "-"],
            ].map(([label, value, suffix, note]) => (
              <div
                key={label}
                className="rounded-2xl border border-base-300 bg-base-100/80 p-5 shadow-lg shadow-black/10"
              >
                <div className="text-sm font-semibold text-base-content/70">{label}</div>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-3xl font-bold text-primary">{value}</span>
                  {suffix ? (
                    <span className="pb-1 text-sm text-base-content/60">{suffix}</span>
                  ) : null}
                </div>
                <div className="mt-3 text-sm text-base-content/40">{note}</div>
              </div>
            ))}
          </section>

          <LeetcodeProblemTable
            problems={problems}
            attempts={attempts}
            externalPattern={selectedPattern}
          />
        </main>
      </div>
    </div>
  );
}
