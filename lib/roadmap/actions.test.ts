import { afterEach, describe, expect, it, vi } from "vitest";

const getRequestUserId = vi.hoisted(() => vi.fn());
const saveRoadmapTopicProgress = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/identity", () => ({
  getRequestUserId,
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("./progress", () => ({
  saveRoadmapTopicProgress,
}));

describe("saveRoadmapProgress", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("uses the verified request user id and revalidates the roadmap page", async () => {
    getRequestUserId.mockResolvedValueOnce("verified-user-123");
    const { saveRoadmapProgress } = await import("./actions");

    await saveRoadmapProgress({
      idToken: "verified-token",
      roadmapSlug: "backend",
      topicSlug: "whatIsHttp",
      learned: true,
      notes: "HTTP notes",
      links: ["https://developer.mozilla.org/en-US/docs/Web/HTTP"],
    });

    expect(getRequestUserId).toHaveBeenCalledWith(
      expect.objectContaining({ idToken: "verified-token" }),
    );
    expect(saveRoadmapTopicProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        roadmapSlug: "backend",
        topicSlug: "whatIsHttp",
        learned: true,
      }),
      "verified-user-123",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/roadmap");
  });
});
