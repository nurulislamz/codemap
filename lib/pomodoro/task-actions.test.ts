import { afterEach, describe, expect, it, vi } from "vitest";

const getRequestUserId = vi.hoisted(() => vi.fn());
const replacePomodoroTasks = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/identity", () => ({
  getRequestUserId,
}));

vi.mock("./task-db-server", () => ({
  replacePomodoroTasks,
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

const task = {
  id: "11111111-1111-4111-8111-111111111111",
  text: "Write the report",
  done: false,
  createdAt: "2026-06-12T09:00:00.000Z",
};

describe("savePomodoroTasks", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("replaces the task list for the authenticated user", async () => {
    getRequestUserId.mockResolvedValue("firebase-user-123");
    replacePomodoroTasks.mockResolvedValue(undefined);
    const { savePomodoroTasks } = await import("./task-actions");

    await savePomodoroTasks({ tasks: [task], idToken: "id-token" });

    expect(getRequestUserId).toHaveBeenCalledWith({
      tasks: [task],
      idToken: "id-token",
    });
    expect(replacePomodoroTasks).toHaveBeenCalledWith([task], "firebase-user-123");
    expect(revalidatePath).toHaveBeenCalledWith("/pomodoro");
  });
});
