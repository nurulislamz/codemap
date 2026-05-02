"use client";

import type { LeetcodeProblemRow } from "@/lib/leetcode/types";

type LeetcodePracticeSummaryProps = {
  problems: LeetcodeProblemRow[];
};

export function LeetcodePracticeSummary({ problems }: LeetcodePracticeSummaryProps) {
  const completedCount = problems.filter((problem) => problem.isCompleted).length;
  const attemptedCount = problems.filter((problem) => problem.attemptCount > 0).length;

  return (
    <div className="grid gap-2 md:grid-cols-3">
      <div className="stats rounded-2xl border border-base-300 bg-base-100/80 shadow-sm">
        <div className="stat min-h-0 px-4 py-3">
          <div className="stat-title text-xs">Problems</div>
          <div className="stat-value text-2xl">{problems.length}</div>
        </div>
      </div>
      <div className="stats rounded-2xl border border-base-300 bg-base-100/80 shadow-sm">
        <div className="stat min-h-0 px-4 py-3">
          <div className="stat-title text-xs">Completed</div>
          <div className="stat-value text-2xl text-success">{completedCount}</div>
        </div>
      </div>
      <div className="stats rounded-2xl border border-base-300 bg-base-100/80 shadow-sm">
        <div className="stat min-h-0 px-4 py-3">
          <div className="stat-title text-xs">Attempted</div>
          <div className="stat-value text-2xl text-primary">{attemptedCount}</div>
        </div>
      </div>
    </div>
  );
}
