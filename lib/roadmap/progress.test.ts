import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const collection = vi.hoisted(() => vi.fn());
const userDoc = vi.hoisted(() => vi.fn());
const progressDoc = vi.hoisted(() => vi.fn());
const setProgress = vi.hoisted(() => vi.fn());
const getProgress = vi.hoisted(() => vi.fn());

vi.mock("@/lib/firebase/firestore", () => ({
  getFirestoreDb: () => ({
    collection,
  }),
}));

describe("roadmap progress persistence", () => {
  beforeEach(() => {
    const progressCollection = {
      doc: progressDoc,
    };
    const userDocument = {
      collection: vi.fn(() => progressCollection),
    };
    const usersCollection = {
      doc: userDoc,
    };

    collection.mockReturnValue(usersCollection);
    userDoc.mockReturnValue(userDocument);
    progressDoc.mockReturnValue({
      get: getProgress,
      set: setProgress,
    });
    getProgress.mockResolvedValue({ exists: false });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("writes one progress document per user roadmap topic", async () => {
    const { saveRoadmapTopicProgress } = await import("./progress");

    await saveRoadmapTopicProgress(
      {
        roadmapSlug: "backend",
        topicSlug: "whatIsHttp",
        learned: true,
        notes: "Reviewed request and response basics",
        links: ["https://developer.mozilla.org/en-US/docs/Web/HTTP"],
      },
      "firebase-user-123",
    );

    expect(collection).toHaveBeenCalledWith("users");
    expect(userDoc).toHaveBeenCalledWith("firebase-user-123");
    expect(progressDoc).toHaveBeenCalledWith("backend__whatIsHttp");
    expect(setProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        roadmapSlug: "backend",
        topicSlug: "whatIsHttp",
        learned: true,
        notes: "Reviewed request and response basics",
        links: ["https://developer.mozilla.org/en-US/docs/Web/HTTP"],
      }),
      { merge: true },
    );
  });

  it("returns saved progress when a topic document exists", async () => {
    getProgress.mockResolvedValue({
      exists: true,
      data: () => ({
        roadmapSlug: "backend",
        topicSlug: "whatIsHttp",
        learned: true,
        notes: "HTTP notes",
        links: ["https://developer.mozilla.org/en-US/docs/Web/HTTP"],
      }),
    });
    const { getRoadmapTopicProgress } = await import("./progress");

    const progress = await getRoadmapTopicProgress(
      "firebase-user-123",
      "backend",
      "whatIsHttp",
    );

    expect(progress).toEqual({
      roadmapSlug: "backend",
      topicSlug: "whatIsHttp",
      learned: true,
      notes: "HTTP notes",
      links: ["https://developer.mozilla.org/en-US/docs/Web/HTTP"],
    });
  });
});
