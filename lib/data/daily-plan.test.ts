import { describe, expect, it } from "vitest";

import { toDailyEmailHtml } from "./daily-plan";

describe("toDailyEmailHtml", () => {
  it("renders links for all daily plan tracks", () => {
    const html = toDailyEmailHtml({
      appBaseUrl: "http://localhost:3000",
      items: [
        { track: "leetcode", title: "Two Sum II", href: "/leetcode" },
        { track: "roadmap", title: "Internet", href: "/roadmap" },
        { track: "system_design", title: "Design TinyURL", href: "/system-design" },
      ],
    });

    expect(html).toContain("Two Sum II");
    expect(html).toContain("http://localhost:3000/leetcode");
    expect(html).toContain("Design TinyURL");
  });
});
