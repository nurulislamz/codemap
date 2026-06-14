import { describe, expect, it } from "vitest";

import {
  buildFocusByDay,
  buildPomodoroStats,
  buildRecentFocusDays,
} from "./pomodoro-stats";

const session = {
  sessionId: "11111111-1111-4111-8111-111111111111",
  startedAt: "2026-06-12T09:00:00.000Z",
  endedAt: "2026-06-12T09:25:00.000Z",
  durationSeconds: 1500,
  targetMinutes: 25,
  completed: true,
};

describe("buildPomodoroStats", () => {
  it("summarizes totals, completion rate, and average session length", () => {
    const stats = buildPomodoroStats([
      session,
      {
        ...session,
        sessionId: "22222222-2222-4222-8222-222222222222",
        durationSeconds: 500,
        completed: false,
      },
    ]);

    expect(stats).toEqual({
      totalSessions: 2,
      completedSessions: 1,
      completionRate: 50,
      totalFocusSeconds: 2000,
      averageSessionSeconds: 1000,
    });
  });

  it("returns zeroed stats with a null average when there are no sessions", () => {
    expect(buildPomodoroStats([])).toEqual({
      totalSessions: 0,
      completedSessions: 0,
      completionRate: 0,
      totalFocusSeconds: 0,
      averageSessionSeconds: null,
    });
  });

  it("groups focus time by day sorted by date", () => {
    const days = buildFocusByDay([
      session,
      { ...session, sessionId: "2", startedAt: "2026-06-12T15:00:00.000Z" },
      {
        ...session,
        sessionId: "3",
        startedAt: "2026-06-10T09:00:00.000Z",
        durationSeconds: 600,
      },
    ]);

    expect(days).toEqual([
      { date: "2026-06-10", focusSeconds: 600, sessions: 1 },
      { date: "2026-06-12", focusSeconds: 3000, sessions: 2 },
    ]);
  });

  it("pads recent focus days with zeroed entries up to the end date", () => {
    const days = buildRecentFocusDays(
      [{ date: "2026-06-10", focusSeconds: 600, sessions: 1 }],
      3,
      new Date("2026-06-12T12:00:00.000Z"),
    );

    expect(days).toEqual([
      { date: "2026-06-10", focusSeconds: 600, sessions: 1 },
      { date: "2026-06-11", focusSeconds: 0, sessions: 0 },
      { date: "2026-06-12", focusSeconds: 0, sessions: 0 },
    ]);
  });
});
