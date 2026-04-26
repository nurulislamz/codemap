import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import { buildImportSummary } from "./import-seeds";

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
  it("prints a dry-run summary without requiring Supabase secrets", async () => {
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
  });
});
