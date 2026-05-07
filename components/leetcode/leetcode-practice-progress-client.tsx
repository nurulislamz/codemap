"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { LeetcodePanel } from "./leetcode-ui";
import { LeetcodeProblemTable } from "./leetcode-problem-table";
import {
  getLeetcodePracticeRows,
  hydrateLeetcodeProblemsWithAttempts,
} from "@/lib/leetcode/progress";
import { getLocalLeetcodeAttempts } from "@/lib/leetcode/storage/local-attempt-storage";
import {
  parseDifficulty,
  type LeetcodeAttemptRow,
  type LeetcodeProblemDifficultyLabel,
  type SaveLeetcodeAttemptAction,
} from "@/lib/leetcode/types";
import type { LeetcodeCatalog } from "@/lib/leetcode/catalog";

type LeetcodePracticeProgressClientProps = {
  catalog: LeetcodeCatalog;
  initialSelectedPattern?: string | null;
  initialSelectedSubPatterns?: string[];
  initialSelectedDifficulty?: LeetcodeProblemDifficultyLabel | null;
  query: string;
  saveAttemptAction?: SaveLeetcodeAttemptAction;
};

type AttemptsResponse = {
  attempts?: LeetcodeAttemptRow[];
};

let cachedAttemptUser: string | null = null;
let cachedAttempts: LeetcodeAttemptRow[] | null = null;

export function LeetcodePracticeProgressClient({
  catalog,
  initialSelectedPattern = null,
  initialSelectedSubPatterns = [],
  initialSelectedDifficulty = null,
  query,
  saveAttemptAction,
}: LeetcodePracticeProgressClientProps) {
  const { status: authStatus, user, getIdToken } = useAuth();
  const [selectedPattern, setSelectedPattern] =
    useState<string | null>(initialSelectedPattern);
  const [selectedSubPatterns, setSelectedSubPatterns] =
    useState<string[]>(initialSelectedSubPatterns);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<LeetcodeProblemDifficultyLabel | null>(initialSelectedDifficulty);
  const [attempts, setAttempts] = useState<LeetcodeAttemptRow[]>(() =>
    cachedAttemptUser === user?.uid && cachedAttempts ? cachedAttempts : [],
  );

  const problems = useMemo(
    () => Array.from(catalog.problems.values()).flat(),
    [catalog.problems],
  );
  const hydratedProblems = useMemo(
    () => hydrateLeetcodeProblemsWithAttempts(problems, attempts),
    [attempts, problems],
  );
  const majorPatterns = useMemo(
    () =>
      Array.from(catalog.index.keys(), (name) => ({
        name,
        count: catalog.patternCounts.get(name)?.count ?? 0,
      })),
    [catalog.index, catalog.patternCounts],
  );
  const tableProblems = useMemo(
    () =>
      getLeetcodePracticeRows({
        problems: hydratedProblems,
        selectedPattern,
        selectedSubPatterns,
        query,
      }),
    [hydratedProblems, query, selectedPattern, selectedSubPatterns],
  );

  function selectDifficulty(difficulty: LeetcodeProblemDifficultyLabel | null) {
    setSelectedDifficulty(difficulty);
    window.history.pushState(
      null,
      "",
      createHref({
        pattern: selectedPattern,
        subPatterns: selectedSubPatterns,
        query,
        difficulty,
      }),
    );
  }

  function selectMajorPattern(pattern: string | null) {
    setSelectedPattern(pattern);
    setSelectedSubPatterns([]);
    window.history.pushState(
      null,
      "",
      createHref({
        pattern,
        subPatterns: [],
        query,
        difficulty: selectedDifficulty,
      }),
    );
  }

  const loadAttempts = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (authStatus === "loading") return;

      if (authStatus !== "signed-in" || !user) {
        await Promise.resolve();

        const localAttempts = getLocalLeetcodeAttempts().map((attempt) => ({
          attemptId: attempt.attemptId,
          problemId: attempt.problemId,
          problemTitle: attempt.problemTitle,
          isSuccessful: attempt.isSuccessful,
          startedAt: attempt.startedAt,
          endedAt: attempt.endedAt,
          durationSeconds: attempt.durationSeconds,
          notes: attempt.notes,
          failureReason: attempt.status === "timed_out" ? "Time ran out" : null,
        }));

        cachedAttemptUser = null;
        cachedAttempts = localAttempts;
        setAttempts(localAttempts);
        return;
      }

      if (!force && cachedAttemptUser === user.uid && cachedAttempts) {
        setAttempts(cachedAttempts);
        return;
      }

      const idToken = await getIdToken();
      const attemptGroups = await Promise.all(
        problems.map(async (problem) => {
          const response = await fetch(
            `/api/leetcode/attempts?problemId=${encodeURIComponent(problem.number)}`,
            {
              cache: "no-store",
              headers: idToken ? { authorization: `Bearer ${idToken}` } : {},
            },
          );

          if (!response.ok) return [];

          const data = (await response.json()) as AttemptsResponse;
          return data.attempts ?? [];
        }),
      );
      const nextAttempts = attemptGroups.flat();
      cachedAttemptUser = user.uid;
      cachedAttempts = nextAttempts;
      setAttempts(nextAttempts);
    },
    [authStatus, getIdToken, problems, user],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadAttempts(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadAttempts]);

  useEffect(() => {
    function handlePopState() {
      const params = new URLSearchParams(window.location.search);
      const pattern = params.get("pattern");
      const nextSelectedPattern =
        pattern && catalog.patternCounts.has(pattern) ? pattern : null;
      const nextSelectedSubPatterns = params
        .getAll("subPattern")
        .filter((subPattern) => catalog.patternCounts.has(subPattern));

      setSelectedPattern(nextSelectedPattern);
      setSelectedSubPatterns(nextSelectedSubPatterns);
      setSelectedDifficulty(parseDifficulty(params.get("difficulty")));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [catalog.patternCounts]);

  return (
    <div className="grid gap-4 xl:grid-cols-[21rem_minmax(0,1fr)]">
      <LeetcodePanel className="p-5">
        <h2 className="mb-4 text-lg font-extrabold text-white">Major Patterns</h2>

        <div className="space-y-2">
          <button
            type="button"
            aria-label={`All Problems ${problems.length}`}
            aria-pressed={selectedPattern === null}
            className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
              selectedPattern === null
                ? "bg-[#6747ff] text-white shadow-lg shadow-[#6747ff]/30"
                : "text-slate-300 hover:bg-[#121e31]"
            }`}
            onClick={() => selectMajorPattern(null)}
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
          </button>

          {majorPatterns.map(({ name, count }) => {
            const isSelected = name === selectedPattern;

            return (
              <button
                key={name}
                type="button"
                aria-label={`${name} ${count}`}
                aria-pressed={isSelected}
                className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  isSelected
                    ? "bg-[#6747ff] text-white shadow-lg shadow-[#6747ff]/30"
                    : "text-slate-300 hover:bg-[#121e31]"
                }`}
                onClick={() => selectMajorPattern(name)}
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
                  <span className="truncate font-semibold">{name}</span>
                </span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    isSelected
                      ? "border-white/15 bg-white/10 text-white"
                      : "border-[#24344b] bg-[#0a1422] text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </LeetcodePanel>

      <main className="min-w-0 space-y-4">
        <LeetcodeProblemTable
          problems={tableProblems}
          attempts={attempts}
          externalPattern={selectedPattern}
          selectedDifficulty={selectedDifficulty}
          onSelectedDifficultyChange={selectDifficulty}
          saveAttemptAction={saveAttemptAction}
          onAttemptSaved={() => void loadAttempts({ force: true })}
        />
      </main>
    </div>
  );
}

function createHref({
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
