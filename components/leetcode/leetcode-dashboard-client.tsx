"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LeetcodeAttemptOverlayButton } from "./leetcode-attempt-overlay";
import { formatMinutesDuration } from "@/lib/leetcode/leetcode-formatters";
import {
  LeetcodeProblemDifficultyLabel,
  type LeetcodeAttemptRow,
  type LeetcodeProblemRow,
  type SaveLeetcodeAttemptAction,
} from "@/lib/leetcode/types";
import { LeetcodePanel } from "./leetcode-ui";

type LeetcodeDashboardClientProps = {
  problems: LeetcodeProblemRow[];
  attempts: LeetcodeAttemptRow[];
  saveAttemptAction?: SaveLeetcodeAttemptAction;
};

type DifficultyFilter = "all" | LeetcodeProblemRow["difficulty"];

const filters: { label: string; value: DifficultyFilter }[] = [
  { label: "All", value: "all" },
  { label: "Easy", value: LeetcodeProblemDifficultyLabel.Easy },
  { label: "Medium", value: LeetcodeProblemDifficultyLabel.Medium },
  { label: "Hard", value: LeetcodeProblemDifficultyLabel.Hard },
];

function isSameLocalDay(value: string, date: Date) {
  const input = new Date(value);

  return (
    input.getFullYear() === date.getFullYear() &&
    input.getMonth() === date.getMonth() &&
    input.getDate() === date.getDate()
  );
}

function calculateStreak(attempts: LeetcodeAttemptRow[]) {
  const successfulDays = new Set(
    attempts
      .filter((attempt) => attempt.isSuccessful)
      .map((attempt) => new Date(attempt.endedAt).toISOString().slice(0, 10)),
  );

  let streak = 0;
  const cursor = new Date();

  while (successfulDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function difficultyClasses(difficulty: LeetcodeProblemRow["difficulty"]) {
  switch (difficulty) {
    case LeetcodeProblemDifficultyLabel.Easy:
      return "border-[#1d7452] bg-[#113a32] text-[#38e68a]";
    case LeetcodeProblemDifficultyLabel.Medium:
      return "border-[#74561b] bg-[#352913] text-[#ffd323]";
    case LeetcodeProblemDifficultyLabel.Hard:
      return "border-[#74304a] bg-[#341827] text-[#ff6f91]";
  }
}

function statusForProblem(problem: LeetcodeProblemRow) {
  if (problem.isCompleted) {
    return {
      label: "Review",
      action: "Start",
      className: "border-[#4d2c80] bg-[#2b1a52] text-[#c188ff]",
    };
  }

  if (problem.attemptCount > 0) {
    return {
      label: "In Progress",
      action: "Resume",
      className: "border-[#245c90] bg-[#123255] text-[#58a8ff]",
    };
  }

  return {
    label: "Not Started",
    action: "Start",
    className: "border-[#334258] bg-[#172233] text-slate-300",
  };
}

function latestAttemptNotes(attempts: LeetcodeAttemptRow[]) {
  const latestNotes = new Map<string, { endedAt: string; notes: string }>();

  for (const attempt of attempts) {
    const notes = attempt.notes?.trim();

    if (!notes) continue;

    const current = latestNotes.get(attempt.problemId);

    if (!current || new Date(attempt.endedAt) > new Date(current.endedAt)) {
      latestNotes.set(attempt.problemId, { endedAt: attempt.endedAt, notes });
    }
  }

  return latestNotes;
}

function Icon({
  name,
  className = "h-6 w-6",
}: {
  name:
    | "calendar"
    | "check"
    | "chevron"
    | "clock"
    | "code"
    | "flame"
    | "grid"
    | "layers"
    | "search"
    | "sparkle"
    | "tree";
  className?: string;
}) {
  const paths = {
    calendar: (
      <>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <path d="M3 9h18" />
        <rect x="4" y="5" width="16" height="16" rx="3" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    code: (
      <>
        <path d="m9 8-4 4 4 4" />
        <path d="m15 8 4 4-4 4" />
        <path d="m13 5-2 14" />
      </>
    ),
    flame: (
      <>
        <path d="M12 22c4 0 7-2.6 7-6.8 0-3-1.8-5.1-4.1-7.6-.8 2.4-2 3.6-3.4 4.4.4-3.1-.8-5.6-3.3-8C7.6 7.7 5 10.4 5 15.2 5 19.4 8 22 12 22Z" />
        <path d="M12 18c1.5 0 2.7-1 2.7-2.6 0-1.1-.6-2-1.7-3.1-.3 1-.8 1.5-1.5 1.9.2-1.4-.3-2.4-1.3-3.5-.6 1.7-1.1 2.8-1.1 4.7 0 1.6 1.2 2.6 2.9 2.6Z" />
      </>
    ),
    grid: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5" />
        <path d="m3 16 9 5 9-5" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    sparkle: (
      <>
        <path d="M12 3 10.5 8.5 5 10l5.5 1.5L12 17l1.5-5.5L19 10l-5.5-1.5L12 3Z" />
        <path d="M19 15 18.2 18.2 15 19l3.2.8L19 23l.8-3.2L23 19l-3.2-.8L19 15Z" />
      </>
    ),
    tree: (
      <>
        <path d="M12 3 5 15h14L12 3Z" />
        <path d="M12 12 7 21h10l-5-9Z" />
        <path d="M12 21v-3" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      {paths[name]}
    </svg>
  );
}

function StatCard({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  value: string;
  note: string;
  tone: "green" | "orange" | "purple";
}) {
  const iconClass =
    tone === "green"
      ? "bg-[#153b33] text-[#31d17d]"
      : tone === "orange"
        ? "bg-[#352618] text-[#ff942f]"
        : "bg-[#241d55] text-[#8d72ff]";

  return (
    <LeetcodePanel className="flex min-h-32 items-center gap-5 p-4">
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${iconClass}`}>
        <Icon name={icon} className="h-7 w-7" />
      </div>
      <div>
        <div className="text-base font-medium text-slate-200">{label}</div>
        <div className="mt-2 whitespace-nowrap text-[2rem] font-extrabold leading-none text-[#8068ff]">
          {value}
        </div>
        <div className="mt-2 text-base text-slate-400">{note}</div>
      </div>
    </LeetcodePanel>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  return (
    <div
      className="grid h-36 w-36 place-items-center rounded-full"
      style={{
        background: `conic-gradient(#7359ff ${percent}%, #263448 ${percent}% 100%)`,
      }}
    >
      <div className="grid h-28 w-28 place-items-center rounded-full bg-[#101a2a]">
        <span className="text-4xl font-extrabold text-white">{percent}%</span>
      </div>
    </div>
  );
}

export function LeetcodeDashboardClient({
  problems,
  attempts,
  saveAttemptAction,
}: LeetcodeDashboardClientProps) {
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [query, setQuery] = useState("");

  const today = useMemo(() => new Date(), []);
  const todayProblems = useMemo(() => problems.slice(0, 8), [problems]);
  const todayProblemIds = useMemo(
    () => new Set(todayProblems.map((problem) => problem.number)),
    [todayProblems],
  );
  const todaysAttempts = useMemo(
    () => attempts.filter((attempt) => isSameLocalDay(attempt.endedAt, today)),
    [attempts, today],
  );
  const completedToday = useMemo(
    () => todaysAttempts.filter((attempt) => attempt.isSuccessful).length,
    [todaysAttempts],
  );
  const estimatedMinutes = useMemo(
    () => todayProblems.reduce((total, problem) => total + problem.estimatedMinutes, 0),
    [todayProblems],
  );
  const doneMinutes = useMemo(
    () =>
      todaysAttempts.reduce(
        (total, attempt) => total + Math.round(attempt.durationSeconds / 60),
        0,
      ),
    [todaysAttempts],
  );
  const progressPercent = useMemo(
    () =>
      todayProblems.length === 0
        ? 0
        : Math.round((completedToday / todayProblems.length) * 100),
    [completedToday, todayProblems.length],
  );
  const normalizedQuery = useMemo(() => query.trim().toLowerCase(), [query]);
  const filteredProblems = useMemo(
    () =>
      todayProblems.filter((problem) => {
        const matchesDifficulty = difficulty === "all" || problem.difficulty === difficulty;
        const matchesQuery =
          normalizedQuery.length === 0 ||
          problem.title.toLowerCase().includes(normalizedQuery) ||
          problem.pattern.toLowerCase().includes(normalizedQuery);

        return matchesDifficulty && matchesQuery;
      }),
    [difficulty, normalizedQuery, todayProblems],
  );
  const suggestedProblems = useMemo(
    () => problems.filter((problem) => !todayProblemIds.has(problem.number)).slice(0, 4),
    [problems, todayProblemIds],
  );
  const fallbackSuggestions = useMemo(() => todayProblems.slice(0, 4), [todayProblems]);
  const suggestions = suggestedProblems.length > 0 ? suggestedProblems : fallbackSuggestions;
  const streak = useMemo(() => calculateStreak(attempts), [attempts]);
  const notesByProblemId = useMemo(() => latestAttemptNotes(attempts), [attempts]);

  return (
    <div className="mx-[calc(50%-50vw)] -mt-5 space-y-6 px-8 pb-4">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#8068ff]">
            Today&apos;s Practice
          </p>
          <h1 className="mt-3 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-[3.5rem]">
            Problems for Today
          </h1>
          <p className="mt-2 max-w-4xl text-xl text-slate-300">
            A focused plan for today with key stats, priority problems, and a few smart suggestions.
          </p>
        </div>
        <Link
          href="/leetcode"
          className="inline-flex h-13 items-center justify-center gap-4 rounded-lg bg-[#6747ff] px-8 text-base font-extrabold text-white shadow-[0_16px_35px_rgba(103,71,255,0.3)] transition hover:bg-[#775bff]"
        >
          View all problems
          <Icon name="chevron" className="h-5 w-5" />
        </Link>
      </section>

      <section className="relative grid gap-4 md:grid-cols-2 xl:grid-cols-4 xl:pr-[31.5rem]">
        <StatCard
          icon="calendar"
          label="Due Today"
          value={String(todayProblems.length)}
          note="Problems to solve"
          tone="purple"
        />
        <StatCard
          icon="clock"
          label="Estimated Time"
          value={formatMinutesDuration(estimatedMinutes)}
          note="Planned for today"
          tone="purple"
        />
        <StatCard
          icon="check"
          label="Completed Today"
          value={String(completedToday)}
          note="Problems done"
          tone="green"
        />
        <StatCard
          icon="flame"
          label="Streak"
          value={String(streak)}
          note={streak === 1 ? "day" : "days"}
          tone="orange"
        />
        <LeetcodePanel className="p-6 xl:absolute xl:right-0 xl:top-0 xl:w-[30rem]">
          <div className="mb-5 flex items-center gap-4">
            <Icon name="sparkle" className="h-7 w-7 text-[#8d72ff]" />
            <h2 className="text-xl font-extrabold text-white">Suggested Problems</h2>
          </div>
          <div className="space-y-3">
            {suggestions.map((problem, index) => {
              const iconNames: Parameters<typeof Icon>[0]["name"][] = [
                "code",
                "layers",
                "tree",
                "grid",
              ];

              return (
                <LeetcodeAttemptOverlayButton
                  key={problem.number}
                  problem={problem}
                  lastNotes={notesByProblemId.get(problem.number)?.notes ?? null}
                  saveAttemptAction={saveAttemptAction}
                  className="flex min-h-16 items-center gap-4 rounded-xl border border-[#22314a] bg-[#142034] px-5 transition hover:border-[#6e55ff]/60 hover:bg-[#17263d]"
                >
                  <Icon
                    name={iconNames[index % iconNames.length]}
                    className={`h-7 w-7 ${
                      index === 1
                        ? "text-[#2ed37b]"
                        : index === 2
                          ? "text-[#22cf77]"
                          : "text-[#5b82ff]"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-bold text-white">
                      {problem.title}
                    </div>
                    <div className="mt-1 text-sm text-slate-400">{problem.pattern}</div>
                  </div>
                  <span className="text-sm font-medium text-slate-300">
                    {problem.estimatedMinutes}m
                  </span>
                  <Icon name="chevron" className="h-5 w-5 text-slate-400" />
                </LeetcodeAttemptOverlayButton>
              );
            })}
          </div>
          <Link
            href="/leetcode"
            className="mx-auto mt-6 flex w-fit items-center gap-3 text-base font-bold text-[#8d72ff] transition hover:text-white"
          >
            View more suggestions
            <Icon name="chevron" className="h-5 w-5" />
          </Link>
        </LeetcodePanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_30rem]">
        <LeetcodePanel className="p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-white">Today&apos;s Problems</h2>
              <p className="mt-1 text-lg text-slate-400">
                {todayProblems.length} selected problems for your practice session
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {filters.map((filter) => {
                  const isSelected = difficulty === filter.value;
                  const selectedClass =
                    filter.value === LeetcodeProblemDifficultyLabel.Easy
                      ? "border-[#1d7452] bg-[#123a32] text-[#38e68a]"
                      : filter.value === LeetcodeProblemDifficultyLabel.Medium
                        ? "border-[#74561b] bg-[#352913] text-[#ffd323]"
                        : filter.value === LeetcodeProblemDifficultyLabel.Hard
                          ? "border-[#74304a] bg-[#341827] text-[#ff6f91]"
                          : "border-[#5a4fc2] bg-[#272059] text-[#a895ff]";

                  return (
                    <button
                      key={filter.value}
                      type="button"
                      className={`h-10 rounded-xl border px-4 text-sm font-bold transition ${
                        isSelected
                          ? selectedClass
                          : "border-[#26364d] bg-[#101a2a] text-slate-300 hover:border-[#5a4fc2]"
                      }`}
                      onClick={() => setDifficulty(filter.value)}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex h-12 w-full items-center gap-3 rounded-xl border border-[#26364d] bg-[#172337] px-4 lg:w-80">
              <Icon name="search" className="h-5 w-5 text-slate-500" />
              <input
                className="min-w-0 flex-1 bg-transparent text-base text-slate-200 outline-none placeholder:text-slate-500"
                placeholder="Search problems..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-[#26364d]">
            <table className="w-full min-w-[58rem] text-left">
              <thead className="bg-[#111d30] text-sm font-semibold text-slate-400">
                <tr>
                  <th className="w-16 px-5 py-4">
                    <span className="block h-5 w-5 rounded border border-[#516278]" />
                  </th>
                  <th className="px-4 py-4">Problem</th>
                  <th className="px-4 py-4">Pattern</th>
                  <th className="px-4 py-4">Difficulty</th>
                  <th className="px-4 py-4">Est. Time</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243149] bg-[#101a2a]/60">
                {filteredProblems.map((problem, index) => {
                  const status = statusForProblem(problem);

                  return (
                    <tr key={problem.number} className="text-sm text-slate-300">
                      <td className="px-5 py-4">
                        <span className="block h-5 w-5 rounded border border-[#516278]" />
                      </td>
                      <td className="px-4 py-4 font-semibold text-white">
                        {index + 1}. {problem.title}
                      </td>
                      <td className="px-4 py-4 text-slate-300">{problem.pattern}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-lg border px-4 py-2 text-sm font-bold capitalize ${difficultyClasses(
                            problem.difficulty,
                          )}`}
                        >
                          {problem.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {problem.estimatedMinutes}m
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-lg border px-4 py-2 text-sm font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <LeetcodeAttemptOverlayButton
                          problem={problem}
                          actionLabel={status.action}
                          lastNotes={notesByProblemId.get(problem.number)?.notes ?? null}
                          saveAttemptAction={saveAttemptAction}
                          className="inline-flex h-10 min-w-20 items-center justify-center rounded-lg bg-[#6747ff] px-5 text-sm font-bold text-white transition hover:bg-[#775bff]"
                        >
                          {status.action}
                        </LeetcodeAttemptOverlayButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </LeetcodePanel>

        <LeetcodePanel className="p-7 xl:mt-[16.75rem]">
          <h2 className="text-2xl font-extrabold text-white">Today&apos;s Progress</h2>
          <div className="mt-7 flex flex-col gap-8 sm:flex-row sm:items-center">
            <ProgressRing percent={progressPercent} />
            <div className="space-y-6 text-lg text-slate-300">
              <div className="flex items-center gap-4">
                <Icon name="check" className="h-7 w-7 text-slate-400" />
                <span>
                  {completedToday} of {todayProblems.length} completed
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Icon name="clock" className="h-7 w-7 text-slate-400" />
                <span>{formatMinutesDuration(estimatedMinutes)} planned</span>
              </div>
              <div className="flex items-center gap-4">
                <Icon name="calendar" className="h-7 w-7 text-slate-400" />
                <span>{formatMinutesDuration(doneMinutes)} done</span>
              </div>
            </div>
          </div>
        </LeetcodePanel>
      </section>
    </div>
  );
}
