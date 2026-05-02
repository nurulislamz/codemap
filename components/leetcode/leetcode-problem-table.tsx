"use client";

import { Fragment, useMemo, useRef, useState } from "react";

import { useOutsideClick } from "@/components/shell/use-outside-click";
import { LeetcodeAttemptOverlayButton } from "./leetcode-attempt-overlay";
import { formatAttemptDate, formatSecondsDuration } from "@/lib/leetcode/leetcode-formatters";
import type {
  LeetcodeAttemptRow,
  LeetcodeProblemRow,
  SaveLeetcodeAttemptAction,
} from "@/lib/leetcode/types";

type LeetcodeProblemTableProps = {
  problems: LeetcodeProblemRow[];
  attempts: LeetcodeAttemptRow[];
  externalPattern?: string | null;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  saveAttemptAction?: SaveLeetcodeAttemptAction;
};

type ProblemSort = "default" | "az" | "za";
type DifficultySort = "default" | "easy-first" | "hard-first";
type ProgressFilter =
  | "all"
  | "completed"
  | "not-completed"
  | "attempted"
  | "not-started";

const allOption = "all";

function uniqueInOrder(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function difficultyStyles(difficulty: LeetcodeProblemRow["difficulty"]) {
  switch (difficulty) {
    case "easy":
      return {
        pill: "border-[#2bd875]/30 bg-[#143b32] text-[#5ff08a]",
        dot: "bg-[#2bd875]",
      };
    case "medium":
      return {
        pill: "border-[#f7b615]/35 bg-[#3a2c10] text-[#ffd21d]",
        dot: "bg-[#ffc400]",
      };
    case "hard":
      return {
        pill: "border-[#ff5e7a]/35 bg-[#401923] text-[#ff6f87]",
        dot: "bg-[#ff5e7a]",
      };
  }
}

function formatStatus(problem: LeetcodeProblemRow) {
  if (problem.isCompleted) return "Completed";
  if (problem.attemptCount > 0) return "In progress";
  return "Not started";
}

function difficultyRank(difficulty: LeetcodeProblemRow["difficulty"]) {
  switch (difficulty) {
    case "easy":
      return 1;
    case "medium":
      return 2;
    case "hard":
      return 3;
  }
}

function progressDotClass(problem: LeetcodeProblemRow) {
  if (problem.isCompleted) return "border-[#54eb78] bg-[#54eb78]/20";
  if (problem.attemptCount > 0) return "border-[#8368ff] bg-[#8368ff]/20";
  return "border-slate-500";
}

function progressTextClass(problem: LeetcodeProblemRow) {
  if (problem.isCompleted) return "text-[#54eb78]";
  if (problem.attemptCount > 0) return "text-[#8b68ff]";
  return "text-slate-400";
}

function attemptResultStyles(attempt: LeetcodeAttemptRow) {
  if (attempt.isSuccessful) {
    return {
      pill: "border-[#2bd875]/30 bg-[#143b32] text-[#5ff08a]",
      dot: "bg-[#2bd875]",
      label: "Accepted",
    };
  }

  return {
    pill: "border-[#f7b615]/35 bg-[#3a2c10] text-[#ffd21d]",
    dot: "bg-[#ffc400]",
    label: attempt.failureReason || "Wrong Answer",
  };
}

function latestAttemptNotes(attempts: LeetcodeAttemptRow[]) {
  return attempts
    .filter((attempt) => attempt.notes?.trim())
    .toSorted(
      (left, right) =>
        new Date(right.endedAt).getTime() - new Date(left.endedAt).getTime(),
    )[0]?.notes ?? null;
}

function resourcePill(label: string, href?: string) {
  if (!href) {
    return (
      <span className="rounded-lg border border-[#26364d] bg-[#0a1422] px-4 py-2 text-sm font-bold text-slate-600">
        {label}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-lg border border-[#3a3482] bg-[#121a33] px-4 py-2 text-sm font-bold text-[#8f73ff] transition hover:border-[#705cff] hover:bg-[#1a2550]"
    >
      {label}
    </a>
  );
}

function patternChip(label: string) {
  return (
    <span className="rounded-lg bg-[#261c59] px-3 py-1 text-xs font-semibold text-[#a48bff]">
      {label}
    </span>
  );
}

export function LeetcodeProblemTable({
  problems,
  attempts,
  externalPattern,
  searchQuery,
  onSearchQueryChange,
  saveAttemptAction,
}: LeetcodeProblemTableProps) {
  const patternMenuRef = useRef<HTMLDivElement>(null);
  const difficultyMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const [internalQuery, setInternalQuery] = useState("");
  const [difficulty, setDifficulty] = useState(allOption);
  const [status, setStatus] = useState<ProgressFilter>("all");
  const [hasVideo, setHasVideo] = useState(false);
  const [showPatternMenu, setShowPatternMenu] = useState(false);
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [activePatternForSubPatterns, setActivePatternForSubPatterns] = useState<string | null>(null);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [selectedSubPatterns, setSelectedSubPatterns] = useState<string[]>([]);
  const [problemSort, setProblemSort] = useState<ProblemSort>("default");
  const [difficultySort, setDifficultySort] = useState<DifficultySort>("default");
  const [expandedProblemId, setExpandedProblemId] = useState<string | null>(null);
  const query = searchQuery ?? internalQuery;
  const setQuery = onSearchQueryChange ?? setInternalQuery;

  const patternOptions = useMemo(
    () => uniqueInOrder(problems.map((problem) => problem.pattern)),
    [problems],
  );

  const subPatternOptions = useMemo(() => {
    const patternForSubPatterns = activePatternForSubPatterns ?? externalPattern;

    if (!patternForSubPatterns) return [];

    return uniqueInOrder(
      problems
        .filter((problem) => problem.pattern === patternForSubPatterns)
        .map((problem) => problem.subPattern),
    );
  }, [activePatternForSubPatterns, externalPattern, problems]);

  const attemptsByProblemId = useMemo(() => {
    const grouped = new Map<string, LeetcodeAttemptRow[]>();

    for (const attempt of attempts) {
      grouped.set(attempt.problemId, [
        ...(grouped.get(attempt.problemId) ?? []),
        attempt,
      ]);
    }

    return grouped;
  }, [attempts]);

  useOutsideClick(patternMenuRef, {
    active: showPatternMenu,
    onOutsideClick: () => {
      setShowPatternMenu(false);
      setActivePatternForSubPatterns(null);
    },
  });
  useOutsideClick(difficultyMenuRef, {
    active: showDifficultyMenu,
    onOutsideClick: () => setShowDifficultyMenu(false),
  });
  useOutsideClick(statusMenuRef, {
    active: showStatusMenu,
    onOutsideClick: () => setShowStatusMenu(false),
  });

  const filteredProblems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return problems.filter((problem) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        problem.title.toLowerCase().includes(normalizedQuery) ||
        problem.number.includes(normalizedQuery);
      const matchesStatus =
        status === "all" ||
        (status === "completed" && problem.isCompleted) ||
        (status === "not-completed" && !problem.isCompleted) ||
        (status === "attempted" && problem.attemptCount > 0 && !problem.isCompleted) ||
        (status === "not-started" && problem.attemptCount === 0);

      return (
        matchesQuery &&
        matchesStatus &&
        (!externalPattern || problem.pattern === externalPattern) &&
        (selectedPatterns.length === 0 || selectedPatterns.includes(problem.pattern)) &&
        (selectedSubPatterns.length === 0 ||
          selectedSubPatterns.includes(problem.subPattern)) &&
        (difficulty === allOption || problem.difficulty === difficulty) &&
        (!hasVideo || Boolean(problem.solutionVideoUrl))
      );
    }).toSorted((left, right) => {
      if (problemSort !== "default") {
        const direction = problemSort === "az" ? 1 : -1;
        return direction * left.title.localeCompare(right.title);
      }

      if (difficultySort !== "default") {
        const direction = difficultySort === "easy-first" ? 1 : -1;
        return direction * (difficultyRank(left.difficulty) - difficultyRank(right.difficulty));
      }

      return 0;
    });
  }, [
    difficulty,
    difficultySort,
    externalPattern,
    hasVideo,
    problemSort,
    problems,
    query,
    selectedPatterns,
    selectedSubPatterns,
    status,
  ]);

  function resetFilters() {
    setQuery("");
    setDifficulty(allOption);
    setStatus("all");
    setHasVideo(false);
    setSelectedPatterns([]);
    setSelectedSubPatterns([]);
    setShowPatternMenu(false);
    setShowDifficultyMenu(false);
    setShowStatusMenu(false);
    setActivePatternForSubPatterns(null);
    setProblemSort("default");
    setDifficultySort("default");
    setExpandedProblemId(null);
  }

  function toggleSelectedPattern(pattern: string) {
    setSelectedPatterns((current) =>
      current.includes(pattern)
        ? current.filter((item) => item !== pattern)
        : [...current, pattern],
    );
  }

  function toggleSelectedSubPattern(subPattern: string) {
    setSelectedSubPatterns((current) =>
      current.includes(subPattern)
        ? current.filter((item) => item !== subPattern)
        : [...current, subPattern],
    );
  }

  function toggleProblemSort() {
    setProblemSort((current) => (current === "az" ? "za" : "az"));
    setDifficultySort("default");
  }

  function toggleDifficultySort() {
    setDifficultySort((current) =>
      current === "easy-first" ? "hard-first" : "easy-first",
    );
    setProblemSort("default");
  }

  function toggleProgressFilter() {
    setStatus((current) => {
      if (current === "all") return "completed";
      if (current === "completed") return "not-completed";
      if (current === "not-completed") return "attempted";
      return "all";
    });
  }

  function problemSortLabel() {
    if (problemSort === "az") return "↑";
    if (problemSort === "za") return "↓";
    return "↕";
  }

  function difficultySortLabel() {
    if (difficultySort === "easy-first") return "↑";
    if (difficultySort === "hard-first") return "↓";
    return "↕";
  }

  function progressFilterLabel() {
    if (status === "completed") return "Completed";
    if (status === "not-completed") return "Not completed";
    if (status === "attempted") return "Attempted";
    return "Filter";
  }

  function difficultyFilterLabel() {
    if (difficulty === "easy") return "Easy";
    if (difficulty === "medium") return "Medium";
    if (difficulty === "hard") return "Hard";
    return "All difficulties";
  }

  function statusFilterLabel() {
    if (status === "not-started") return "Not started";
    if (status === "not-completed") return "Not completed";
    if (status === "attempted") return "Attempted";
    if (status === "completed") return "Completed";
    return "All statuses";
  }

  function subPatternFilterLabel() {
    if (selectedSubPatterns.length === 1) return selectedSubPatterns[0];
    if (selectedSubPatterns.length > 1) return `${selectedSubPatterns.length} selected`;
    if (selectedPatterns.length === 1) return selectedPatterns[0];
    if (selectedPatterns.length > 1) return `${selectedPatterns.length} selected`;
    return "";
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-[#1b2a3e] bg-[#0b1626]/95 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(12rem,14rem)_minmax(12rem,14rem)_minmax(16rem,22rem)_auto_auto] xl:items-center">
          <div ref={difficultyMenuRef} className="relative z-40">
            <button
              type="button"
              aria-controls="leetcode-difficulty-menu"
              aria-expanded={showDifficultyMenu}
              aria-haspopup="menu"
              className={`flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 rounded-xl border px-5 text-left text-base font-semibold transition ${
                showDifficultyMenu
                  ? "border-[#705cff] text-[#a48bff]"
                  : "border-[#26364d] bg-[#07111f]/65 text-white"
              }`}
              onClick={() => setShowDifficultyMenu((current) => !current)}
            >
              {difficultyFilterLabel()}
              <span className="text-slate-400">{showDifficultyMenu ? "⌃" : "⌄"}</span>
            </button>

            {showDifficultyMenu ? (
              <>
              <div className="absolute left-0 top-full z-40 h-3 w-full" />
              <div
                id="leetcode-difficulty-menu"
                role="menu"
                className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-[#26364d] bg-[#0b1626] p-2 shadow-2xl shadow-black/40"
              >
                {[
                  [allOption, "All difficulties"],
                  ["easy", "Easy"],
                  ["medium", "Medium"],
                  ["hard", "Hard"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={difficulty === value}
                    className={`flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#121e31] ${
                      difficulty === value ? "bg-[#6747ff]/15 text-[#a48bff]" : "text-slate-300"
                    }`}
                    onClick={() => {
                      setDifficulty(value);
                      setShowDifficultyMenu(false);
                    }}
                  >
                    {label}
                    {difficulty === value ? <span>✓</span> : null}
                  </button>
                ))}
              </div>
              </>
            ) : null}
          </div>

          <div ref={statusMenuRef} className="relative z-40">
            <button
              type="button"
              aria-controls="leetcode-status-menu"
              aria-expanded={showStatusMenu}
              aria-haspopup="menu"
              className={`flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 rounded-xl border px-5 text-left text-base font-semibold transition ${
                showStatusMenu
                  ? "border-[#705cff] text-[#a48bff]"
                  : "border-[#26364d] bg-[#07111f]/65 text-white"
              }`}
              onClick={() => setShowStatusMenu((current) => !current)}
            >
              {statusFilterLabel()}
              <span className="text-slate-400">{showStatusMenu ? "⌃" : "⌄"}</span>
            </button>

            {showStatusMenu ? (
              <>
              <div className="absolute left-0 top-full z-40 h-3 w-full" />
              <div
                id="leetcode-status-menu"
                role="menu"
                className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-[#26364d] bg-[#0b1626] p-2 shadow-2xl shadow-black/40"
              >
                {[
                  ["all", "All statuses"],
                  ["not-started", "Not started"],
                  ["not-completed", "Not completed"],
                  ["attempted", "Attempted"],
                  ["completed", "Completed"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={status === value}
                    className={`flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#121e31] ${
                      status === value ? "bg-[#6747ff]/15 text-[#a48bff]" : "text-slate-300"
                    }`}
                    onClick={() => {
                      setStatus(value as ProgressFilter);
                      setShowStatusMenu(false);
                    }}
                  >
                    {label}
                    {status === value ? <span>✓</span> : null}
                  </button>
                ))}
              </div>
              </>
            ) : null}
          </div>

          <div ref={patternMenuRef} className="relative z-30">
            <button
              type="button"
              aria-controls="leetcode-pattern-menu"
              aria-expanded={showPatternMenu}
              aria-haspopup="menu"
              className={`flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 rounded-xl border px-5 text-left text-base font-semibold transition ${
                showPatternMenu
                  ? "border-[#705cff] text-[#a48bff]"
                  : "border-[#26364d] bg-[#07111f]/65 text-white"
              }`}
              onClick={() => setShowPatternMenu((current) => !current)}
            >
              <span className="inline-flex items-center gap-2">
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
                  <path d="M6 3v6" />
                  <path d="M18 15v6" />
                  <path d="M6 15v6" />
                  <path d="M18 3v6" />
                  <path d="M3 9h6v6H3z" />
                  <path d="M15 9h6v6h-6z" />
                </svg>
                <span className="text-white">Filter patterns</span>
                {subPatternFilterLabel() ? (
                  <span className="text-[#9272ff]">{subPatternFilterLabel()}</span>
                ) : null}
              </span>
              <span className="text-slate-400">{showPatternMenu ? "⌃" : "⌄"}</span>
            </button>

            {showPatternMenu ? (
              <>
              <div className="absolute left-0 top-full z-40 h-3 w-full" />
              <div
                id="leetcode-pattern-menu"
                role="menu"
                className="absolute left-0 top-full z-50 mt-2 flex w-max max-w-[calc(100vw-3rem)] items-start gap-3"
              >
                <div className="w-80 rounded-xl border border-[#26364d] bg-[#0b1626] p-3 shadow-2xl shadow-black/40">
                  <label className="mb-2 flex h-10 items-center gap-2 rounded-xl border border-[#26364d] bg-[#07111f]/65 px-3">
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-4 w-4 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    <span className="text-sm text-slate-500">Search minor patterns...</span>
                  </label>

                  <div className="max-h-72 space-y-1 overflow-y-auto">
                    {(externalPattern ? [externalPattern] : [allOption, ...patternOptions]).map((patternOption) => (
                      <div
                        key={patternOption}
                        className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-[#121e31]"
                      >
                        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={
                              patternOption === allOption
                                ? selectedPatterns.length === 0 && selectedSubPatterns.length === 0
                                : selectedPatterns.includes(patternOption)
                            }
                            onChange={() => {
                              if (patternOption === allOption) {
                                resetFilters();
                                return;
                              }

                              toggleSelectedPattern(patternOption);
                            }}
                            className="checkbox checkbox-primary checkbox-sm"
                          />
                          <span className="truncate">
                            {patternOption === allOption ? "All problems" : patternOption}
                          </span>
                        </label>
                        {patternOption !== allOption ? (
                          <button
                            type="button"
                            aria-label={`Show ${patternOption} minor patterns`}
                            className={`cursor-pointer rounded-md px-2 py-1 text-lg leading-none ${
                              activePatternForSubPatterns === patternOption ? "text-[#a48bff]" : ""
                            }`}
                            onClick={() =>
                              setActivePatternForSubPatterns((current) =>
                                current === patternOption ? null : patternOption,
                              )
                            }
                          >
                            ›
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                {activePatternForSubPatterns ? (
                  <div className="w-64 rounded-xl border border-[#26364d] bg-[#0b1626] p-3 text-slate-200 shadow-2xl shadow-black/40">
                    <div className="mb-2 font-semibold">{activePatternForSubPatterns}</div>
                    <div className="max-h-72 space-y-1 overflow-y-auto">
                      {subPatternOptions.map((subPatternOption) => (
                        <label
                          key={subPatternOption}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-[#121e31]"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSubPatterns.includes(subPatternOption)}
                            onChange={() => toggleSelectedSubPattern(subPatternOption)}
                            className="checkbox checkbox-primary checkbox-sm"
                          />
                          {subPatternOption}
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              </>
            ) : null}
          </div>

          <button
            type="button"
            aria-pressed={hasVideo}
            className={`flex min-h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border px-5 text-base font-semibold transition xl:w-auto ${
              hasVideo
                ? "border-[#705cff] bg-[#6747ff] text-white"
                : "border-[#26364d] bg-[#07111f]/65 text-white"
            }`}
            onClick={() => setHasVideo((current) => !current)}
          >
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
              <path d="m16 13 5 3V8l-5 3" />
              <rect x="3" y="6" width="13" height="12" rx="2" />
            </svg>
            Has video
            <span
              aria-hidden="true"
              className={`relative h-6 w-11 rounded-full transition ${
                hasVideo ? "bg-[#8b68ff]" : "bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-slate-300 transition ${
                  hasVideo ? "left-6" : "left-1"
                }`}
              />
            </span>
          </button>

          <button
            type="button"
            className="flex min-h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-xl px-5 text-base font-semibold text-[#8f73ff] transition hover:bg-[#121e31] xl:w-auto"
            onClick={resetFilters}
          >
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
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            Clear filters
          </button>
          </div>
        </div>

        {selectedPatterns.length > 0 || selectedSubPatterns.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {[...selectedPatterns, ...selectedSubPatterns].map((selectedItem) => (
              <button
                key={selectedItem}
                type="button"
                className="cursor-pointer rounded-lg border border-[#3a3482] bg-[#121a33] px-3 py-1.5 text-sm font-semibold text-[#8f73ff]"
                onClick={() => {
                  setSelectedPatterns((current) =>
                    current.filter((item) => item !== selectedItem),
                  );
                  setSelectedSubPatterns((current) =>
                    current.filter((item) => item !== selectedItem),
                  );
                }}
              >
                {selectedItem}
                <span>×</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#1b2a3e] bg-[#0b1626]/95 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
        <table className="table">
          <thead className="bg-[#0b1626]">
            <tr className="border-[#1b2a3e] text-sm font-bold text-slate-400">
              <th className="w-16 px-8 py-5">#</th>
              <th
                className="px-4 py-4"
                aria-sort={
                  problemSort === "az"
                    ? "ascending"
                    : problemSort === "za"
                      ? "descending"
                      : "none"
                }
              >
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-2 transition hover:text-[#a48bff]"
                  onClick={toggleProblemSort}
                >
                  Problem
                  <span className="text-xs text-slate-600">{problemSortLabel()}</span>
                </button>
              </th>
              <th
                className="px-4 py-4"
                aria-sort={
                  difficultySort === "easy-first"
                    ? "ascending"
                    : difficultySort === "hard-first"
                      ? "descending"
                      : "none"
                }
              >
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-2 transition hover:text-[#a48bff]"
                  onClick={toggleDifficultySort}
                >
                  Difficulty
                  <span className="text-xs text-slate-600">{difficultySortLabel()}</span>
                </button>
              </th>
              <th className="px-4 py-4">
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-2 transition hover:text-[#a48bff]"
                  onClick={toggleProgressFilter}
                >
                  Progress
                  <span className="text-xs text-slate-600">{progressFilterLabel()}</span>
                </button>
              </th>
              <th className="px-4 py-4">Resources</th>
              <th className="px-4 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProblems.map((problem) => {
              const problemAttempts = attemptsByProblemId.get(problem.number) ?? [];
              const isExpanded = expandedProblemId === problem.number;
              const difficulty = difficultyStyles(problem.difficulty);

              return (
                <Fragment key={`${problem.pattern}:${problem.subPattern}:${problem.number}:${problem.title}`}>
                  <tr className="border-[#1b2a3e] transition hover:bg-[#111d30]">
                    <td className="px-8 py-5 align-middle font-mono text-base text-slate-200">
                      {problem.number}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-start gap-4">
                        <span className="text-slate-500">
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                          >
                            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                          </svg>
                        </span>
                        <div className="min-w-0 space-y-2">
                          <div className="font-semibold leading-snug text-white">{problem.title}</div>
                          <div className="flex flex-wrap gap-2">
                            {patternChip(problem.pattern)}
                            {patternChip(problem.subPattern)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold capitalize ${difficulty.pill}`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${difficulty.dot}`} />
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 align-middle">
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          className={`inline-flex cursor-pointer items-center gap-2 text-base transition hover:text-[#a48bff] ${progressTextClass(problem)}`}
                          onClick={() => setExpandedProblemId(isExpanded ? null : problem.number)}
                        >
                        <span className={`h-4 w-4 rounded-full border-2 ${progressDotClass(problem)}`} />
                        <span>
                          {formatStatus(problem)} · {problem.attemptCount} attempts
                        </span>
                        {problem.attemptCount > 0 ? (
                          <span className="text-xs">{isExpanded ? "⌃" : "⌄"}</span>
                        ) : null}
                        </button>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 align-middle">
                      <div className="flex flex-nowrap items-center gap-2">
                        {resourcePill("LC", problem.leetcodeUrl)}
                        {resourcePill("Text", problem.solutionUrl)}
                        {resourcePill("Video", problem.solutionVideoUrl)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right align-middle">
                      <LeetcodeAttemptOverlayButton
                        problem={problem}
                        lastNotes={latestAttemptNotes(problemAttempts)}
                        saveAttemptAction={saveAttemptAction}
                        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#6747ff] px-8 text-base font-bold text-white shadow-lg shadow-[#6747ff]/25 transition hover:bg-[#775bff]"
                      >
                        Start
                      </LeetcodeAttemptOverlayButton>
                    </td>
                  </tr>

                  {isExpanded ? (
                    <tr className="border-[#1b2a3e] bg-[#111d30]">
                      <td colSpan={6}>
                        <div className="mx-6 my-4 rounded-xl border border-[#26364d] bg-[#0b1626]/80 p-6 shadow-inner shadow-black/20">
                          {problemAttempts.length > 0 ? (
                            <div className="space-y-4">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <h3 className="text-lg font-bold">Attempt History</h3>
                                  <p className="text-sm text-slate-400">
                                    {problemAttempts.length} attempts · Last attempt{" "}
                                    {formatAttemptDate(problem.lastAttemptedAt)}
                                  </p>
                                </div>

                                <div className="flex items-center gap-5 text-sm">
                                  <a
                                    href={problem.leetcodeUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 font-semibold text-[#8f73ff] transition hover:text-[#a48bff]"
                                  >
                                    View submission details
                                    <svg
                                      viewBox="0 0 24 24"
                                      aria-hidden="true"
                                      className="h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                    >
                                      <path d="M15 3h6v6" />
                                      <path d="M10 14 21 3" />
                                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    </svg>
                                  </a>
                                  <span className="h-6 w-px bg-[#26364d]" />
                                  <button
                                    type="button"
                                    className="inline-flex cursor-pointer items-center gap-2 text-slate-300 transition hover:text-white"
                                    onClick={() => setExpandedProblemId(null)}
                                  >
                                    Collapse
                                    <span className="text-xs">⌃</span>
                                  </button>
                                </div>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="table table-sm rounded-xl border border-[#26364d]">
                                  <thead className="bg-[#111d30]">
                                    <tr className="border-[#26364d] text-slate-400">
                                      <th>Attempt</th>
                                      <th>Date</th>
                                      <th>Result</th>
                                      <th>Runtime</th>
                                      <th>Notes</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {problemAttempts.slice(0, 4).map((attempt, index) => {
                                      const result = attemptResultStyles(attempt);

                                      return (
                                      <tr key={attempt.attemptId} className="border-[#26364d]">
                                        <td className="font-mono text-slate-300">
                                          #{problemAttempts.length - index}
                                        </td>
                                        <td className="text-slate-400">
                                          {formatAttemptDate(attempt.endedAt)}
                                        </td>
                                        <td>
                                          <span
                                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${result.pill}`}
                                          >
                                            <span className={`h-2 w-2 rounded-full ${result.dot}`} />
                                            {result.label}
                                          </span>
                                        </td>
                                        <td>{formatSecondsDuration(attempt.durationSeconds)}</td>
                                        <td className="max-w-xl text-slate-400">
                                          {attempt.notes || "-"}
                                        </td>
                                      </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <h3 className="text-lg font-bold">Attempt History</h3>
                              <p className="text-sm text-slate-400">
                                No attempts yet. Start this problem to create your first attempt.
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>

        <div className="flex flex-col gap-4 border-t border-[#1b2a3e] px-8 py-5 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {filteredProblems.length} of {problems.length} problems
          </p>
          <div className="join">
            <button type="button" className="join-item rounded-l-lg border border-[#26364d] px-3 py-1.5 text-slate-600" disabled>
              Previous
            </button>
            <button type="button" className="join-item bg-[#6747ff] px-3 py-1.5 font-bold text-white">
              1
            </button>
            <button type="button" className="join-item rounded-r-lg border border-[#26364d] px-3 py-1.5 text-slate-600" disabled>
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
