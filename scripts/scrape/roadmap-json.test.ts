import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import {
  buildRoadmapGraphFromRoadmapData,
  buildRoadmapJsonFromManifest,
  parseMarkdownPage,
} from "./roadmap-json";

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

describe("buildRoadmapGraphFromRoadmapData", () => {
  it("builds an ordered topic graph with topic summaries and resource buckets", () => {
    const result = buildRoadmapGraphFromRoadmapData(
      {
        slug: "backend",
        title: { page: "Backend Developer", card: "Backend" },
        description: "Step by step guide to becoming a modern backend developer in @currentYear@",
        nodes: [
          {
            id: "root",
            type: "title",
            position: { x: 0, y: 0 },
            data: { label: "Backend" },
          },
          {
            id: "intro",
            type: "topic",
            position: { x: 10, y: 100 },
            data: { label: "Introduction" },
          },
          {
            id: "connector",
            type: "section",
            position: { x: 10, y: 150 },
            data: {},
          },
          {
            id: "go",
            type: "subtopic",
            position: { x: 20, y: 200 },
            data: { label: "Go" },
          },
        ],
        edges: [
          { source: "root", target: "intro", data: { edgeStyle: "solid" } },
          { source: "intro", target: "connector", data: { edgeStyle: "solid" } },
          { source: "connector", target: "go", data: { edgeStyle: "dashed" } },
        ],
      },
      {
        topicContentByNodeId: {
          intro: {
            description:
              "# Backend Development\n\nBackend development focuses on server-side logic and data handling.",
            resources: [
              {
                type: "article",
                title: "What is backend?",
                url: "https://example.com/backend",
              },
              {
                type: "video",
                title: "Backend overview",
                url: "https://youtube.com/watch?v=backend",
              },
            ],
          },
          go: {
            description: "# Go\n\nGo is a compiled language used for backend services.",
            resources: [
              {
                type: "official",
                title: "Go docs",
                url: "https://go.dev/doc/",
              },
            ],
          },
        },
      },
    );

    expect(result.backend.summary).toBe(
      "Step by step guide to becoming a modern backend developer in 2026",
    );
    expect(result.backend.order).toEqual(["introduction", "go"]);
    expect(result.backend.edges).toEqual([
      { from: "backend", to: "introduction", style: "solid" },
      { from: "introduction", to: "go", style: "solid" },
    ]);
    expect(result.backend.topics.introduction).toMatchObject({
      title: "Introduction",
      summary: "Backend development focuses on server-side logic and data handling.",
      video: {
        title: "Backend overview",
        url: "https://youtube.com/watch?v=backend",
      },
      children: ["go"],
    });
    expect(result.backend.topics.introduction.articles).toEqual([
      {
        type: "article",
        title: "What is backend?",
        url: "https://example.com/backend",
      },
    ]);
    expect(result.backend.topics.go.parents).toEqual(["introduction"]);
  });

  it("uses visual group headings for edge-less roadmap nodes without overriding explicit edges", () => {
    const result = buildRoadmapGraphFromRoadmapData(
      {
        slug: "backend",
        title: { page: "Backend Developer" },
        description: "Backend roadmap",
        nodes: [
          {
            id: "root",
            type: "title",
            position: { x: 0, y: 0 },
            data: { label: "Backend" },
          },
          {
            id: "nosql",
            type: "topic",
            position: { x: -300, y: 100 },
            data: { label: "NoSQL Databases" },
          },
          {
            id: "intro",
            type: "topic",
            position: { x: -300, y: 70 },
            data: { label: "Introduction" },
          },
          {
            id: "pick-language",
            type: "topic",
            position: { x: -700, y: 250 },
            data: { label: "Pick a Backend Language" },
          },
          {
            id: "go",
            type: "subtopic",
            position: { x: -580, y: 10 },
            data: { label: "Go" },
          },
          {
            id: "python",
            type: "subtopic",
            position: { x: -700, y: 60 },
            data: { label: "Python" },
          },
          {
            id: "document-dbs",
            type: "paragraph",
            position: { x: -540, y: 180 },
            data: { label: "Document DBs" },
          },
          {
            id: "key-value",
            type: "paragraph",
            position: { x: -360, y: 180 },
            data: { label: "Key-Value" },
          },
          {
            id: "mongodb",
            type: "subtopic",
            position: { x: -540, y: 240 },
            data: { label: "MongoDB" },
          },
          {
            id: "couchdb",
            type: "subtopic",
            position: { x: -540, y: 293 },
            data: { label: "CouchDB" },
          },
          {
            id: "redis",
            type: "subtopic",
            position: { x: -360, y: 240 },
            data: { label: "Redis" },
          },
          {
            id: "hashing",
            type: "label",
            position: { x: 100, y: 400 },
            data: { label: "Hashing Algorithms" },
          },
          {
            id: "md5",
            type: "subtopic",
            position: { x: 50, y: 450 },
            data: { label: "MD5" },
          },
          {
            id: "bcrypt",
            type: "subtopic",
            position: { x: 180, y: 450 },
            data: { label: "bcrypt" },
          },
          {
            id: "relational",
            type: "topic",
            position: { x: -300, y: 520 },
            data: { label: "Relational Databases" },
          },
          {
            id: "postgresql",
            type: "subtopic",
            position: { x: -540, y: 560 },
            data: { label: "PostgreSQL" },
          },
        ],
        edges: [
          { source: "root", target: "nosql", data: { edgeStyle: "solid" } },
          { source: "root", target: "intro", data: { edgeStyle: "solid" } },
          { source: "relational", target: "postgresql", data: { edgeStyle: "dashed" } },
        ],
      },
      {
        topicContentByNodeId: {
          go: { description: "Backend language.", resources: [{ type: "article", title: "Go", url: "https://example.com/go" }] },
          python: { description: "Backend language.", resources: [{ type: "article", title: "Python", url: "https://example.com/python" }] },
          mongodb: { description: "Document database.", resources: [{ type: "article", title: "MongoDB", url: "https://example.com/mongodb" }] },
          couchdb: { description: "Document database.", resources: [{ type: "article", title: "CouchDB", url: "https://example.com/couchdb" }] },
          redis: { description: "Key-value database.", resources: [{ type: "article", title: "Redis", url: "https://example.com/redis" }] },
          md5: { description: "Hashing algorithm.", resources: [{ type: "article", title: "MD5", url: "https://example.com/md5" }] },
          bcrypt: { description: "Password hashing.", resources: [{ type: "article", title: "bcrypt", url: "https://example.com/bcrypt" }] },
          postgresql: { description: "Relational database.", resources: [{ type: "article", title: "PostgreSQL", url: "https://example.com/postgresql" }] },
        },
      },
    );

    expect(result.backend.topics.pickABackendLanguage.children).toEqual(["go", "python"]);
    expect(result.backend.topics.go.parents).toEqual(["pickABackendLanguage"]);
    expect(result.backend.topics.python.parents).toEqual(["pickABackendLanguage"]);
    expect(result.backend.topics.documentDbs.children).toEqual(["mongodb", "couchdb"]);
    expect(result.backend.topics.mongodb.parents).toEqual(["documentDbs"]);
    expect(result.backend.topics.couchdb.parents).toEqual(["documentDbs"]);
    expect(result.backend.topics.keyValue.children).toEqual(["redis"]);
    expect(result.backend.topics.redis.parents).toEqual(["keyValue"]);
    expect(result.backend.topics.hashingAlgorithms.children).toEqual(["md5", "bcrypt"]);
    expect(result.backend.topics.md5.parents).toEqual(["hashingAlgorithms"]);
    expect(result.backend.topics.bcrypt.parents).toEqual(["hashingAlgorithms"]);
    expect(result.backend.topics.postgresql.parents).toEqual(["relationalDatabases"]);
  });
});
