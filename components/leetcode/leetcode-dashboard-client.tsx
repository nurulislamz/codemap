"use client";

import { LeetcodeProblemTable } from "./leetcode-problem-table";
import {
  type LeetcodeAttemptRow,
  type LeetcodeProblemProgressRow,
  type SaveLeetcodeAttemptAction,
} from "@/lib/leetcode/types";

export type LeetcodeDashboardProblemRow = LeetcodeProblemProgressRow & {
  actionLabel: string;
  difficultyClassName: string;
  difficultyDotClassName?: string;
  lastNotes: string | null;
  statusLabel: string;
  statusClassName: string;
  statusDotClassName?: string;
};

type LeetcodeDashboardProblemTableClientProps = {
  problems: LeetcodeDashboardProblemRow[];
  attempts: LeetcodeAttemptRow[];
  saveAttemptAction?: SaveLeetcodeAttemptAction;
  showControls?: boolean;
  showPagination?: boolean;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  disableFilters?: {
    difficulty?: boolean;
    status?: boolean;
    pattern?: boolean;
    hasVideo?: boolean;
    clearFilters?: boolean;
  };
  onAttemptSaved?: () => void;
};

export function LeetcodeDashboardProblemTableClient({
  problems,
  attempts,
  showControls = true,
  showPagination = true,
  saveAttemptAction,
  title = "Today's Problems",
  subtitle,
  emptyMessage,
  disableFilters,
  onAttemptSaved,
}: LeetcodeDashboardProblemTableClientProps) {
  const tableSubtitle = subtitle ?? `${problems.length} problems to solve`;

  return (
    <LeetcodeProblemTable
      problems={problems}
      attempts={attempts}
      showControls={showControls}
      showPagination={showPagination}
      disabledFilters={disableFilters}
      title={title}
      subtitle={tableSubtitle}
      emptyMessage={emptyMessage ?? `${problems.length} problems to solve`}
      saveAttemptAction={saveAttemptAction}
      onAttemptSaved={onAttemptSaved}
    />
  );
}
