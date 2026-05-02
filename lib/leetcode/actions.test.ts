import { afterEach, describe, expect, it, vi } from "vitest";

const getRequestUserId = vi.hoisted(() => vi.fn());
const createLeetCodeAttempt = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/identity", () => ({
  getRequestUserId,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("./db-server", () => ({
  createLeetCodeAttempt,
}));

describe("saveLeetCodeAttempt", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("passes the verified request user id into the LeetCode attempt write", async () => {
    getRequestUserId.mockResolvedValueOnce("verified-user-123");

    const { saveLeetCodeAttempt } = await import("./actions");

    await saveLeetCodeAttempt({
      problemId: "102",
      status: "completed",
      startedAt: "2026-05-02T10:00:00.000Z",
      endedAt: "2026-05-02T10:12:00.000Z",
      notes: "Used queue",
      idToken: "verified-token",
    });

    expect(getRequestUserId).toHaveBeenCalledWith(
      expect.objectContaining({ idToken: "verified-token" }),
    );
    expect(createLeetCodeAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        problemId: "102",
        isSuccessful: true,
        durationSeconds: 720,
        notes: "Used queue",
      }),
      "verified-user-123",
    );
  });
});
