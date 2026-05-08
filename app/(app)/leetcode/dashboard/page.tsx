import Link from "next/link";

import { LeetcodeDashboardProblemTableClient } from "@/components/leetcode/leetcode-dashboard-client";
import {
  CodeIcon,
  Icon,
  LeetcodePanel,
  SectionHero,
  StatCard,
  leetcodePrimaryActionClass,
} from "@/components/leetcode/leetcode-ui";
import { saveLeetCodeAttempt } from "@/lib/leetcode/actions";
import {
  getSortedLeetcodeAttemptEventsForRequest,
  hydrateProblemsWithAttempts,
  toLeetcodeAttemptRows,
} from "@/lib/leetcode/attempts";
import { getLeetcodeCatalog } from "@/lib/leetcode/catalog";
import { getDailyTrack, getDailyTrackProblemTasks, selectDailyTrackDay } from "@/lib/leetcode/daily-track";
import { formatMinutesDuration } from "@/lib/leetcode/leetcode-formatters";
import {
  ProgressRing,
  calculateStreak,
  dashboardProblemRow,
  isSameLocalDay,
  latestAttemptNotes,
} from "./lib";

export const dynamic = "force-dynamic";

export default async function LeetcodeDashboardPage() {
  const catalog = getLeetcodeCatalog();
  const attemptEvents = await getSortedLeetcodeAttemptEventsForRequest();
  const catalogProblems = Array.from(catalog.problems.values()).flat();
  const problems = hydrateProblemsWithAttempts(catalogProblems, attemptEvents);
  const problemsById = new Map(problems.map((problem) => [problem.number, problem]));
  const attempts = toLeetcodeAttemptRows(
    attemptEvents,
    new Map(catalogProblems.map((problem) => [problem.number, problem])),
  );

  const dailyTrack = getDailyTrack();
  const dailyTrackDay = selectDailyTrackDay(dailyTrack, problemsById);
  const today = new Date();
  const dailyTrackTasks = getDailyTrackProblemTasks(dailyTrackDay, problemsById);
  const todayProblems = dailyTrackTasks.map((task) => task.problem);
  const todayProblemIds = new Set(todayProblems.map((problem) => problem.number));
  const todaysAttempts = attempts.filter(
    (attempt) =>
      todayProblemIds.has(attempt.problemId) && isSameLocalDay(attempt.endedAt, today),
  );
  const completedToday = dailyTrackTasks.filter((task) => task.status === "completed").length;
  const recentFailedAttempts = attempts.filter((attempt) => !attempt.isSuccessful).slice(0, 3);
  const notesByProblemId = latestAttemptNotes(attempts);
  const seenFailedProblemIds = new Set<string>();
  const recentFailedRows: ReturnType<typeof dashboardProblemRow>[] = [];
  for (const attempt of recentFailedAttempts) {
    const problem = problemsById.get(attempt.problemId);
    if (!problem || seenFailedProblemIds.has(problem.number)) continue;

    seenFailedProblemIds.add(problem.number);
    const failureRow = dashboardProblemRow(problem, notesByProblemId);
    recentFailedRows.push({
      ...failureRow,
      actionLabel: "Retry",
      statusLabel: attempt.failureReason ?? "Failed",
      statusClassName: "border-[#7f2a2a] bg-[#2d1414] text-[#ff9f9f]",
    });
  }

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
  const streak = calculateStreak(attempts);
  const todayRows = todayProblems.map((problem) =>
    dashboardProblemRow(problem, notesByProblemId),
  );

  return (
    <div className="mx-[calc(50%-50vw)] -mt-5 space-y-6 px-8 pb-4">
      <SectionHero
        icon={<CodeIcon className="h-9 w-9" />}
        title="Dashboard"
        description={`${dailyTrackDay.focus.label} across ${dailyTrackTasks.length} focused tasks.`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href="/leetcode/allproblems" className={`${leetcodePrimaryActionClass} gap-4`}>
            View all problems
            <Icon name="chevron" className="h-5 w-5" />
          </Link>
          <a
            href="/leetcode/tracks/complete-track"
            target="_blank"
            rel="noopener noreferrer"
            className={`${leetcodePrimaryActionClass} gap-4`}
          >
            Complete Track
            <Icon name="chevron" className="h-5 w-5" />
          </a>
        </div>
      </SectionHero>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Track Tasks"
              value={String(todayProblems.length)}
              note="Problems to solve"
              tone="primary"
              icon={<Icon name="calendar" className="h-7 w-7" />}
            />
            <StatCard
              label="Estimated Time"
              value={formatMinutesDuration(estimatedMinutes)}
              note="Planned for today"
              tone="primary"
              icon={<Icon name="clock" className="h-7 w-7" />}
            />
            <StatCard
              label="Completed"
              value={String(completedToday)}
              note="Track tasks done"
              tone="success"
              icon={<Icon name="check" className="h-7 w-7" />}
            />
            <StatCard
              label="Streak"
              value={String(streak)}
              note={streak === 1 ? "day" : "days"}
              tone="warning"
              icon={<Icon name="flame" className="h-7 w-7" />}
            />
          </div>

          <LeetcodeDashboardProblemTableClient
            problems={todayRows}
            attempts={attempts}
            subtitle="Pattern / Subpattern is shown per problem."
            saveAttemptAction={saveLeetCodeAttempt}
            showControls={false}
            showPagination={false}
          />
          <LeetcodeDashboardProblemTableClient
            problems={recentFailedRows}
            attempts={attempts}
            showControls={false}
            showPagination={false}
            emptyMessage="No recently failed problems found."
            subtitle={`${recentFailedRows.length} recently failed problems`}
            title="Recently Failed Problems"
            saveAttemptAction={saveLeetCodeAttempt}
          />
        </div>

        <aside className="min-w-0 space-y-6">
          <LeetcodePanel className="p-6">
            <h2 className="text-2xl font-extrabold text-white">Track Progress</h2>
            <div className="mt-6 flex flex-col items-center gap-6">
              <ProgressRing percent={progressPercent} />
              <div className="w-full space-y-5 text-base text-slate-300">
                <div className="flex items-center gap-4">
                  <Icon name="check" className="h-6 w-6 text-slate-400" />
                  <span>
                    {completedToday} of {todayProblems.length} completed
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <Icon name="clock" className="h-6 w-6 text-slate-400" />
                  <span>{formatMinutesDuration(estimatedMinutes)} planned</span>
                </div>
                <div className="flex items-center gap-4">
                  <Icon name="calendar" className="h-6 w-6 text-slate-400" />
                  <span>{formatMinutesDuration(doneMinutes)} done</span>
                </div>
              </div>
            </div>
          </LeetcodePanel>
        </aside>
      </section>
    </div>
  );
}
