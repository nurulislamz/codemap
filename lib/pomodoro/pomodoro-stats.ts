import type { PomodoroSession } from "@/lib/firebase/pomodoro";
import { fillRecentDays } from "@/lib/stats/recent-days";

export type PomodoroStats = {
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  totalFocusSeconds: number;
  averageSessionSeconds: number | null;
};

export function buildPomodoroStats(sessions: PomodoroSession[]): PomodoroStats {
  const completedSessions = sessions.filter((session) => session.completed);
  const totalFocusSeconds = sessions.reduce(
    (total, session) => total + session.durationSeconds,
    0,
  );

  return {
    totalSessions: sessions.length,
    completedSessions: completedSessions.length,
    completionRate: percentage(completedSessions.length, sessions.length),
    totalFocusSeconds,
    averageSessionSeconds:
      sessions.length === 0 ? null : Math.round(totalFocusSeconds / sessions.length),
  };
}

export type DailyFocusStats = {
  date: string;
  focusSeconds: number;
  sessions: number;
};

export function buildFocusByDay(sessions: PomodoroSession[]): DailyFocusStats[] {
  const byDate = new Map<string, DailyFocusStats>();

  for (const session of sessions) {
    const date = new Date(session.startedAt).toISOString().slice(0, 10);
    const current = byDate.get(date) ?? { date, focusSeconds: 0, sessions: 0 };

    byDate.set(date, {
      date,
      focusSeconds: current.focusSeconds + session.durationSeconds,
      sessions: current.sessions + 1,
    });
  }

  return Array.from(byDate.values()).toSorted((left, right) =>
    left.date.localeCompare(right.date),
  );
}

export function buildRecentFocusDays(
  days: DailyFocusStats[],
  count: number,
  endDate = new Date(),
): DailyFocusStats[] {
  return fillRecentDays(
    days,
    count,
    (date) => ({ date, focusSeconds: 0, sessions: 0 }),
    endDate,
  );
}

function percentage(part: number, whole: number): number {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 100);
}
