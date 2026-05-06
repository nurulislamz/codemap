import {
  LeetcodeProblemStatusLabel,
  SaveLeetcodeAttemptAction,
} from "@/lib/leetcode/types";
import { LeetcodeProblemDifficultyLabel } from "@/lib/leetcode/types";
import { LeetcodeCatalog } from "@/lib/leetcode/catalog";
import { CodeIcon, LeetcodeHeroPanel } from "@/components/leetcode/leetcode-ui";

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