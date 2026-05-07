import dailyTrackData from "@/data/leetcode/daily-track.json";
import type { LeetcodeProblemProgressRow } from "@/lib/leetcode/types";

export type DailyTrackTaskRole = "warmup" | "core" | "stretch";

export type DailyTrackTask = {
  slot: number;
  role: DailyTrackTaskRole;
  problemId: string;
};

export type DailyTrackDay = {
  day: number;
  focus: {
    pattern: string;
    subPattern: string;
    label: string;
  };
  estimatedMinutes: number;
  tasks: DailyTrackTask[];
};

export type DailyTrack = {
  version: 2;
  generatedFrom: string;
  days: DailyTrackDay[];
};

export type DailyTrackTaskStatus = "completed" | "in-progress" | "not-started";

export type DailyTrackProblemTask = DailyTrackTask & {
  label: string;
  status: DailyTrackTaskStatus;
  problem: LeetcodeProblemProgressRow;
};

export function getDailyTrack(): DailyTrack {
  return dailyTrackData as DailyTrack;
}

export function selectDailyTrackDay(
  track: DailyTrack,
  today: Date,
  startedAt: Date | null,
) {
  if (track.days.length === 0) {
    throw new Error("Daily track must contain at least one day.");
  }

  if (startedAt === null) {
    return track.days[0];
  }

  const dayStart = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const startDay = Date.UTC(
    startedAt.getFullYear(),
    startedAt.getMonth(),
    startedAt.getDate(),
  );
  const dayIndex = Math.max(0, Math.floor((dayStart - startDay) / 86_400_000));

  return track.days[dayIndex % track.days.length];
}

export function getDailyTrackProblemTasks(
  day: DailyTrackDay,
  problemsById: Map<string, LeetcodeProblemProgressRow>,
): DailyTrackProblemTask[] {
  return day.tasks.map((task) => {
    const problem = problemsById.get(task.problemId);

    if (!problem) {
      throw new Error(`Daily track references unknown problem ${task.problemId}.`);
    }

    return {
      ...task,
      label: `Task ${task.slot}`,
      status: problem.isCompleted
        ? "completed"
        : problem.attemptCount > 0
          ? "in-progress"
          : "not-started",
      problem,
    };
  });
}
