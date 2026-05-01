"use client";

import { useState } from "react";
import { LeetcodePatternOverview } from "./leetcode-pattern-overview";
import { LeetcodePracticeSummary } from "./leetcode-practice-summary";
import {
  LeetcodeProblemTable,
  type LeetcodeAttemptRow,
  type LeetcodeProblemRow,
} from "./leetcode-problem-table";

type LeetcodePracticeDashboardProps = {
  problems: LeetcodeProblemRow[];
  attempts: LeetcodeAttemptRow[];
};

export function LeetcodePracticeDashboard({
  problems,
  attempts,
}: LeetcodePracticeDashboardProps) {
  const [showOverview, setShowOverview] = useState(false);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-lg shadow-primary/10">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            >
              <path d="m8 8-4 4 4 4" />
              <path d="m16 8 4 4-4 4" />
              <path d="m14 4-4 16" />
            </svg>
          </div>

          <div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Practice Problems
            </h1>
            <p className="mt-3 text-lg text-base-content/60">
              Sharpen your skills by solving hand-picked coding problems.
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-expanded={showOverview}
          className="group flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-base-300 bg-base-100/80 p-4 text-left shadow-lg shadow-black/10 transition hover:border-primary/40 hover:bg-base-100 md:w-auto"
          onClick={() => setShowOverview((current) => !current)}
        >
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            >
              <path d="M3 17 9 11l4 4 8-8" />
              <path d="M14 7h7v7" />
            </svg>
          </div>
          <div>
            <div className="text-3xl font-bold leading-none">{problems.length}</div>
            <div className="mt-1 text-sm text-base-content/60">
              Problems available
            </div>
            <div className="mt-2 text-xs font-semibold text-primary opacity-80 transition group-hover:opacity-100">
              {showOverview ? "Hide dashboard" : "Show dashboard"}
            </div>
          </div>
        </button>
      </section>

      <LeetcodePracticeSummary problems={problems} />

      {showOverview ? (
        <section>
          <LeetcodePatternOverview problems={problems} />
        </section>
      ) : null}

      <LeetcodeProblemTable problems={problems} attempts={attempts} />
    </div>
  );
}
