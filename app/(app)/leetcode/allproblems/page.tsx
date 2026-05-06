import {
  LeetcodeProblemStatusLabel,
  SaveLeetcodeAttemptAction,
} from "@/lib/leetcode/types";
import { LeetcodeProblemDifficultyLabel } from "@/lib/leetcode/types";
import { LeetcodeCatalog } from "@/lib/leetcode/catalog";
import {
  CodeIcon,
  LeetcodeHeroPanel,
  LeetcodeStatCard,
} from "@/components/leetcode/leetcode-ui";
import { LeetcodePracticeProgressClient } from "@/components/leetcode/leetcode-practice-progress-client";
import { saveLeetCodeAttempt } from "@/lib/leetcode/actions";
import {
  getSortedLeetcodeAttemptEventsForRequest,
  hydrateProblemsWithAttempts,
} from "@/lib/leetcode/attempts";
import { getLeetcodeCatalog } from "@/lib/leetcode/catalog";
import type { LeetCodeAttemptEvent } from "@/lib/firebase/leetcode";

type LeetCodePageProps = {
  searchParams?: Promise<{
    pattern?: string;
    subPattern?: string[];
    difficulty?: string;
    q?: string;
  }>;
};

type LeetcodePracticeDashboardProps = {
  catalog: LeetcodeCatalog;
  attemptEvents: LeetCodeAttemptEvent[];
  selectedPattern?: string | null;
  selectedSubPatterns?: string[];
  selectedDifficulty?: string | null;
  status?: LeetcodeProblemStatusLabel | null;
  query?: string | null;
  saveAttemptAction?: SaveLeetcodeAttemptAction;
};

type InvalidLeetcodeFilter = {
  type: "pattern" | "subPattern" | "difficulty";
  value: string;
};

export function LeetcodePracticeDashboard({
  catalog: catalog, 
  attemptEvents,
  selectedPattern: selectedPattern = null,
  selectedSubPatterns: selectedSubPattern = [],
  selectedDifficulty: selectedDifficulty = null,
  query = null,
  saveAttemptAction,
}: LeetcodePracticeDashboardProps) {

  const invalidFilters = validateFilters(
    catalog,
    selectedPattern,
    selectedSubPattern,
    selectedDifficulty,
  );
  if (invalidFilters.length > 0) {
    console.warn("Invalid Leetcode filters selected:", invalidFilters);
    selectedPattern = null;
    selectedSubPattern = [];
    selectedDifficulty = null;
  }
  const problems = Array.from(catalog.problems.values()).flat();
  const hydratedProblems = hydrateProblemsWithAttempts(problems, attemptEvents);
  const totalCount = problems.length;
  const completedCount = hydratedProblems.filter((problem) => problem.isCompleted).length;
  const attemptedCount = hydratedProblems.filter((problem) => problem.attemptCount > 0).length;
  const dueCount = hydratedProblems.filter((problem) => !problem.isCompleted).length;

  return (
    <div className="space-y-5">
      <LeetcodeHeroPanel
        icon={<CodeIcon className="h-9 w-9" />}
        title="Practice Problems"
        description="Sharpen your skills by solving hand-picked coding problems."
      >
        <form action="/leetcode/allproblems" className="w-full md:w-[25rem]">
          <label className="flex min-h-14 w-full min-w-0 items-center gap-3 rounded-full border border-[#26364d] bg-[#07111f]/70 px-6 shadow-inner shadow-black/10">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-6 w-6 shrink-0 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              name="q"
              defaultValue={query ? query : ""}  
              className="grow bg-transparent text-base text-slate-200 outline-none placeholder:text-slate-500"
              placeholder="Search problems..."
            />
            <button type="submit" className="sr-only">
              Search
            </button>
          </label>
        </form>
      </LeetcodeHeroPanel>

      {invalidFilters.length > 0 ? (
        <div
          role="alert"
          className="rounded-xl border border-[#ff8b3d]/30 bg-[#41271d]/60 px-5 py-4 text-sm font-semibold text-[#ffb06f]"
        >
          Unknown filter {invalidFilters.map((f) => f.value).join(", ")} selected. Showing all problems instead.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <LeetcodeStatCard
          label="Total Problems"
          value={totalCount}
          note="All available problems"
          tone="primary"
          icon={
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
              <path d="M8 6h11" />
              <path d="M8 12h11" />
              <path d="M8 18h11" />
              <path d="M3 6h.01" />
              <path d="M3 12h.01" />
              <path d="M3 18h.01" />
            </svg>
          }
        />
        <LeetcodeStatCard
          label="Completed"
          value={completedCount}
          note="Keep solving to grow"
          tone="success"
          icon={
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
              <path d="m9 12 2 2 4-5" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          }
        />
        <LeetcodeStatCard
          label="Attempted"
          value={attemptedCount}
          note={attemptedCount > 0 ? "Problems touched" : "Start your first problem"}
          tone="info"
          icon={
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
              <path d="M3 17 9 11l4 4 8-8" />
              <path d="M14 7h7v7" />
            </svg>
          }
        />
        <LeetcodeStatCard
          label="Due Today"
          value={dueCount}
          note="Keep your streak going"
          tone="warning"
          icon={
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
              <path d="M8 2v4" />
              <path d="M16 2v4" />
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M3 10h18" />
              <path d="M8 14h.01" />
              <path d="M12 14h.01" />
              <path d="M16 14h.01" />
            </svg>
          }
        />
      </section>

      <LeetcodePracticeProgressClient
        problems={problems}
        patterns={patterns}
        initialSelectedPattern={selectedPattern}
        initialSelectedSubPatterns={selectedSubPatterns}
        initialSelectedDifficulty={selectedDifficulty}
        query={queryValue}
        saveAttemptAction={saveAttemptAction}
      />
    </div>
  );
}

function validateFilters(
  catalog: LeetcodeCatalog,
  selectedPatternInput: string | null,
  selectedSubPatternInputs: string[],
  selectedDifficultyInput: string | null,
) {
  
  const invalidFilters: InvalidLeetcodeFilter[] = [];

  if (selectedPatternInput && !catalog.patternCounts.get(selectedPatternInput)) {
    invalidFilters.push({ type: "pattern", value: selectedPatternInput });
  }

  selectedSubPatternInputs.forEach((subPattern) => {
    if (!catalog.patternCounts.get(subPattern)) {
      invalidFilters.push({ type: "subPattern", value: subPattern });
    }
  });

  if (selectedDifficultyInput && !Object.values(LeetcodeProblemDifficultyLabel).includes(selectedDifficultyInput as LeetcodeProblemDifficultyLabel)) {
    invalidFilters.push({ type: "difficulty", value: selectedDifficultyInput });
  }
  
  return invalidFilters;
}
