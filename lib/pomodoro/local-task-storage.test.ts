import { afterEach, describe, expect, it } from "vitest";

import {
  getLocalPomodoroTasks,
  saveLocalPomodoroTasks,
  type PomodoroTask,
} from "./local-task-storage";

const task: PomodoroTask = {
  id: "11111111-1111-4111-8111-111111111111",
  text: "Write the report",
  done: false,
  createdAt: "2026-06-12T09:00:00.000Z",
};

describe("local pomodoro task storage", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("round-trips the saved task list", () => {
    saveLocalPomodoroTasks([
      task,
      { ...task, id: "22222222-2222-4222-8222-222222222222", done: true },
    ]);

    const tasks = getLocalPomodoroTasks();

    expect(tasks).toHaveLength(2);
    expect(tasks[1]?.done).toBe(true);
  });

  it("returns an empty list when storage is empty or corrupt", () => {
    expect(getLocalPomodoroTasks()).toEqual([]);

    window.localStorage.setItem("codemap.pomodoroTasks.v1", "{corrupt");

    expect(getLocalPomodoroTasks()).toEqual([]);
  });
});
