import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import { buildRoadmapJsonFromManifest, parseMarkdownPage } from "./roadmap-json";

let tempDir: string | null = null;

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

describe("parseMarkdownPage", () => {
  it("extracts title, description, section topics, and non-social resources", () => {
    const result = parseMarkdownPage(
      `# Frontend Basics
Short line

Frontend basics explain the browser, network, HTML, CSS, and JavaScript foundations.

[Share](https://twitter.com/share)
[MDN HTML](https://developer.mozilla.org/en-US/docs/Web/HTML)

## How does Internet work?
The internet moves data between clients and servers using packets, DNS, and protocols.

[DNS guide](https://roadmap.sh/guides/dns-in-one-picture)
`,
      "Fallback",
    );

    expect(result.title).toBe("Frontend Basics");
    expect(result.description).toBe(
      "Frontend basics explain the browser, network, HTML, CSS, and JavaScript foundations.",
    );
    expect(result.resources).toEqual([
      {
        title: "MDN HTML",
        url: "https://developer.mozilla.org/en-US/docs/Web/HTML",
      },
      {
        title: "DNS guide",
        url: "https://roadmap.sh/guides/dns-in-one-picture",
      },
    ]);
    expect(result.sections[0]).toMatchObject({
      title: "How does Internet work?",
      description:
        "The internet moves data between clients and servers using packets, DNS, and protocols.",
    });
  });
});

describe("buildRoadmapJsonFromManifest", () => {
  it("builds a nested object from manifest parent relationships", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "roadmap-json-"));
    const rootPath = join(tempDir, "frontend.md");
    const childPath = join(tempDir, "internet.md");
    const manifestPath = join(tempDir, "roadmap-tree.json");

    await writeFile(
      rootPath,
      "# Frontend Basics\nFrontend foundations for browser-based apps.\n",
      "utf8",
    );
    await writeFile(
      childPath,
      "# How does Internet work?\nNetworks move requests between clients and servers.\n",
      "utf8",
    );
    await writeFile(
      manifestPath,
      JSON.stringify([
        {
          url: "https://roadmap.sh/frontend",
          depth: 0,
          parent: null,
          title: "Frontend Basics",
          status: "ok",
          path: rootPath,
        },
        {
          url: "https://roadmap.sh/frontend/how-does-internet-work",
          depth: 1,
          parent: "https://roadmap.sh/frontend",
          title: "How does Internet work?",
          status: "ok",
          path: childPath,
        },
      ]),
      "utf8",
    );

    const result = await buildRoadmapJsonFromManifest(manifestPath, {
      rootKey: "frontEndBasics",
    });

    await expect(readFile(rootPath, "utf8")).resolves.toContain("Frontend");
    expect(result.frontEndBasics.title).toBe("Frontend Basics");
    expect(result.frontEndBasics.topics.howDoesInternetWork).toMatchObject({
      title: "How does Internet work?",
      slug: "howDoesInternetWork",
      description: "Networks move requests between clients and servers.",
    });
  });
});
