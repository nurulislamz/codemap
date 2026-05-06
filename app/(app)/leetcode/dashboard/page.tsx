import Link from "next/link";
import { LeetcodeAttemptOverlayButton } from "@/components/leetcode/leetcode-attempt-overlay";
import { LeetcodeDashboardProblemTableClient } from "@/components/leetcode/leetcode-dashboard-client";
import { LeetcodePanel } from "@/components/leetcode/leetcode-ui";
import { saveLeetCodeAttempt } from "@/lib/leetcode/actions";
import {
  getSortedLeetcodeAttemptEventsForRequest,
  hydrateProblemsWithAttempts,
  toLeetcodeAttemptRows,
} from "@/lib/leetcode/attempts";
import { getLeetcodeCatalog } from "@/lib/leetcode/catalog";
import { formatMinutesDuration } from "@/lib/leetcode/leetcode-formatters";
import {
  Icon,
  ProgressRing,
  StatCard,
  calculateStreak,
  dashboardProblemRow,
  difficultyFilters,
  isSameLocalDay,
  latestAttemptNotes,
} from "./lib";

export const dynamic = "force-dynamic";


export default async function LeetcodeDashboardPage() {
  const catalog = getLeetcodeCatalog();
  const attemptEvents = await getSortedLeetcodeAttemptEventsForRequest();
  const catalogProblems = Array.from(catalog.problems.values()).flat();
  const problems = hydrateProblemsWithAttempts(catalogProblems, attemptEvents);
  const attempts = toLeetcodeAttemptRows(
    attemptEvents,
    new Map(catalogProblems.map((problem) => [problem.number, problem])),
  );

  const today = new Date();
  const todayProblems = problems.slice(0, 8);
  const todayProblemIds = new Set(todayProblems.map((problem) => problem.number));
  const todaysAttempts = attempts.filter((attempt) => isSameLocalDay(attempt.endedAt, today));
  const completedToday = todaysAttempts.filter((attempt) => attempt.isSuccessful).length;
  const estimatedMinutes = todayProblems.reduce(
    (total, problem) => total + problem.estimatedMinutes,
    0,
  );
  const doneMinutes = todaysAttempts.reduce(
    (total, attempt) => total + Math.round(attempt.durationSeconds / 60),
    0,
  );
  const progressPercent =
    todayProblems.length === 0 ? 0 : Math.round((completedToday / todayProblems.length) * 100);
  const suggestedProblems = problems
    .filter((problem) => !todayProblemIds.has(problem.number))
    .slice(0, 4);
  const fallbackSuggestions = todayProblems.slice(0, 4);
  const suggestions = suggestedProblems.length > 0 ? suggestedProblems : fallbackSuggestions;
  const streak = calculateStreak(attempts);
  const notesByProblemId = latestAttemptNotes(attempts);
  const todayRows = todayProblems.map((problem) =>
    dashboardProblemRow(problem, notesByProblemId),
  );

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
                  saveAttemptAction={saveLeetCodeAttempt}
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
        <LeetcodeDashboardProblemTableClient
          difficultyFilters={difficultyFilters}
          problems={todayRows}
          saveAttemptAction={saveLeetCodeAttempt}
        />

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
