import {
  parseDifficulty,
  type LeetcodeProblemDifficultyLabel,
} from "@/lib/leetcode/types";
import { getLeetcodeCatalog } from "@/lib/leetcode/catalog";
import {
  CodeIcon,
  LeetcodeHeroPanel,
  LeetcodePanel,
  LeetcodeStatCard,
} from "@/components/leetcode/leetcode-ui";
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
  const invalidFilters: Array<{
    type: "pattern" | "subPattern" | "difficulty";
    value: string;
  }> = [];

  if (selectedPattern && !catalog.index.has(selectedPattern)) {
    invalidFilters.push({ type: "pattern", value: selectedPattern });
  }

  selectedSubPatterns.forEach((subPattern) => {
    const hasSubPattern = Array.from(catalog.index.values()).some((pattern) =>
      pattern.subPatterns.has(subPattern),
    );

    if (!hasSubPattern) {
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
              defaultValue={queryValue}
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
          Unknown filter {invalidFilters.map((f) => f.value).join(", ")} selected.
          Showing all problems instead.
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

      <div className="grid gap-4 xl:grid-cols-[21rem_minmax(0,1fr)]">
        <LeetcodePanel className="p-5">
          <h2 className="mb-4 text-lg font-extrabold text-white">Major Patterns</h2>

          <div className="space-y-2">
            <a
              href={filterHref({
                pattern: null,
                subPatterns: [],
                query: queryValue,
                difficulty: selectedDifficultyValue,
              })}
              aria-label={`All Problems ${problems.length}`}
              className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                selectedPattern === null
                  ? "bg-[#6747ff] text-white shadow-lg shadow-[#6747ff]/30"
                  : "text-slate-300 hover:bg-[#121e31]"
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                >
                  <path d="M21 8 12 3 3 8l9 5 9-5z" />
                  <path d="M3 16l9 5 9-5" />
                  <path d="M3 12l9 5 9-5" />
                </svg>
                <span className="font-semibold">All Problems</span>
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  selectedPattern === null
                    ? "border-white/15 bg-white/10 text-white"
                    : "border-[#24344b] bg-[#0a1422] text-slate-400"
                }`}
              >
                {problems.length}
              </span>
            </a>

            {Array.from(catalog.index.keys()).map((patternName) => {
              const isSelected = patternName === selectedPattern;
              const patternCount =
                catalog.patternCounts.get(patternName)?.count ?? 0;

              return (
                <a
                  key={patternName}
                  href={filterHref({
                    pattern: patternName,
                    subPatterns: [],
                    query: queryValue,
                    difficulty: selectedDifficultyValue,
                  })}
                  aria-label={`${patternName} ${patternCount}`}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    isSelected
                      ? "bg-[#6747ff] text-white shadow-lg shadow-[#6747ff]/30"
                      : "text-slate-300 hover:bg-[#121e31]"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    >
                      <circle cx="6" cy="12" r="2" />
                      <circle cx="18" cy="6" r="2" />
                      <circle cx="18" cy="18" r="2" />
                      <path d="m8 11 8-4" />
                      <path d="m8 13 8 4" />
                    </svg>
                    <span className="truncate font-semibold">{patternName}</span>
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      isSelected
                        ? "border-white/15 bg-white/10 text-white"
                      : "border-[#24344b] bg-[#0a1422] text-slate-400"
                    }`}
                  >
                    {patternCount}
                  </span>
                </a>
              );
            })}
          </div>
        </LeetcodePanel>

        <LeetcodePracticeProgressClient
          problems={problems}
          initialSelectedPattern={selectedPattern}
          initialSelectedSubPatterns={selectedSubPatterns}
          initialSelectedDifficulty={selectedDifficultyValue}
          query={queryValue}
          saveAttemptAction={saveLeetCodeAttempt}
        />
      </div>
    </div>
  );
}

function filterHref({
  pattern,
  subPatterns,
  query,
  difficulty,
}: {
  pattern: string | null;
  subPatterns: string[];
  query: string;
  difficulty: LeetcodeProblemDifficultyLabel | null;
}) {
  const params = new URLSearchParams();

  if (pattern) params.set("pattern", pattern);
  for (const subPattern of subPatterns) {
    params.append("subPattern", subPattern);
  }
  if (difficulty) params.set("difficulty", difficulty);
  if (query.trim()) params.set("q", query.trim());

  const search = params.toString();
  return search ? `/leetcode/allproblems?${search}` : "/leetcode/allproblems";
}
