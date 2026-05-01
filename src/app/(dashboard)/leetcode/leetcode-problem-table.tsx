"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";

export type LeetcodeProblemRow = {
  number: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  pattern: string;
  subPattern: string;
  leetcodeUrl: string;
  estimatedMinutes: number;
  solutionUrl?: string;
  solutionVideoUrl?: string;
  isCompleted: boolean;
  lastAttemptedAt: string | null;
  attemptCount: number;
  bestDurationSeconds: number | null;
};

export type LeetcodeAttemptRow = {
  attemptId: string;
  problemId: string;
  problemTitle: string;
  isSuccessful: boolean;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  notes?: string | null;
  failureReason?: string | null;
};

type LeetcodeProblemTableProps = {
  problems: LeetcodeProblemRow[];
  attempts: LeetcodeAttemptRow[];
  externalPattern?: string | null;
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
        pill: "border-success/30 bg-success/10 text-success",
        dot: "bg-success",
      };
    case "medium":
      return {
        pill: "border-warning/30 bg-warning/10 text-warning",
        dot: "bg-warning",
      };
    case "hard":
      return {
        pill: "border-error/30 bg-error/10 text-error",
        dot: "bg-error",
      };
  }
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDuration(totalSeconds: number | null) {
  if (totalSeconds === null) return "-";

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
  if (problem.isCompleted) return "border-success bg-success/20";
  if (problem.attemptCount > 0) return "border-primary bg-primary/20";
  return "border-base-content/40";
}

function progressTextClass(problem: LeetcodeProblemRow) {
  if (problem.isCompleted) return "text-success";
  if (problem.attemptCount > 0) return "text-primary";
  return "text-base-content/70";
}

function attemptResultStyles(attempt: LeetcodeAttemptRow) {
  if (attempt.isSuccessful) {
    return {
      pill: "border-success/30 bg-success/10 text-success",
      dot: "bg-success",
      label: "Accepted",
    };
  }

  return {
    pill: "border-warning/30 bg-warning/10 text-warning",
    dot: "bg-warning",
    label: attempt.failureReason || "Wrong Answer",
  };
}

function resourcePill(label: string, href?: string) {
  if (!href) {
    return (
      <span className="rounded-lg border border-base-300 bg-base-200/60 px-3 py-1.5 text-sm font-semibold text-base-content/30">
        {label}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-semibold text-primary transition hover:border-primary/50 hover:bg-primary/10"
    >
      {label}
    </a>
  );
}

function patternChip(label: string) {
  return (
    <span className="rounded-lg border border-primary/10 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
      {label}
    </span>
  );
}

export function LeetcodeProblemTable({
  problems,
  attempts,
  externalPattern,
}: LeetcodeProblemTableProps) {
  const patternMenuRef = useRef<HTMLDivElement>(null);
  const difficultyMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
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

  const patternOptions = useMemo(
    () => uniqueInOrder(problems.map((problem) => problem.pattern)),
    [problems],
  );

  const subPatternOptions = useMemo(() => {
    if (!activePatternForSubPatterns) return [];

    return uniqueInOrder(
      problems
        .filter((problem) => problem.pattern === activePatternForSubPatterns)
        .map((problem) => problem.subPattern),
    );
  }, [activePatternForSubPatterns, problems]);

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

  useEffect(() => {
    function closeMenusOnOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      if (patternMenuRef.current && !patternMenuRef.current.contains(target)) {
        setShowPatternMenu(false);
        setActivePatternForSubPatterns(null);
      }

      if (difficultyMenuRef.current && !difficultyMenuRef.current.contains(target)) {
        setShowDifficultyMenu(false);
      }

      if (statusMenuRef.current && !statusMenuRef.current.contains(target)) {
        setShowStatusMenu(false);
      }
    }

    document.addEventListener("mousedown", closeMenusOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeMenusOnOutsideClick);
    };
  }, []);

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

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-base-300 bg-base-100/80 p-4 shadow-lg shadow-black/10">
        <div className="space-y-4">
          <label className="input input-bordered flex min-h-14 w-full items-center gap-3 rounded-xl border-base-300 bg-base-200/50 px-4">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-5 w-5 text-base-content/50"
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
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="grow bg-transparent"
              placeholder="Search problems..."
            />
          </label>

          <div className="grid gap-3 border-t border-base-300 pt-4 md:grid-cols-2 xl:grid-cols-[minmax(10rem,14rem)_minmax(10rem,14rem)_minmax(12rem,16rem)_auto_auto] xl:items-center">

          <div
            ref={difficultyMenuRef}
            className="relative z-40"
            onMouseLeave={() => setShowDifficultyMenu(false)}
          >
            <button
              type="button"
              className={`btn btn-outline min-h-14 w-full cursor-pointer justify-between rounded-xl border-base-300 px-5 ${
                showDifficultyMenu ? "border-primary text-primary" : ""
              }`}
              onClick={() => setShowDifficultyMenu((current) => !current)}
            >
              {difficultyFilterLabel()}
              <span>{showDifficultyMenu ? "⌃" : "⌄"}</span>
            </button>

            {showDifficultyMenu ? (
              <>
              <div className="absolute left-0 top-full z-40 h-3 w-full" />
              <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-2xl shadow-black/40">
                {[
                  [allOption, "All difficulties"],
                  ["easy", "Easy"],
                  ["medium", "Medium"],
                  ["hard", "Hard"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-base-200 ${
                      difficulty === value ? "bg-primary/10 text-primary" : ""
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

          <div
            ref={statusMenuRef}
            className="relative z-40"
            onMouseLeave={() => setShowStatusMenu(false)}
          >
            <button
              type="button"
              className={`btn btn-outline min-h-14 w-full cursor-pointer justify-between rounded-xl border-base-300 px-5 ${
                showStatusMenu ? "border-primary text-primary" : ""
              }`}
              onClick={() => setShowStatusMenu((current) => !current)}
            >
              {statusFilterLabel()}
              <span>{showStatusMenu ? "⌃" : "⌄"}</span>
            </button>

            {showStatusMenu ? (
              <>
              <div className="absolute left-0 top-full z-40 h-3 w-full" />
              <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-2xl shadow-black/40">
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
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-base-200 ${
                      status === value ? "bg-primary/10 text-primary" : ""
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

          <div
            ref={patternMenuRef}
            className="relative z-30"
            onMouseLeave={() => {
              setShowPatternMenu(false);
              setActivePatternForSubPatterns(null);
            }}
          >
            <button
              type="button"
              className={`btn btn-outline min-h-14 w-full cursor-pointer justify-between rounded-xl border-base-300 px-5 ${
                showPatternMenu ? "border-primary text-primary" : ""
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
                Patterns ({selectedPatterns.length + selectedSubPatterns.length})
              </span>
              <span>{showPatternMenu ? "⌃" : "⌄"}</span>
            </button>

            {showPatternMenu ? (
              <>
              <div className="absolute left-0 top-full z-40 h-3 w-full" />
              <div
                className="absolute left-0 top-full z-50 mt-2 flex w-max max-w-[calc(100vw-3rem)] items-start gap-3"
              >
                <div className="w-80 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-2xl shadow-black/40">
                  <label className="input input-bordered mb-2 flex h-10 items-center gap-2 rounded-xl border-base-300 bg-base-200/50 px-3">
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-4 w-4 text-base-content/50"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    <span className="text-sm text-base-content/50">Search patterns...</span>
                  </label>

                  <div className="max-h-72 space-y-1 overflow-y-auto">
                    {patternOptions.map((patternOption) => (
                      <div
                        key={patternOption}
                        className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-base-200"
                      >
                        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedPatterns.includes(patternOption)}
                            onChange={() => toggleSelectedPattern(patternOption)}
                            className="checkbox checkbox-primary checkbox-sm"
                          />
                          <span className="truncate">{patternOption}</span>
                        </label>
                        <button
                          type="button"
                          className={`btn btn-ghost btn-xs cursor-pointer ${
                            activePatternForSubPatterns === patternOption ? "text-primary" : ""
                          }`}
                          onClick={() =>
                            setActivePatternForSubPatterns((current) =>
                              current === patternOption ? null : patternOption,
                            )
                          }
                        >
                          ›
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {activePatternForSubPatterns ? (
                  <div className="w-64 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-2xl shadow-black/40">
                    <div className="mb-2 font-semibold">{activePatternForSubPatterns}</div>
                    <div className="max-h-72 space-y-1 overflow-y-auto">
                      {subPatternOptions.map((subPatternOption) => (
                        <label
                          key={subPatternOption}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-base-300/50"
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
            className={`btn min-h-14 rounded-xl border-base-300 px-5 ${
              hasVideo ? "btn-primary" : "btn-outline"
            } w-full cursor-pointer xl:w-auto`}
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
          </button>

          <button
            type="button"
            className="btn btn-outline min-h-14 w-full cursor-pointer rounded-xl border-base-300 px-5 xl:w-auto"
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
            Reset
          </button>
          </div>
        </div>

        {selectedPatterns.length > 0 || selectedSubPatterns.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {[...selectedPatterns, ...selectedSubPatterns].map((selectedItem) => (
              <button
                key={selectedItem}
                type="button"
                className="btn btn-outline btn-sm cursor-pointer rounded-lg border-primary/20 bg-primary/5 text-primary"
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

      <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100/80 shadow-lg shadow-black/10">
        <table className="table">
          <thead className="bg-base-100">
            <tr className="border-base-300 text-sm text-base-content/60">
              <th className="w-16 px-4 py-4">#</th>
              <th className="px-4 py-4">
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-2 transition hover:text-primary hover:underline hover:underline-offset-4"
                  onClick={toggleProblemSort}
                >
                  Problem
                  <span className="text-xs text-base-content/40">{problemSortLabel()}</span>
                </button>
              </th>
              <th className="px-4 py-4">
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-2 transition hover:text-primary hover:underline hover:underline-offset-4"
                  onClick={toggleDifficultySort}
                >
                  Difficulty
                  <span className="text-xs text-base-content/40">{difficultySortLabel()}</span>
                </button>
              </th>
              <th className="px-4 py-4">
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-2 transition hover:text-primary hover:underline hover:underline-offset-4"
                  onClick={toggleProgressFilter}
                >
                  Progress
                  <span className="text-xs text-base-content/40">{progressFilterLabel()}</span>
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
                  <tr className="border-base-300 transition hover:bg-base-200/60">
                    <td className="px-4 py-4 align-middle font-mono text-base text-base-content/60">
                      {problem.number}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-start gap-4">
                        <span className="text-base-content/40">
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
                          <div className="font-semibold leading-snug">{problem.title}</div>
                          <div className="flex flex-wrap gap-2">
                            {patternChip(problem.pattern)}
                            {patternChip(problem.subPattern)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold capitalize ${difficulty.pill}`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${difficulty.dot}`} />
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 align-middle">
                        <button
                          type="button"
                          className={`inline-flex cursor-pointer items-center gap-2 text-sm transition hover:text-primary hover:underline hover:underline-offset-4 ${progressTextClass(problem)}`}
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
                      <a
                        href={`/leetcode/${problem.number}/timer`}
                        className="btn btn-primary rounded-xl px-7 shadow-lg shadow-primary/20"
                      >
                        Start
                      </a>
                    </td>
                  </tr>

                  {isExpanded ? (
                    <tr className="border-base-300 bg-base-200/40">
                      <td colSpan={6}>
                        <div className="mx-6 my-4 rounded-2xl border border-base-300 bg-base-100/70 p-6 shadow-inner shadow-black/20">
                          {problemAttempts.length > 0 ? (
                            <div className="space-y-4">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <h3 className="text-lg font-bold">Attempt History</h3>
                                  <p className="text-sm text-base-content/60">
                                    {problemAttempts.length} attempts · Last attempt{" "}
                                    {formatDate(problem.lastAttemptedAt)}
                                  </p>
                                </div>

                                <div className="flex items-center gap-5 text-sm">
                                  <a
                                    href={problem.leetcodeUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 font-semibold text-primary transition hover:text-primary-focus"
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
                                  <span className="h-6 w-px bg-base-300" />
                                  <button
                                    type="button"
                                    className="inline-flex cursor-pointer items-center gap-2 text-base-content/80 transition hover:text-base-content"
                                    onClick={() => setExpandedProblemId(null)}
                                  >
                                    Collapse
                                    <span className="text-xs">⌃</span>
                                  </button>
                                </div>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="table table-sm rounded-xl border border-base-300">
                                  <thead className="bg-base-200/70">
                                    <tr className="border-base-300 text-base-content/60">
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
                                      <tr key={attempt.attemptId} className="border-base-300">
                                        <td className="font-mono text-base-content/80">
                                          #{problemAttempts.length - index}
                                        </td>
                                        <td className="text-base-content/70">
                                          {formatDate(attempt.endedAt)}
                                        </td>
                                        <td>
                                          <span
                                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${result.pill}`}
                                          >
                                            <span className={`h-2 w-2 rounded-full ${result.dot}`} />
                                            {result.label}
                                          </span>
                                        </td>
                                        <td>{formatDuration(attempt.durationSeconds)}</td>
                                        <td className="max-w-xl text-base-content/70">
                                          {attempt.notes || attempt.failureReason || "-"}
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
                              <p className="text-sm text-base-content/60">
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

        <div className="flex flex-col gap-4 border-t border-base-300 px-4 py-5 text-sm text-base-content/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {filteredProblems.length} of {problems.length} problems
          </p>
          <div className="join">
            <button type="button" className="btn btn-outline join-item btn-sm" disabled>
              Previous
            </button>
            <button type="button" className="btn btn-primary join-item btn-sm">
              1
            </button>
            <button type="button" className="btn btn-outline join-item btn-sm" disabled>
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
