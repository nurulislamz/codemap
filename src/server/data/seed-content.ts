import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  parseLeetcodeSeed,
  parseRoadmapSeed,
  parseSystemDesignSeed,
  type LeetcodeSeed,
  type RoadmapSeed,
  type SystemDesignSeed,
} from "@/features/content/seed-parser";

type SeedCache = {
  leetcode: LeetcodeSeed;
  roadmap: RoadmapSeed;
  systemDesign: SystemDesignSeed;
};

let seedCache: SeedCache | null = null;

async function loadSeedsFromDisk(): Promise<SeedCache> {
  const root = process.cwd();
  const [leetcodeMarkdown, roadmapMarkdown, systemDesignMarkdown] = await Promise.all([
    readFile(join(root, "content/seeds/leetcode-patterns.md"), "utf8"),
    readFile(join(root, "content/seeds/backend-roadmaps.md"), "utf8"),
    readFile(join(root, "content/seeds/system-design-prompts.md"), "utf8"),
  ]);

  return {
    leetcode: parseLeetcodeSeed(leetcodeMarkdown),
    roadmap: parseRoadmapSeed(roadmapMarkdown),
    systemDesign: parseSystemDesignSeed(systemDesignMarkdown),
  };
}

export async function getSeedContent(): Promise<SeedCache> {
  if (!seedCache) {
    seedCache = await loadSeedsFromDisk();
  }

  return seedCache;
}

