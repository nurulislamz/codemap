import { afterEach, describe, expect, it, vi } from "vitest";

const getRequestUserId = vi.hoisted(() => vi.fn());
const getRecentPomodoroSessions = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/identity", () => ({
  UnauthorizedError: class UnauthorizedError extends Error {},
  getRequestUserId,
}));

vi.mock("@/lib/pomodoro/db-server", () => ({
  getRecentPomodoroSessions,
}));

describe("GET /api/pomodoro/sessions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns recent sessions for the authenticated user", async () => {
    getRequestUserId.mockResolvedValue("firebase-user-123");
    const sessions = [{ sessionId: "s1", durationSeconds: 1500 }];
    getRecentPomodoroSessions.mockResolvedValue(sessions);
    const { GET } = await import("./route");

    const response = await GET();

    expect(response.status).toBe(200);
    expect(getRecentPomodoroSessions).toHaveBeenCalledWith("firebase-user-123");
    expect(await response.json()).toEqual({ sessions });
  });

  it("returns 401 when the request is unauthorized", async () => {
    const { UnauthorizedError } = await import("@/lib/auth/identity");
    getRequestUserId.mockRejectedValue(new UnauthorizedError());
    const { GET } = await import("./route");

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      sessions: [],
      error: "Unauthorized",
    });
  });
});
