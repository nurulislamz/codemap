import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { saveLeetCodeAttempt } from "@/lib/leetcode/actions";
import { getLeetcodeCatalog } from "@/lib/leetcode/catalog";
import {
  getSortedLeetcodeAttemptEventsForRequest,
  hydrateProblemsWithAttempts,
  toLeetcodeAttemptRows,
} from "@/lib/leetcode/attempts";
import {
  getDailyTrackProblemTasks,
  selectDailyTrackDay,
  type DailyTrack,
  type DailyTrackProblemList,
} from "@/lib/leetcode/daily-track";
import type { LeetcodeProblemProgressRow } from "@/lib/leetcode/types";
import { getLeetcodeTrackBySlug } from "@/lib/leetcode/tracks";
import { LeetcodeDashboardProblemTableClient } from "@/components/leetcode/leetcode-dashboard-client";
import {
  CodeIcon,
  Icon,
  primaryActionClass,
  SectionHero,
  StatCard,
} from "@/components/shared";
import { dashboardProblemRow, latestAttemptNotes } from "@/app/(app)/leetcode/dashboard/lib";
import { formatMinutesDuration } from "@/lib/leetcode/leetcode-formatters";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const track = getLeetcodeTrackBySlug(slug);

  if (!track) return {};

  return {
    title: track.title,
    description: track.description,
  };
}

export default async function LeetcodeTrackDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const track = getLeetcodeTrackBySlug(slug);

  if (!track) {
    notFound();
  }

  const catalog = getLeetcodeCatalog();
  const attemptEvents = await getSortedLeetcodeAttemptEventsForRequest();
  const catalogProblems = Array.from(catalog.problems.values()).flat();
  const progressProblems = hydrateProblemsWithAttempts(catalogProblems, attemptEvents);
  const attempts = toLeetcodeAttemptRows(
    attemptEvents,
    new Map(catalogProblems.map((problem) => [problem.number, problem])),
  );
  const notesByProblemId = latestAttemptNotes(attempts);
  const problemsById = new Map(progressProblems.map((problem) => [problem.number, problem]));
  const isTrackList = "problemIds" in track.data;

  const toDisplayProblemRow = (problem: LeetcodeProblemProgressRow) => {
    return {
      ...dashboardProblemRow(problem, notesByProblemId),
      statusLabel: problem.isCompleted ? "Completed" : problem.attemptCount > 0 ? "In progress" : "Not started",
      statusClassName: problem.isCompleted
        ? "border-[#4d2c80] bg-[#2b1a52] text-[#c188ff]"
        : problem.attemptCount > 0
          ? "border-[#245c90] bg-[#123255] text-[#58a8ff]"
          : "border-[#334258] bg-[#172233] text-slate-300",
    };
  };

  const trackRows = isTrackList
    ? (track.data as DailyTrackProblemList).problemIds.map((problemId) => {
      const problem = problemsById.get(problemId);

      if (!problem) {
        throw new Error(`Track references unknown problem ${problemId}.`);
      }

      return toDisplayProblemRow(problem);
    })
    : [];
  const trackData = isTrackList ? null : (track.data as DailyTrack);
  const currentTrackDay = trackData ? selectDailyTrackDay(trackData, problemsById).day : 0;
  const dailyRows = trackData
    ? trackData.days.map((day) => {
      const tasks = getDailyTrackProblemTasks(day, problemsById).map((task) => {
        return toDisplayProblemRow(task.problem);
      });
      return { day, tasks };
    })
    : [];
  const allRows = isTrackList ? trackRows : dailyRows.flatMap((item) => item.tasks);
  const completedTrackProblems = allRows.filter((problem) => problem.isCompleted).length;
  const attemptedTrackProblems = allRows.filter((problem) => problem.attemptCount > 0).length;
  const completionRate = allRows.length === 0 ? 0 : Math.round((completedTrackProblems / allRows.length) * 100);

  return (
    <div className="mx-[calc(50%-50vw)] -mt-5 space-y-6 px-8 pb-4">
      <SectionHero icon={<CodeIcon className="h-9 w-9" />} title={track.title} description={track.description}>
        <a href="/leetcode/dashboard" target="_blank" rel="noopener noreferrer" className={primaryActionClass}>
          Open Dashboard
          <Icon name="chevron" className="h-5 w-5" />
        </a>
      </SectionHero>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Problems"
          value={String(allRows.length)}
          note="In this track"
          tone="primary"
          icon={<Icon name="layers" className="h-7 w-7" />}
        />
        <StatCard
          label="Attempted"
          value={String(attemptedTrackProblems)}
          note="Touched at least once"
          tone="info"
          icon={<Icon name="grid" className="h-7 w-7" />}
        />
        <StatCard
          label="Completed"
          value={String(completedTrackProblems)}
          note={`${completionRate}% complete`}
          tone="success"
          icon={<Icon name="check" className="h-7 w-7" />}
        />
        <StatCard
          label="Mode"
          value={isTrackList ? "List" : `Day ${currentTrackDay}`}
          note={isTrackList ? "Straight sequence" : "Rolling daily track"}
          tone="warning"
          icon={<Icon name="calendar" className="h-7 w-7" />}
        />
      </div>

      {isTrackList ? (
        <LeetcodeDashboardProblemTableClient
          problems={trackRows}
          attempts={attempts}
          showControls={false}
          showPagination={false}
          subtitle={`${trackRows.length} problems`}
          title=""
          saveAttemptAction={saveLeetCodeAttempt}
        />
      ) : (
        <div className="space-y-6">
          {dailyRows.map(({ day, tasks }) => {
            const completed = tasks.filter((problem) => problem.isCompleted).length;
            const title = `Day ${day.day}: ${day.focus.label}`;
            const subtitle = `${day.focus.pattern} / ${day.focus.subPattern} · ${formatMinutesDuration(day.estimatedMinutes)} · ${completed}/${tasks.length} completed`;

            return (
              <div key={day.day} className="rounded-xl border border-[#26364d] bg-[#0b1626]/95 p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-extrabold text-white">{title}</h2>
                    <p className="text-sm text-slate-400">{subtitle}</p>
                  </div>

                    {day.day === currentTrackDay ? (
                      <span className="rounded-full border border-[#3a3482] bg-[#121a33] px-3 py-1.5 text-xs font-bold text-[#8f73ff]">
                        Current day
                      </span>
                    ) : null}
                </div>

                <LeetcodeDashboardProblemTableClient
                  problems={tasks}
                  attempts={attempts}
                  showControls={false}
                  showPagination={false}
                  title=""
                  subtitle={undefined}
                  emptyMessage="No tasks available for this day."
                  saveAttemptAction={saveLeetCodeAttempt}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
