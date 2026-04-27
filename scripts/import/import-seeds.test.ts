import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import {
  buildImportSummary,
  importRoadmap,
  importSystemDesign,
} from "./import-seeds";

const execFileAsync = promisify(execFile);

describe("buildImportSummary", () => {
  it("counts parsed seed entities before database writes", () => {
    const summary = buildImportSummary({
      leetcode: { patterns: [{}], subpatterns: [{}], problems: [{}, {}] },
      roadmap: { roadmap: {}, topics: [{}, {}], resources: [{}] },
      systemDesign: { topics: [{}], prompts: [{}] },
    });

    expect(summary).toEqual({
      leetcodePatterns: 1,
      leetcodeSubpatterns: 1,
      leetcodeProblems: 2,
      roadmapTopics: 2,
      roadmapResources: 1,
      systemDesignTopics: 1,
      systemDesignPrompts: 1,
    });
  });
});

describe("import-seeds CLI", () => {
  it(
    "prints a dry-run summary without requiring Supabase secrets",
    async () => {
    const { stdout } = await execFileAsync(
      "corepack",
      ["pnpm", "tsx", "scripts/import/import-seeds.ts", "--dry-run"],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NEXT_PUBLIC_SUPABASE_URL: "",
          SUPABASE_SERVICE_ROLE_KEY: "",
        },
      },
    );

    const summary = JSON.parse(stdout);

    expect(summary).toMatchObject({
      leetcodePatterns: expect.any(Number),
      leetcodeSubpatterns: expect.any(Number),
      leetcodeProblems: expect.any(Number),
      roadmapTopics: expect.any(Number),
      roadmapResources: expect.any(Number),
      systemDesignTopics: expect.any(Number),
      systemDesignPrompts: expect.any(Number),
    });
    expect(summary.leetcodePatterns).toBeGreaterThan(0);
    expect(summary.roadmapTopics).toBeGreaterThan(0);
    expect(summary.systemDesignPrompts).toBeGreaterThan(0);
    },
    20000,
  );

  it(
    "non-dry setup reaches environment validation without importing server-only",
    async () => {
    try {
      await execFileAsync("corepack", ["pnpm", "tsx", "scripts/import/import-seeds.ts"], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NEXT_PUBLIC_SUPABASE_URL: "",
          SUPABASE_SERVICE_ROLE_KEY: "",
        },
      });
      throw new Error("Expected non-dry import without env to fail");
    } catch (error) {
      const stderr = error instanceof Error && "stderr" in error ? String(error.stderr) : "";
      expect(stderr).not.toContain("server-only");
      expect(stderr).toContain("NEXT_PUBLIC_SUPABASE_URL");
    }
    },
    20000,
  );
});

describe("seed write path", () => {
  it("fails with a helpful error when a roadmap resource parent topic is missing", async () => {
    const supabase = createFakeSupabase({
      roadmaps: { backend: "roadmap-1" },
    });

    await expect(
      importRoadmap(supabase as never, {
        roadmap: {
          slug: "backend",
          title: "Backend Roadmap",
          sourceUrl: "https://roadmap.sh/backend",
          description: "",
        },
        topics: [],
        resources: [
          {
            topicSlug: "missing-topic",
            title: "Missing parent",
            url: "https://example.com",
            resourceType: "article",
            summary: "Missing parent topic.",
          },
        ],
      }),
    ).rejects.toThrow(
      'Could not resolve parent roadmap topic slug "missing-topic" for resource "Missing parent"',
    );
  });

  it("upserts roadmap resources by topic and URL without deleting existing rows", async () => {
    const supabase = createFakeSupabase({
      roadmaps: { backend: "roadmap-1" },
      roadmap_topics: { internet: "topic-1" },
    });

    await importRoadmap(supabase as never, {
      roadmap: {
        slug: "backend",
        title: "Backend Roadmap",
        sourceUrl: "https://roadmap.sh/backend",
        description: "",
      },
      topics: [
        {
          slug: "internet",
          parentSlug: null,
          title: "Internet",
          description: "Networking basics.",
          sourceUrl: null,
          displayOrder: 0,
        },
      ],
      resources: [
        {
          topicSlug: "internet",
          title: "DNS",
          url: "https://example.com/dns",
          resourceType: "article",
          summary: "DNS overview.",
        },
      ],
    });

    expect(supabase.calls).not.toContainEqual(
      expect.objectContaining({ method: "delete", table: "roadmap_resources" }),
    );
    expect(supabase.calls).toContainEqual({
      method: "upsert",
      table: "roadmap_resources",
      row: {
        topic_id: "topic-1",
        title: "DNS",
        url: "https://example.com/dns",
        resource_type: "article",
        summary: "DNS overview.",
      },
      options: { onConflict: "topic_id,url" },
    });
  });

  it("fails with a helpful error when a system design prompt parent topic is missing", async () => {
    const supabase = createFakeSupabase();

    await expect(
      importSystemDesign(supabase as never, {
        topics: [],
        prompts: [
          {
            topicSlug: "missing-topic",
            slug: "design-missing",
            title: "Design Missing",
            promptText: "Design a missing parent lookup.",
            difficulty: "medium",
            sourceUrl: null,
            expectedConcepts: [],
          },
        ],
      }),
    ).rejects.toThrow(
      'Could not resolve parent system design topic slug "missing-topic" for prompt "design-missing"',
    );
  });
});

describe("seed import schema support", () => {
  it("defines stable resource keys for idempotent resource upserts", async () => {
    const migration = await readFile("supabase/migrations/0001_initial_schema.sql", "utf8");

    expect(migration).toContain("unique (topic_id, url)");
    expect(migration).toContain("system_design_resources_topic_url_key");
    expect(migration).toContain("system_design_resources_prompt_url_key");
  });
});

function createFakeSupabase(initialIds: Record<string, Record<string, string>> = {}) {
  const calls: Array<Record<string, unknown>> = [];
  const idsByTable = new Map(
    Object.entries(initialIds).map(([table, ids]) => [table, new Map(Object.entries(ids))]),
  );

  return {
    calls,
    from(table: string) {
      return {
        upsert(row: Record<string, unknown>, options?: Record<string, unknown>) {
          calls.push({ method: "upsert", table, row, options });
          if ("slug" in row && typeof row.slug === "string") {
            const tableIds = idsByTable.get(table) ?? new Map<string, string>();
            if (!idsByTable.has(table)) idsByTable.set(table, tableIds);
            tableIds.set(row.slug, tableIds.get(row.slug) ?? `${table}-${row.slug}`);
          }

          return { throwOnError: async () => undefined };
        },
        insert(row: Record<string, unknown>) {
          calls.push({ method: "insert", table, row });
          return { throwOnError: async () => undefined };
        },
        delete() {
          calls.push({ method: "delete", table });
          return {
            eq(column: string, value: unknown) {
              calls.push({ method: "eq", table, column, value });
              return { throwOnError: async () => undefined };
            },
          };
        },
        select(columns: string) {
          calls.push({ method: "select", table, columns });
          return {
            eq(column: string, value: unknown) {
              calls.push({ method: "eq", table, column, value });
              return {
                single: async () => {
                  const id = typeof value === "string" ? idsByTable.get(table)?.get(value) : undefined;
                  return id
                    ? { data: { id }, error: null }
                    : {
                        data: null,
                        error: { message: `No ${table} row for ${String(value)}` },
                      };
                },
              };
            },
          };
        },
      };
    },
  };
}
