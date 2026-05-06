"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
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
  type LeetcodeProblemRow,
  type SaveLeetcodeAttemptAction,
} from "@/lib/leetcode/types";

type LeetcodePracticeProgressClientProps = {
  problems: LeetcodeProblemRow[];
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

function isValidPattern(pattern: string | null, problems: LeetcodeProblemRow[]) {
  return Boolean(pattern && problems.some((problem) => problem.pattern === pattern));
}

function readUrlFilters(problems: LeetcodeProblemRow[]) {
  const params = new URLSearchParams(window.location.search);
  const pattern = params.get("pattern");
  const difficulty = params.get("difficulty");

  return {
    selectedPattern: isValidPattern(pattern, problems) ? pattern : null,
    selectedSubPatterns: params.getAll("subPattern"),
    selectedDifficulty: parseDifficulty(difficulty),
  };
}

export function LeetcodePracticeProgressClient({
  problems,
  initialSelectedPattern = null,
  initialSelectedSubPatterns = [],
  initialSelectedDifficulty = null,
  query,
  saveAttemptAction,
}: LeetcodePracticeProgressClientProps) {
  const { status: authStatus, user, getIdToken } = useAuth();
  const [selectedPattern, setSelectedPattern] = useState<string | null>(initialSelectedPattern);
  const [selectedSubPatterns, setSelectedSubPatterns] = useState<string[]>(
    initialSelectedSubPatterns,
  );
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<LeetcodeProblemDifficultyLabel | null>(initialSelectedDifficulty);
  const [attempts, setAttempts] = useState<LeetcodeAttemptRow[]>(() =>
    cachedAttemptUser === user?.uid && cachedAttempts ? cachedAttempts : [],
  );

  const hydratedProblems = useMemo(
    () => hydrateLeetcodeProblemsWithAttempts(problems, attempts),
    [attempts, problems],
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
      practiceHref({
        pattern: selectedPattern,
        subPatterns: selectedSubPatterns,
        query,
        difficulty,
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
    const timeoutId = window.setTimeout(() => void loadAttempts(), 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadAttempts]);

  useEffect(() => {
    function handlePopState() {
      const nextFilters = readUrlFilters(problems);
      setSelectedPattern(nextFilters.selectedPattern);
      setSelectedSubPatterns(nextFilters.selectedSubPatterns);
      setSelectedDifficulty(nextFilters.selectedDifficulty);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [problems]);

  return (
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
  );
}

function practiceHref({
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
