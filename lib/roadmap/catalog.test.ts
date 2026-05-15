import { describe, expect, it } from "vitest";

describe("roadmap catalog", () => {
  it("lists available roadmaps from the static roadmap data", async () => {
    const { getRoadmapCatalog } = await import("./catalog");

    const roadmaps = getRoadmapCatalog();

    expect(roadmaps.length).toBeGreaterThanOrEqual(6);
    expect(roadmaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: "backend",
          title: "Backend Developer",
          url: "https://roadmap.sh/backend",
        }),
        expect.objectContaining({
          slug: "frontend",
          url: "https://roadmap.sh/frontend",
        }),
        expect.objectContaining({
          slug: "devops",
          url: "https://roadmap.sh/devops",
        }),
        expect.objectContaining({
          slug: "system-design",
          url: "https://roadmap.sh/system-design",
        }),
      ]),
    );
  });

  it("keeps backend topics in roadmap order with resource counts", async () => {
    const { getRoadmapBySlug } = await import("./catalog");

    const roadmap = getRoadmapBySlug("backend");

    expect(roadmap?.topics.slice(0, 5).map((topic) => topic.slug)).toEqual([
      "introduction",
      "howDoesTheInternetWork",
      "whatIsHttp",
      "whatIsDomainName",
      "whatIsHosting",
    ]);
    expect(
      roadmap?.topics.find((topic) => topic.slug === "howDoesTheInternetWork"),
    ).toMatchObject({
      title: "How does the internet work?",
      resourceCount: 5,
    });
  });

  it("groups roadmap concepts by explicit parent relationships", async () => {
    const { getRoadmapBySlug } = await import("./catalog");

    const roadmap = getRoadmapBySlug("backend");
    const introduction = roadmap?.topicGroups.find(
      (group) => group.topic.slug === "introduction",
    );
    const javascript = roadmap?.topicGroups.find(
      (group) => group.topic.slug === "javascript",
    );

    expect(introduction?.children.map((topic) => topic.slug)).toEqual([
      "howDoesTheInternetWork",
      "whatIsHttp",
      "whatIsDomainName",
      "whatIsHosting",
      "dnsAndHowItWorks",
      "browsersAndHowTheyWork",
    ]);
    expect(introduction?.children.map((topic) => topic.slug)).not.toContain("javascript");
    expect(javascript).toMatchObject({
      topic: expect.objectContaining({ slug: "javascript", title: "JavaScript" }),
      children: [],
    });
  });
});
