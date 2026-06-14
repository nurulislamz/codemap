import { afterEach, describe, expect, it, vi } from "vitest";

const getRequestUserId = vi.hoisted(() => vi.fn());
const createPomodoroSession = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/identity", () => ({
  getRequestUserId,
}));

vi.mock("./db-server", () => ({
  createPomodoroSession,
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

describe("savePomodoroSession", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("derives the duration and saves the session for the authenticated user", async () => {
    getRequestUserId.mockResolvedValue("firebase-user-123");
    createPomodoroSession.mockResolvedValue(undefined);
    const { savePomodoroSession } = await import("./actions");

    await savePomodoroSession({
      startedAt: "2026-06-12T09:00:00.000Z",
      endedAt: "2026-06-12T09:25:00.000Z",
      targetMinutes: 25,
      completed: true,
      idToken: "id-token",
    });

    expect(createPomodoroSession).toHaveBeenCalledWith(
      expect.objectContaining({
        startedAt: "2026-06-12T09:00:00.000Z",
        endedAt: "2026-06-12T09:25:00.000Z",
        durationSeconds: 1500,
        targetMinutes: 25,
        completed: true,
      }),
      "firebase-user-123",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/pomodoro");
  });

  it("clamps the duration to at least one second", async () => {
    getRequestUserId.mockResolvedValue("firebase-user-123");
    createPomodoroSession.mockResolvedValue(undefined);
    const { savePomodoroSession } = await import("./actions");

    await savePomodoroSession({
      startedAt: "2026-06-12T09:00:00.000Z",
      endedAt: "2026-06-12T09:00:00.000Z",
      targetMinutes: 25,
      completed: false,
    });

    expect(createPomodoroSession).toHaveBeenCalledWith(
      expect.objectContaining({ durationSeconds: 1 }),
      "firebase-user-123",
    );
  });
});
