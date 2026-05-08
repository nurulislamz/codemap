import { parseDifficulty } from "@/lib/leetcode/types";
import { getLeetcodeCatalog } from "@/lib/leetcode/catalog";
import {
  CodeIcon,
  SectionHero,
  StatCard,
} from "@/components/shared";
import { LeetcodePracticeProgressClient } from "@/components/leetcode/leetcode-practice-progress-client";
import { saveLeetCodeAttempt } from "@/lib/leetcode/actions";

export const dynamic = "force-dynamic";

export default async function LeetcodeAllProblemsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    pattern?: string;
    subPattern?: string | string[];
    difficulty?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;

  const catalog = getLeetcodeCatalog();
  let selectedPattern = params?.pattern ?? null;
  let selectedSubPatterns = params?.subPattern
    ? Array.isArray(params.subPattern)
      ? params.subPattern
      : [params.subPattern]
    : [];
  let selectedDifficulty = params?.difficulty ?? null;
  const query = params?.q ?? null;
  const invalidFilters: Array<{type: string; value: string;}> = [];

  if (selectedPattern && !catalog.patternCounts.has(selectedPattern)) {
    invalidFilters.push({ type: "pattern", value: selectedPattern });
  }

  selectedSubPatterns.forEach((subPattern) => {
    if (!catalog.patternCounts.has(subPattern)) {
      invalidFilters.push({ type: "subPattern", value: subPattern });
    }
  });

  if (selectedDifficulty && !parseDifficulty(selectedDifficulty)) {
    invalidFilters.push({ type: "difficulty", value: selectedDifficulty });
  }

  if (invalidFilters.length > 0) {
    console.warn("Invalid Leetcode filters selected:", invalidFilters);
    selectedPattern = null;
    selectedSubPatterns = [];
    selectedDifficulty = null;
  }

  const problems = Array.from(catalog.problems.values()).flat();
  const totalCount = problems.length;
  const completedCount = 0;
  const attemptedCount = 0;
  const dueCount = problems.length;
  const queryValue = query ?? "";
  const selectedDifficultyValue = parseDifficulty(selectedDifficulty);

  return (
    <div className="space-y-5">
      <SectionHero
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
              defaultValue={queryValue}
              className="grow bg-transparent text-base text-slate-200 outline-none placeholder:text-slate-500"
              placeholder="Search problems..."
            />
            <button type="submit" className="sr-only">
              Search
            </button>
          </label>
        </form>
      </SectionHero>

      {invalidFilters.length > 0 ? (
        <div
          role="alert"
          className="rounded-xl border border-[#ff8b3d]/30 bg-[#41271d]/60 px-5 py-4 text-sm font-semibold text-[#ffb06f]"
        >
          Unknown filter {invalidFilters.map((f) => f.value).join(", ")} selected.
          Showing all problems instead.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
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
        <StatCard
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
        <StatCard
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
        <StatCard
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
        catalog={catalog}
        initialSelectedPattern={selectedPattern}
        initialSelectedSubPatterns={selectedSubPatterns}
        initialSelectedDifficulty={selectedDifficultyValue}
        query={queryValue}
        saveAttemptAction={saveLeetCodeAttempt}
      />
    </div>
  );
}
