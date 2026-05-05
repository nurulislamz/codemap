"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { LeetcodeProblemTable } from "./leetcode-problem-table";
import { LeetcodePanel, LeetcodeStatCard } from "./leetcode-ui";
import type {
  LeetcodeAttemptRow,
  LeetcodePatternGroup,
  LeetcodeProblemRow,
  SaveLeetcodeAttemptAction,
} from "@/lib/leetcode/types";

type LeetcodePracticeProgressClientProps = {
  problems: LeetcodeProblemRow[];
  patterns: LeetcodePatternGroup[];
  initialSelectedPattern?: string | null;
  initialSelectedSubPatterns?: string[];
  query: string;
  saveAttemptAction?: SaveLeetcodeAttemptAction;
};

type AttemptsResponse = {
  attempts?: LeetcodeAttemptRow[];
};

let cachedAttemptUser: string | null = null;
let cachedAttempts: LeetcodeAttemptRow[] | null = null;

function bestSuccessfulDuration(attempts: LeetcodeAttemptRow[]) {
  const durations = attempts
    .filter((attempt) => attempt.isSuccessful)
    .map((attempt) => attempt.durationSeconds);

  return durations.length > 0 ? Math.min(...durations) : null;
}

function attemptsByProblemId(attempts: LeetcodeAttemptRow[]) {
  const grouped = new Map<string, LeetcodeAttemptRow[]>();

  for (const attempt of attempts) {
    grouped.set(attempt.problemId, [
      ...(grouped.get(attempt.problemId) ?? []),
      attempt,
    ]);
  }

  return grouped;
}

function hydrateProblems(
  problems: LeetcodeProblemRow[],
  attempts: LeetcodeAttemptRow[],
) {
  const groupedAttempts = attemptsByProblemId(attempts);

  return problems.map((problem) => {
    const problemAttempts = groupedAttempts.get(problem.number) ?? [];
    const latestAttempt = problemAttempts[0];

    return {
      ...problem,
      isCompleted: problemAttempts.some((attempt) => attempt.isSuccessful),
      lastAttemptedAt: latestAttempt?.endedAt ?? null,
      attemptCount: problemAttempts.length,
      bestDurationSeconds: bestSuccessfulDuration(problemAttempts),
    };
  });
}

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

function isValidPattern(pattern: string | null, patterns: LeetcodePatternGroup[]) {
  return Boolean(pattern && patterns.some((item) => item.name === pattern));
}

function readUrlFilters(patterns: LeetcodePatternGroup[]) {
  const params = new URLSearchParams(window.location.search);
  const pattern = params.get("pattern");

  return {
    selectedPattern: isValidPattern(pattern, patterns) ? pattern : null,
    selectedSubPatterns: params.getAll("subPattern"),
  };
}

function filterHref(pattern: string | null, query: string) {
  const params = new URLSearchParams();

  if (pattern) params.set("pattern", pattern);
  if (query.trim()) params.set("q", query.trim());

  const search = params.toString();
  return search ? `/leetcode/allproblems?${search}` : "/leetcode/allproblems";
}

export function LeetcodePracticeProgressClient({
  problems,
  patterns,
  initialSelectedPattern = null,
  initialSelectedSubPatterns = [],
  query,
  saveAttemptAction,
}: LeetcodePracticeProgressClientProps) {
  const { status: authStatus, user, getIdToken } = useAuth();
  const [selectedPattern, setSelectedPattern] = useState<string | null>(initialSelectedPattern);
  const [selectedSubPatterns, setSelectedSubPatterns] = useState<string[]>(
    initialSelectedSubPatterns,
  );
  const [attempts, setAttempts] = useState<LeetcodeAttemptRow[]>(() =>
    cachedAttemptUser === user?.uid && cachedAttempts ? cachedAttempts : [],
  );

  const selectedPatternProblems = useMemo(
    () =>
      selectedPattern
        ? problems.filter((problem) => problem.pattern === selectedPattern)
        : problems,
    [problems, selectedPattern],
  );
  const validSelectedSubPatterns = useMemo(() => {
    const minorPatterns = selectedPattern
      ? patterns.find((pattern) => pattern.name === selectedPattern)?.subPatterns ?? []
      : patterns.flatMap((pattern) => pattern.subPatterns);
    const validNames = new Set(minorPatterns.map((pattern) => pattern.name));

    return selectedSubPatterns.filter((subPattern) => validNames.has(subPattern));
  }, [patterns, selectedPattern, selectedSubPatterns]);
  const patternProblems = useMemo(
    () =>
      validSelectedSubPatterns.length > 0
        ? selectedPatternProblems.filter((problem) =>
            validSelectedSubPatterns.includes(problem.subPattern),
          )
        : selectedPatternProblems,
    [selectedPatternProblems, validSelectedSubPatterns],
  );
  const tableProblems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return normalizedQuery
      ? patternProblems.filter(
          (problem) =>
            problem.title.toLowerCase().includes(normalizedQuery) ||
            problem.number.includes(normalizedQuery),
        )
      : patternProblems;
  }, [patternProblems, query]);

  function selectPattern(pattern: string | null) {
    setSelectedPattern(pattern);
    setSelectedSubPatterns([]);
    window.history.pushState(null, "", filterHref(pattern, query));
  }

  const loadAttempts = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (authStatus === "loading") return;

      if (authStatus !== "signed-in" || !user) {
        cachedAttemptUser = null;
        cachedAttempts = [];
        setAttempts([]);
        return;
      }

      if (!force && cachedAttemptUser === user.uid && cachedAttempts) {
        setAttempts(cachedAttempts);
        return;
      }

      const idToken = await getIdToken();
      const response = await fetch("/api/leetcode/attempts", {
        cache: "no-store",
        headers: idToken ? { authorization: `Bearer ${idToken}` } : {},
      });

      if (!response.ok) return;

      const data = (await response.json()) as AttemptsResponse;
      const nextAttempts = data.attempts ?? [];
      cachedAttemptUser = user.uid;
      cachedAttempts = nextAttempts;
      setAttempts(nextAttempts);
    },
    [authStatus, getIdToken, user],
  );

  useEffect(() => {
    void loadAttempts();
  }, [loadAttempts]);

  useEffect(() => {
    function handlePopState() {
      const nextFilters = readUrlFilters(patterns);
      setSelectedPattern(nextFilters.selectedPattern);
      setSelectedSubPatterns(nextFilters.selectedSubPatterns);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [patterns]);

  const hydratedProblems = useMemo(
    () => hydrateProblems(problems, attempts),
    [attempts, problems],
  );
  const hydratedPatternProblems = useMemo(
    () => hydrateProblems(patternProblems, attempts),
    [attempts, patternProblems],
  );
  const hydratedTableProblems = useMemo(
    () => hydrateProblems(tableProblems, attempts),
    [attempts, tableProblems],
  );

  const completedCount = hydratedProblems.filter((problem) => problem.isCompleted).length;
  const attemptedCount = hydratedProblems.filter((problem) => problem.attemptCount > 0).length;
  const dueCount = hydratedPatternProblems.filter((problem) => !problem.isCompleted).length;

  return (
    <>
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
              href={filterHref(null, query)}
              aria-label={`All Problems ${problems.length}`}
              className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                selectedPattern === null
                  ? "bg-[#6747ff] text-white shadow-lg shadow-[#6747ff]/30"
                  : "text-slate-300 hover:bg-[#121e31]"
              }`}
              onClick={(event) => {
                event.preventDefault();
                selectPattern(null);
              }}
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
            </a>

            {patterns.map((pattern) => {
              const isSelected = pattern.name === selectedPattern;

              return (
                <a
                  key={pattern.name}
                  href={filterHref(pattern.name, query)}
                  aria-label={`${pattern.name} ${pattern.count}`}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    isSelected
                      ? "bg-[#6747ff] text-white shadow-lg shadow-[#6747ff]/30"
                      : "text-slate-300 hover:bg-[#121e31]"
                  }`}
                  onClick={(event) => {
                    event.preventDefault();
                    selectPattern(pattern.name);
                  }}
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
                </a>
              );
            })}
          </div>
        </LeetcodePanel>

        <main className="min-w-0 space-y-4">
          <LeetcodeProblemTable
            problems={hydratedTableProblems}
            attempts={attempts}
            externalPattern={selectedPattern}
            saveAttemptAction={saveAttemptAction}
            onAttemptSaved={() => void loadAttempts({ force: true })}
          />
        </main>
      </div>
    </>
  );
}
