import { afterEach, describe, expect, it, vi } from "vitest";

const getRequestUserId = vi.hoisted(() => vi.fn());
const getPomodoroTasks = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/identity", () => ({
  UnauthorizedError: class UnauthorizedError extends Error {},
  getRequestUserId,
}));

vi.mock("@/lib/pomodoro/task-db-server", () => ({
  getPomodoroTasks,
}));

describe("GET /api/pomodoro/tasks", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns tasks for the authenticated user", async () => {
    getRequestUserId.mockResolvedValue("firebase-user-123");
    const tasks = [{ id: "t1", text: "Ship it", done: false }];
    getPomodoroTasks.mockResolvedValue(tasks);
    const { GET } = await import("./route");

    const response = await GET();

    expect(response.status).toBe(200);
    expect(getPomodoroTasks).toHaveBeenCalledWith("firebase-user-123");
    expect(await response.json()).toEqual({ tasks });
  });

  it("returns 401 when the request is unauthorized", async () => {
    const { UnauthorizedError } = await import("@/lib/auth/identity");
    getRequestUserId.mockRejectedValue(new UnauthorizedError());
    const { GET } = await import("./route");

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ tasks: [], error: "Unauthorized" });
  });
});
