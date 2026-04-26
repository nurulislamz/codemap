import { describe, expect, it } from "vitest";
import { buildDailyPlan } from "./scheduler";

describe("buildDailyPlan", () => {
  it("prioritizes weak unfinished LeetCode, next roadmap, system practice, and due flashcards", () => {
    const plan = buildDailyPlan({
      date: "2026-04-26",
      leetcode: [
        {
          id: "lc-1",
          title: "Two Sum II",
          status: "failed",
          confidence: "low",
          pattern: "two-pointers",
        },
        {
          id: "lc-2",
          title: "Longest Substring",
          status: "not_started",
          confidence: "medium",
          pattern: "sliding-window",
        },
      ],
      roadmap: [
        { id: "road-2", title: "APIs", status: "not_started", order: 2 },
        { id: "road-1", title: "Internet", status: "not_started", order: 1 },
      ],
      systemDesign: [
        { id: "sd-done", title: "Design Pastebin", status: "completed", kind: "reading" },
        { id: "sd-1", title: "Design TinyURL", status: "not_started", kind: "practice" },
      ],
      flashcards: [
        { id: "fc-later", title: "Cache invalidation", nextReviewAt: "2026-04-27T09:00:00Z" },
        { id: "fc-1", title: "DNS lookup steps", nextReviewAt: "2026-04-25T09:00:00Z" },
      ],
    });

    expect(plan).toEqual({
      date: "2026-04-26",
      items: [
        {
          track: "leetcode",
          targetId: "lc-1",
          title: "Two Sum II",
          scheduledOrder: 0,
        },
        {
          track: "roadmap",
          targetId: "road-1",
          title: "Internet",
          scheduledOrder: 1,
        },
        {
          track: "system_design",
          targetId: "sd-1",
          title: "Design TinyURL",
          scheduledOrder: 2,
        },
        {
          track: "flashcards",
          targetId: "fc-1",
          title: "DNS lookup steps",
          scheduledOrder: 3,
        },
      ],
    });
  });

  it("uses new LeetCode work only after weak unfinished work is unavailable", () => {
    const plan = buildDailyPlan({
      date: "2026-04-26",
      leetcode: [
        {
          id: "lc-done",
          title: "Two Sum II",
          status: "completed",
          confidence: "low",
          pattern: "two-pointers",
        },
        {
          id: "lc-new",
          title: "Longest Substring",
          status: "not_started",
          confidence: "high",
          pattern: "sliding-window",
        },
      ],
      roadmap: [],
      systemDesign: [],
      flashcards: [],
    });

    expect(plan.items).toEqual([
      {
        track: "leetcode",
        targetId: "lc-new",
        title: "Longest Substring",
        scheduledOrder: 0,
      },
    ]);
  });
});
