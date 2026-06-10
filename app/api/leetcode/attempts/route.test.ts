import { describe, expect, it, vi } from "vitest";

const getRequestUserId = vi.hoisted(() => vi.fn());
const getLeetcodeAttemptRowsForUser = vi.hoisted(() => vi.fn());
const getSortedLeetcodeAttemptEventsForUser = vi.hoisted(() => vi.fn());
const toLeetcodeAttemptRows = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/identity", () => ({
  UnauthorizedError: class UnauthorizedError extends Error {},
  getRequestUserId,
}));

vi.mock("@/lib/leetcode/attempts", () => ({
  getLeetcodeAttemptRowsForUser,
  getSortedLeetcodeAttemptEventsForUser,
  toLeetcodeAttemptRows,
}));

describe("GET /api/leetcode/attempts", () => {
  it("returns all attempts in one request when no problemId is given", async () => {
    getRequestUserId.mockResolvedValue("firebase-user-123");
    const events = [{ attemptId: "a1", problemId: "102" }];
    const rows = [{ attemptId: "a1", problemId: "102" }];
    getSortedLeetcodeAttemptEventsForUser.mockResolvedValue(events);
    toLeetcodeAttemptRows.mockReturnValue(rows);
    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost/api/leetcode/attempts"));

    expect(response.status).toBe(200);
    expect(getSortedLeetcodeAttemptEventsForUser).toHaveBeenCalledWith(
      "firebase-user-123",
    );
    expect(await response.json()).toEqual({ attempts: rows });
  });

  it("returns attempts for the requested problem", async () => {
    getRequestUserId.mockResolvedValue("firebase-user-123");
    getLeetcodeAttemptRowsForUser.mockResolvedValue([
      {
        attemptId: "attempt-1",
        problemId: "102",
        problemTitle: "Binary Tree Level Order Traversal",
        isSuccessful: true,
        startedAt: "2026-05-06T10:00:00.000Z",
        endedAt: "2026-05-06T10:12:00.000Z",
        durationSeconds: 720,
        notes: "Used queue",
        failureReason: null,
      },
    ]);
    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/api/leetcode/attempts?problemId=102"),
    );

    expect(response.status).toBe(200);
    expect(getLeetcodeAttemptRowsForUser).toHaveBeenCalledWith(
      "firebase-user-123",
      "102",
    );
    expect(await response.json()).toEqual({
      attempts: [
        expect.objectContaining({
          attemptId: "attempt-1",
          problemId: "102",
        }),
      ],
    });
  });
});
