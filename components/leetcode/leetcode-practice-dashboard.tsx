import Link from "next/link";
import {
  LeetcodeProblemTable,
} from "./leetcode-problem-table";
import { getLeetcodeCatalog } from "@/lib/leetcode/catalog";
import type {
  LeetcodeAttemptRow,
  LeetcodeProblemRow,
  LeetcodePatternSummary,
  LeetcodeProblemDifficultyLabel,
  LeetcodeProblemStatusLabel,
  SaveLeetcodeAttemptAction,
} from "@/lib/leetcode/types";
import { CodeIcon, LeetcodeHeroPanel, LeetcodePanel, LeetcodeStatCard } from "./leetcode-ui";

type LeetcodePracticeDashboardProps = {
  selectedPattern?: string | null;
  selectedSubPatterns?: string[];
  difficulty?: LeetcodeProblemDifficultyLabel | null;
  status?: LeetcodeProblemStatusLabel | null;
  query?: string | null;
  saveAttemptAction?: SaveLeetcodeAttemptAction;
};

function SidebarIcon({ kind }: { kind: "all" | "pattern" }) {
  if (kind === "all") {
    return (
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
    );
  }

  return (
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
  );
}

type InvalidLeetcodeFilter = {
  type: "pattern" | "subPattern";
  value: string;
};

function validateFilters(
  majorPatterns: LeetcodePatternSummary[],
  minorPatterns: LeetcodePatternSummary[],
  selectedPatternInput: string | null,
  selectedSubPatternInputs: string[],
): InvalidLeetcodeFilter[] {
  const invalidFilters: InvalidLeetcodeFilter[] = [];

  if (
    selectedPatternInput &&
    !majorPatterns.some((pattern) => pattern.name === selectedPatternInput)
  ) {
    invalidFilters.push({ type: "pattern", value: selectedPatternInput });
  }

  for (const subPattern of selectedSubPatternInputs) {
    if (!minorPatterns.some((pattern) => pattern.name === subPattern)) {
      invalidFilters.push({ type: "subPattern", value: subPattern });
    }
  }

  return invalidFilters;
}

export function LeetcodePracticeDashboard({
  selectedPattern: selectedPatternInput = null,
  selectedSubPatterns: selectedSubPatternInputs = [],
  difficulty: selectedDifficulty = null,
  status: selectedStatus = null,
  query = "",
  saveAttemptAction,
}: LeetcodePracticeDashboardProps) {
  const { majorPatternCounts, minorPatternCountsByPattern } = getLeetcodeCatalog();
  const selectedPatternValue = selectedPatternInput ?? null;
  const normalizedQuery = query.trim().toLowerCase();
  const minorPatterns = selectedPatternValue
    ? minorPatternCountsByPattern[selectedPatternValue] ?? []
    : Object.values(minorPatternCountsByPattern).flat();
  const invalidFilters = validateFilters(
    majorPatternCounts,
    minorPatterns,
    selectedPatternInput,
    selectedSubPatternInputs,
  );

  if (invalidFilters.length > 0) {
    console.warn(
      `Invalid LeetCode filters detected. Rendering all problems instead: ${invalidFilters
        .map((filter) => `${filter.type}=${filter.value}`)
        .join(", ")}`,
    );
  }

  const hasInvalidFilters = invalidFilters.length > 0;
  const hasUnknownPattern = invalidFilters.some((filter) => filter.type === "pattern");
  const unknownSubPatterns = invalidFilters
    .filter((filter) => filter.type === "subPattern")
    .map((filter) => filter.value);
  const selectedPattern = hasInvalidFilters ? null : selectedPatternValue;
  const selectedSubPatterns = hasInvalidFilters ? [] : selectedSubPatternInputs;
  const basePatternProblems = selectedPattern
    ? problems.filter((problem) => problem.pattern === selectedPattern)
    : problems;
  const patternProblems = selectedSubPatterns.length > 0
    ? basePatternProblems.filter((problem) =>
        selectedSubPatterns.includes(problem.subPattern),
      )
    : basePatternProblems;

  const completedCount = problems.filter((problem) => problem.isCompleted).length;
  const attemptedCount = problems.filter((problem) => problem.attemptCount > 0).length;
  const dueCount = patternProblems.filter((problem) => !problem.isCompleted).length;
  const tableProblems = normalizedQuery
    ? patternProblems.filter(
        (problem) =>
          problem.title.toLowerCase().includes(normalizedQuery) ||
          problem.number.includes(normalizedQuery),
      )
    : patternProblems;
  
  function filterHref(pattern: string | null, subPatterns: string[] = []) {
    const params = new URLSearchParams();

    if (pattern) params.set("pattern", pattern);
    for (const subPattern of subPatterns) {
      params.append("subPattern", subPattern);
    }
    if (query.trim()) params.set("q", query.trim());

    const search = params.toString();
    return search ? `/leetcode/allproblems?${search}` : "/leetcode/allproblems";
  }

  return (
    <div className="space-y-5">
      <LeetcodeHeroPanel
        icon={<CodeIcon className="h-9 w-9" />}
        title="Practice Problems"
        description="Sharpen your skills by solving hand-picked coding problems."
      >
        <form action="/leetcode/allproblems" className="w-full md:w-[25rem]">
          {selectedPattern ? (
            <input type="hidden" name="pattern" value={selectedPattern} />
          ) : null}
          {selectedSubPatterns.map((subPattern) => (
            <input
              key={subPattern}
              type="hidden"
              name="subPattern"
              value={subPattern}
            />
          ))}
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
              defaultValue={query}
              className="grow bg-transparent text-base text-slate-200 outline-none placeholder:text-slate-500"
              placeholder="Search problems..."
            />
            <button type="submit" className="sr-only">
              Search
            </button>
          </label>
        </form>
      </LeetcodeHeroPanel>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <LeetcodeStatCard
          label="Total Problems"
          value={problems.length}
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
          note={completedCount > 0 ? "Keep solving to grow" : "Keep solving to grow"}
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

      {hasUnknownPattern ? (
        <div
          role="alert"
          className="rounded-xl border border-[#ff8b3d]/30 bg-[#41271d]/60 px-5 py-4 text-sm font-semibold text-[#ffb06f]"
        >
          Unknown pattern selected. Showing all problems instead.
        </div>
      ) : null}

      {unknownSubPatterns.length > 0 ? (
        <div
          role="alert"
          className="rounded-xl border border-[#ff8b3d]/30 bg-[#41271d]/60 px-5 py-4 text-sm font-semibold text-[#ffb06f]"
        >
          Unknown sub-pattern selected. Ignoring invalid sub-pattern filters.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[21rem_minmax(0,1fr)]">
        <LeetcodePanel className="p-5">
          <h2 className="mb-4 text-lg font-extrabold text-white">Major Patterns</h2>

          <div className="space-y-2">
            <Link
              href={filterHref(null)}
              aria-label={`All Problems ${problems.length}`}
              className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                selectedPattern === null
                  ? "bg-[#6747ff] text-white shadow-lg shadow-[#6747ff]/30"
                  : "text-slate-300 hover:bg-[#121e31]"
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <SidebarIcon kind="all" />
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
            </Link>

            {majorPatternCounts.map((pattern) => {
              const isSelected = pattern.name === selectedPattern;

              return (
                <Link
                  key={pattern.name}
                  href={filterHref(pattern.name)}
                  aria-label={`${pattern.name} ${pattern.count}`}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    isSelected
                      ? "bg-[#6747ff] text-white shadow-lg shadow-[#6747ff]/30"
                      : "text-slate-300 hover:bg-[#121e31]"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <SidebarIcon kind="pattern" />
                    <span className="truncate font-semibold">{pattern.name}</span>
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      isSelected
                        ? "border-white/15 bg-white/10 text-white"
                        : "border-[#24344b] bg-[#0a1422] text-slate-400"
                    }`}
                  >
                    {pattern.count}
                  </span>
                </Link>
              );
            })}
          </div>

        </LeetcodePanel>

        <main className="min-w-0 space-y-4">
          <LeetcodeProblemTable
            problems={tableProblems}
            attempts={attempts}
            externalPattern={selectedPattern}
            saveAttemptAction={saveAttemptAction}
          />
        </main>
      </div>
    </div>
  );
}
