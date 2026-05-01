import Link from "next/link";

import { getLeetcodePatternTree } from "@/lib/leetcode-patterns";
import { type LeetcodeAttemptRow, type LeetcodeProblemRow } from "../leetcode-problem-table";
import { getLeetCodeAttempts } from "../leetcode-db-server";
import { buildLeetcodeStats } from "../leetcode-stats";

export const dynamic = "force-dynamic";

function formatBestDuration(attempts: { durationSeconds: number; isSuccessful: boolean }[]) {
  const successfulDurations = attempts
    .filter((attempt) => attempt.isSuccessful)
    .map((attempt) => attempt.durationSeconds);

  return successfulDurations.length > 0 ? Math.min(...successfulDurations) : null;
}

function formatDuration(totalSeconds: number | null) {
  if (totalSeconds === null) return "-";

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function difficultyClass(difficulty: LeetcodeProblemRow["difficulty"]) {
  switch (difficulty) {
    case "easy":
      return {
        text: "text-success",
        bar: "bg-success",
        panel: "border-success/20 bg-success/10",
      };
    case "medium":
      return {
        text: "text-warning",
        bar: "bg-warning",
        panel: "border-warning/20 bg-warning/10",
      };
    case "hard":
      return {
        text: "text-error",
        bar: "bg-error",
        panel: "border-error/20 bg-error/10",
      };
  }
}

function progressWidth(part: number, whole: number) {
  if (whole === 0) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

function formatDayLabel(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

export default async function LeetcodeStatsPage() {
  const attempts = await getLeetCodeAttempts();
  const problems: LeetcodeProblemRow[] = getLeetcodePatternTree().flatMap((pattern) =>
    pattern.subPatterns.flatMap((subPattern) =>
      subPattern.problems.map((problem) => {
        const problemAttempts = attempts.filter((attempt) => attempt.problemId === problem.number);
        const latestAttempt = problemAttempts.toSorted(
          (left, right) => new Date(right.endedAt).getTime() - new Date(left.endedAt).getTime(),
        )[0];

        return {
          number: problem.number,
          title: problem.title,
          difficulty: problem.difficulty,
          pattern: pattern.topPattern,
          subPattern: subPattern.subPattern,
          leetcodeUrl: problem.leetcodeUrl,
          estimatedMinutes: problem.estimatedMinutes,
          solutionUrl: problem.solutions?.neetcode?.textUrl,
          solutionVideoUrl: problem.solutions?.neetcode?.videoUrl,
          isCompleted: problemAttempts.some((attempt) => attempt.isSuccessful),
          lastAttemptedAt: latestAttempt?.endedAt ?? null,
          attemptCount: problemAttempts.length,
          bestDurationSeconds: formatBestDuration(problemAttempts),
        };
      }),
    ),
  );
  const problemTitleByNumber = new Map(
    problems.map((problem) => [problem.number, problem.title]),
  );
  const attemptRows: LeetcodeAttemptRow[] = attempts
    .map((attempt) => ({
      attemptId: attempt.attemptId,
      problemId: attempt.problemId,
      problemTitle: problemTitleByNumber.get(attempt.problemId) ?? attempt.problemId,
      isSuccessful: attempt.isSuccessful,
      startedAt: attempt.startedAt,
      endedAt: attempt.endedAt,
      durationSeconds: attempt.durationSeconds,
      notes: attempt.notes,
      failureReason: attempt.failureReason,
    }))
    .toSorted(
      (left, right) => new Date(right.endedAt).getTime() - new Date(left.endedAt).getTime(),
  );
  const stats = buildLeetcodeStats(problems, attemptRows);
  const topPatterns = stats.byPattern.slice(0, 8);
  const consistencyDays = stats.consistency.attemptsByDay.slice(-14);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            LeetCode stats
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Practice dashboard
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-base-content/60">
            Track completion, attempt quality, pattern coverage, and practice
            consistency from saved attempt history.
          </p>
        </div>
        <Link href="/leetcode" className="btn btn-primary rounded-xl px-7">
          Back to problems
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Problems", stats.summary.totalProblems, "Total in catalog"],
          ["Completed", stats.summary.completedProblems, `${stats.summary.completionRate}% complete`],
          ["Attempted", stats.summary.attemptedProblems, "Touched at least once"],
          ["Success rate", `${stats.attempts.successRate}%`, `${stats.attempts.acceptedAttempts}/${stats.attempts.totalAttempts} accepted`],
        ].map(([label, value, note]) => (
          <div
            key={label}
            className="rounded-2xl border border-base-300 bg-base-100/80 p-5 shadow-lg shadow-black/10"
          >
            <div className="text-sm font-semibold text-base-content/60">{label}</div>
            <div className="mt-3 text-3xl font-bold text-primary">{value}</div>
            <div className="mt-2 text-sm text-base-content/50">{note}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="rounded-3xl border border-base-300 bg-base-100/80 p-5 shadow-lg shadow-black/10">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Difficulty breakdown</h2>
              <p className="text-sm text-base-content/60">
                Completion and attempts by difficulty.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {(["easy", "medium", "hard"] as const).map((difficulty) => {
              const item = stats.byDifficulty[difficulty];
              const styles = difficultyClass(difficulty);

              return (
                <div
                  key={difficulty}
                  className={`rounded-2xl border p-4 ${styles.panel}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className={`font-bold capitalize ${styles.text}`}>{difficulty}</h3>
                    <span className="text-sm font-semibold text-base-content/60">
                      {item.completed}/{item.total}
                    </span>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-base-300">
                    <div
                      className={`h-2 rounded-full ${styles.bar}`}
                      style={{ width: progressWidth(item.completed, item.total) }}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-base-content/50">Attempted</div>
                      <div className="font-semibold">{item.attempted}</div>
                    </div>
                    <div>
                      <div className="text-base-content/50">Catalog time</div>
                      <div className="font-semibold">{item.estimatedMinutes}m</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-base-300 bg-base-100/80 p-5 shadow-lg shadow-black/10">
          <h2 className="text-xl font-bold">Attempt quality</h2>
          <p className="mt-1 text-sm text-base-content/60">
            Accepted attempts and average successful runtime.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Accepted</span>
                <span>{stats.attempts.successRate}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-base-300">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${stats.attempts.successRate}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-base-300 bg-base-200/50 p-4">
                <div className="text-sm text-base-content/60">Attempts</div>
                <div className="mt-2 text-2xl font-bold">{stats.attempts.totalAttempts}</div>
              </div>
              <div className="rounded-2xl border border-base-300 bg-base-200/50 p-4">
                <div className="text-sm text-base-content/60">Avg accepted</div>
                <div className="mt-2 text-2xl font-bold">
                  {formatDuration(stats.attempts.averageSuccessfulDurationSeconds)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(32rem,1.15fr)]">
        <div className="rounded-3xl border border-base-300 bg-base-100/80 p-4 shadow-lg shadow-black/10">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Pattern coverage</h2>
              <p className="text-sm text-base-content/60">
                Compact view of high-volume pattern groups.
              </p>
            </div>
            <span className="text-sm font-semibold text-base-content/50">
              Showing {topPatterns.length} of {stats.byPattern.length}
            </span>
          </div>

          <div className="space-y-2">
            {topPatterns.map((pattern) => (
              <div key={pattern.pattern} className="rounded-xl border border-base-300 bg-base-200/40 p-3">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_4rem] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="truncate text-sm font-semibold">{pattern.pattern}</h3>
                      <span className="shrink-0 text-xs font-semibold text-base-content/60">
                        {pattern.completed}/{pattern.total}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-base-300">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: `${pattern.completionRate}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-right text-sm font-bold text-primary">
                    {pattern.completionRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-base-300 bg-base-100/80 p-5 shadow-lg shadow-black/10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Consistency</h2>
              <p className="mt-1 text-sm text-base-content/60">
                Attempts by active day. Accepted attempts are highlighted inside each bar.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-right">
              <div className="rounded-2xl border border-base-300 bg-base-200/50 px-4 py-3">
                <div className="text-xs text-base-content/50">Active days</div>
                <div className="text-2xl font-bold text-primary">{stats.consistency.activeDays}</div>
              </div>
              <div className="rounded-2xl border border-base-300 bg-base-200/50 px-4 py-3">
                <div className="text-xs text-base-content/50">Best day</div>
                <div className="text-2xl font-bold text-primary">{stats.consistency.maxAttemptsInDay}</div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {consistencyDays.length > 0 ? (
              <div className="flex h-56 items-end gap-2 overflow-x-auto rounded-2xl border border-base-300 bg-base-200/40 px-4 pb-4 pt-6">
                {consistencyDays.map((day) => {
                  const barHeight = progressWidth(
                    day.attempts,
                    stats.consistency.maxAttemptsInDay,
                  );
                  const acceptedHeight = progressWidth(day.accepted, Math.max(day.attempts, 1));

                  return (
                    <div key={day.date} className="flex min-w-14 flex-1 flex-col items-center gap-2">
                      <div className="relative flex h-36 w-full max-w-10 items-end rounded-full bg-base-300">
                        <div
                          className="relative w-full overflow-hidden rounded-full bg-primary/70"
                          style={{ height: barHeight }}
                          title={`${day.attempts} attempts on ${day.date}`}
                        >
                          {day.accepted > 0 ? (
                            <div
                              className="absolute bottom-0 left-0 w-full bg-success"
                              style={{ height: acceptedHeight }}
                            />
                          ) : null}
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-base-content/70">
                        {day.attempts}
                      </div>
                      <div className="whitespace-nowrap text-[0.7rem] text-base-content/50">
                        {formatDayLabel(day.date)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-base-300 bg-base-200/40 p-4 text-sm text-base-content/60">
                No attempt history yet.
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="rounded-3xl border border-base-300 bg-base-100/80 p-5 shadow-lg shadow-black/10">
          <h2 className="text-xl font-bold">Recent attempts</h2>
          <p className="mt-1 text-sm text-base-content/60">
            Latest saved attempt events.
          </p>

          <div className="mt-5 space-y-3">
            {stats.recentAttempts.length > 0 ? (
              stats.recentAttempts.map((attempt) => (
                <div
                  key={attempt.attemptId}
                  className="rounded-2xl border border-base-300 bg-base-200/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold leading-snug">
                        {attempt.problemTitle}
                      </div>
                      <div className="mt-1 text-xs text-base-content/50">
                        {formatDate(attempt.endedAt)} · {formatDuration(attempt.durationSeconds)}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        attempt.isSuccessful
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {attempt.isSuccessful ? "Accepted" : "Review"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-base-300 bg-base-200/40 p-4 text-sm text-base-content/60">
                No attempts recorded yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
