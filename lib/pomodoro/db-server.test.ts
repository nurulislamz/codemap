import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const collection = vi.hoisted(() => vi.fn());
const userDoc = vi.hoisted(() => vi.fn());
const sessionDoc = vi.hoisted(() => vi.fn());
const setSession = vi.hoisted(() => vi.fn());
const getSessions = vi.hoisted(() => vi.fn());
const orderBy = vi.hoisted(() => vi.fn());
const limit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/firebase/firestore", () => ({
  getFirestoreDb: () => ({
    collection,
  }),
}));

const validSession = {
  sessionId: "11111111-1111-4111-8111-111111111111",
  startedAt: "2026-06-12T09:00:00.000Z",
  endedAt: "2026-06-12T09:25:00.000Z",
  durationSeconds: 1500,
  targetMinutes: 25,
  completed: true,
};

describe("pomodoro db-server", () => {
  beforeEach(() => {
    const sessionsCollection = {
      doc: sessionDoc,
      orderBy,
    };
    const userDocument = {
      collection: vi.fn(() => sessionsCollection),
    };
    const usersCollection = {
      doc: userDoc,
    };

    collection.mockReturnValue(usersCollection);
    userDoc.mockReturnValue(userDocument);
    sessionDoc.mockReturnValue({ set: setSession });
    orderBy.mockReturnValue({ limit });
    limit.mockReturnValue({ get: getSessions });
    getSessions.mockResolvedValue({ docs: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("writes sessions under the supplied authenticated user id", async () => {
    const { createPomodoroSession } = await import("./db-server");

    await createPomodoroSession(validSession, "firebase-user-123");

    expect(collection).toHaveBeenCalledWith("users");
    expect(userDoc).toHaveBeenCalledWith("firebase-user-123");
    expect(sessionDoc).toHaveBeenCalledWith(validSession.sessionId);
    expect(setSession).toHaveBeenCalledWith(validSession);
  });

  it("rejects sessions with a non-positive duration", async () => {
    const { createPomodoroSession } = await import("./db-server");

    await expect(
      createPomodoroSession(
        { ...validSession, durationSeconds: 0 },
        "firebase-user-123",
      ),
    ).rejects.toThrow();
    expect(setSession).not.toHaveBeenCalled();
  });

  it("reads recent sessions newest first and drops malformed documents", async () => {
    getSessions.mockResolvedValue({
      docs: [
        { data: () => validSession },
        { data: () => ({ malformed: "row" }) },
      ],
    });
    const { getRecentPomodoroSessions } = await import("./db-server");

    const sessions = await getRecentPomodoroSessions("firebase-user-123");

    expect(orderBy).toHaveBeenCalledWith("startedAt", "desc");
    expect(limit).toHaveBeenCalledWith(20);
    expect(sessions).toEqual([validSession]);
  });
});
