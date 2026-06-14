import { afterEach, describe, expect, it } from "vitest";

import {
  getLocalPomodoroSessions,
  saveLocalPomodoroSession,
} from "./local-session-storage";

const session = {
  sessionId: "11111111-1111-4111-8111-111111111111",
  startedAt: "2026-06-12T09:00:00.000Z",
  endedAt: "2026-06-12T09:25:00.000Z",
  durationSeconds: 1500,
  targetMinutes: 25,
  completed: true,
};

describe("local pomodoro session storage", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("stores sessions newest first", () => {
    saveLocalPomodoroSession(session);
    saveLocalPomodoroSession({
      ...session,
      sessionId: "22222222-2222-4222-8222-222222222222",
    });

    const sessions = getLocalPomodoroSessions();

    expect(sessions).toHaveLength(2);
    expect(sessions[0]?.sessionId).toBe("22222222-2222-4222-8222-222222222222");
  });

  it("returns an empty list when storage is empty or corrupt", () => {
    expect(getLocalPomodoroSessions()).toEqual([]);

    window.localStorage.setItem("codemap.pomodoroSessions.v1", "{corrupt");

    expect(getLocalPomodoroSessions()).toEqual([]);
  });
});
