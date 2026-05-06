import { describe, expect, it, vi } from "vitest";
const getAllLeetCodeAttempts = vi.hoisted(() => vi.fn());
const getLeetCodeAttempts = vi.hoisted(() => vi.fn());

vi.mock("./db-server", () => ({
  getAllLeetCodeAttempts,
  getLeetCodeAttempts,
}));

describe("leetcode attempts", () => {
  it("reads attempt rows only for the supplied problem", async () => {
    getLeetCodeAttempts.mockResolvedValue([
      {
        attemptId: "attempt-1",
        problemId: "102",
        isSuccessful: true,
        startedAt: "2026-05-06T10:00:00.000Z",
        endedAt: "2026-05-06T10:12:00.000Z",
        durationSeconds: 720,
        language: null,
        failureReason: null,
        notes: "Used queue",
      },
    ]);

    const { getLeetcodeAttemptRowsForUser } = await import("./attempts");

    const rows = await getLeetcodeAttemptRowsForUser("firebase-user-123", "102");

    expect(getAllLeetCodeAttempts).not.toHaveBeenCalled();
    expect(getLeetCodeAttempts).toHaveBeenCalledWith("102", "firebase-user-123");
    expect(rows).toEqual([
      expect.objectContaining({
        attemptId: "attempt-1",
        problemId: "102",
        problemTitle: "102",
      }),
    ]);
  });
});
