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

export type DailyTrackProblemList = {
  version: 2;
  generatedFrom: string;
  problemIds: string[];
};

export type LeetcodeTrackData = DailyTrack | DailyTrackProblemList;

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
  problemsById: Map<string, LeetcodeProblemProgressRow>,
) {
  if (track.days.length === 0) {
    throw new Error("Daily track must contain at least one day.");
  }

  for (const day of track.days) {
    const tasks = getDailyTrackProblemTasks(day, problemsById);
    const hasIncompleteTask = tasks.some((task) => task.status !== "completed");

    if (hasIncompleteTask) {
      return day;
    }
  }

  return track.days[track.days.length - 1];
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
