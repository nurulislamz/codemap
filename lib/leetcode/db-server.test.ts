import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const setAttempt = vi.hoisted(() => vi.fn());
const getAttempts = vi.hoisted(() => vi.fn());
const collection = vi.hoisted(() => vi.fn());
const userDoc = vi.hoisted(() => vi.fn());
const attemptDoc = vi.hoisted(() => vi.fn());
const where = vi.hoisted(() => vi.fn());
const orderBy = vi.hoisted(() => vi.fn());
const limit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/firebase/firestore", () => ({
  getFirestoreDb: () => ({
    collection,
  }),
}));

describe("leetcode-db-server", () => {
  beforeEach(() => {
    const attemptsCollection = {
      doc: attemptDoc,
      get: getAttempts,
      where,
      orderBy,
    };
    const userDocument = {
      collection: vi.fn(() => attemptsCollection),
    };
    const usersCollection = {
      doc: userDoc,
    };

    collection.mockReturnValue(usersCollection);
    userDoc.mockReturnValue(userDocument);
    attemptDoc.mockReturnValue({ set: setAttempt });
    where.mockReturnValue(attemptsCollection);
    orderBy.mockReturnValue({ limit });
    limit.mockReturnValue({ get: getAttempts });
    getAttempts.mockResolvedValue({ docs: [], empty: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("writes attempts under the supplied authenticated user id", async () => {
    const { createLeetCodeAttempt } = await import("./db-server");

    await createLeetCodeAttempt({
      attemptId: "11111111-1111-4111-8111-111111111111",
      problemId: "102",
      isSuccessful: true,
      startedAt: "2026-05-02T10:00:00.000Z",
      endedAt: "2026-05-02T10:12:00.000Z",
      durationSeconds: 720,
      language: "TypeScript",
      failureReason: null,
      notes: "Used queue",
    }, "firebase-user-123");

    expect(collection).toHaveBeenCalledWith("users");
    expect(userDoc).toHaveBeenCalledWith("firebase-user-123");
    expect(attemptDoc).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111");
    expect(setAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        problemId: "102",
        language: "TypeScript",
        notes: "Used queue",
      }),
    );
  });

  it("defaults language to null for attempts saved without one", async () => {
    const { createLeetCodeAttempt } = await import("./db-server");

    const attempt = await createLeetCodeAttempt({
      attemptId: "22222222-2222-4222-8222-222222222222",
      problemId: "102",
      isSuccessful: true,
      startedAt: "2026-05-02T10:00:00.000Z",
      endedAt: "2026-05-02T10:12:00.000Z",
      durationSeconds: 720,
      failureReason: null,
      notes: null,
    }, "firebase-user-123");

    expect(attempt.language).toBeNull();
    expect(setAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ language: null }),
    );
  });

  it("reads attempts from the supplied authenticated user id", async () => {
    const { getAllLeetCodeAttempts } = await import("./db-server");

    await getAllLeetCodeAttempts("firebase-user-456");

    expect(collection).toHaveBeenCalledWith("users");
    expect(userDoc).toHaveBeenCalledWith("firebase-user-456");
    expect(getAttempts).toHaveBeenCalled();
  });
});
