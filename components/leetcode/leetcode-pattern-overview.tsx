"use client";

import { useMemo } from "react";
import type { LeetcodeProblemRow } from "@/lib/leetcode/types";

type LeetcodePatternOverviewProps = {
  problems: LeetcodeProblemRow[];
};

type PatternOverviewItem = {
  pattern: string;
  total: number;
  attempted: number;
  completed: number;
};

export function LeetcodePatternOverview({ problems }: LeetcodePatternOverviewProps) {
  const patternOverview = useMemo(() => {
    const grouped = new Map<string, PatternOverviewItem>();

    for (const problem of problems) {
      const current = grouped.get(problem.pattern) ?? {
        pattern: problem.pattern,
        total: 0,
        attempted: 0,
        completed: 0,
      };

      grouped.set(problem.pattern, {
        ...current,
        total: current.total + 1,
        attempted: current.attempted + (problem.attemptCount > 0 ? 1 : 0),
        completed: current.completed + (problem.isCompleted ? 1 : 0),
      });
    }

    return Array.from(grouped.values());
  }, [problems]);

  const maxPatternCount = Math.max(
    1,
    ...patternOverview.map((patternItem) =>
      Math.max(patternItem.attempted, patternItem.completed),
    ),
  );

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100/80 p-4 shadow-sm">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-bold">Pattern overview</h2>
          <p className="text-xs text-base-content/60">
            Completed and attempted problems grouped by pattern.
          </p>
        </div>
        <div className="flex gap-3 text-xs font-semibold text-base-content/70">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-success" />
            Completed
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Attempted
          </span>
        </div>
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        {patternOverview.map((patternItem) => (
          <div
            key={patternItem.pattern}
            className="grid gap-2 rounded-xl border border-base-300 bg-base-200/50 p-2.5 sm:grid-cols-[170px_1fr_72px]"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-snug">
                {patternItem.pattern}
              </div>
              <div className="text-xs text-base-content/60">
                {patternItem.total} problems total
              </div>
            </div>

            <div className="min-h-4 self-center">
              {patternItem.attempted > 0 || patternItem.completed > 0 ? (
                <div className="space-y-2">
                  <div className="h-2 rounded-full bg-base-300">
                    <div
                      className="h-2 rounded-full bg-success"
                      style={{
                        width: `${(patternItem.completed / maxPatternCount) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="h-2 rounded-full bg-base-300">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${(patternItem.attempted / maxPatternCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2 text-sm sm:justify-end">
              <span className="font-semibold text-success">{patternItem.completed}</span>
              <span className="text-base-content/40">/</span>
              <span className="font-semibold text-primary">{patternItem.attempted}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
