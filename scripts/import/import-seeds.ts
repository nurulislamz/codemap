import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  type LeetcodeSeed,
  parseLeetcodeSeed,
  parseRoadmapSeed,
  type RoadmapSeed,
  parseSystemDesignSeed,
  type SystemDesignSeed,
} from "../../src/features/content/seed-parser";
import type { Database } from "../../src/server/supabase/types";

type ServiceRoleClient = SupabaseClient<Database>;
type ParsedSeedInput = {
  leetcode: LeetcodeSeed;
  roadmap: RoadmapSeed;
  systemDesign: SystemDesignSeed;
};
type SummaryInput = {
  leetcode: { patterns: unknown[]; subpatterns: unknown[]; problems: unknown[] };
  roadmap: { roadmap: unknown; topics: unknown[]; resources: unknown[] };
  systemDesign: { topics: unknown[]; prompts: unknown[] };
};

export interface ImportSummary {
  leetcodePatterns: number;
  leetcodeSubpatterns: number;
  leetcodeProblems: number;
  roadmapTopics: number;
  roadmapResources: number;
  systemDesignTopics: number;
  systemDesignPrompts: number;
}

export function buildImportSummary(input: SummaryInput): ImportSummary {
  return {
    leetcodePatterns: input.leetcode.patterns.length,
    leetcodeSubpatterns: input.leetcode.subpatterns.length,
    leetcodeProblems: input.leetcode.problems.length,
    roadmapTopics: input.roadmap.topics.length,
    roadmapResources: input.roadmap.resources.length,
    systemDesignTopics: input.systemDesign.topics.length,
    systemDesignPrompts: input.systemDesign.prompts.length,
  };
}

async function readSeedInput(root: string): Promise<ParsedSeedInput> {
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

async function getIdBySlug(
  supabase: ServiceRoleClient,
  table: keyof Database["public"]["Tables"],
  slug: string,
  context: string,
): Promise<string> {
  const { data, error } = await supabase.from(table).select("id").eq("slug", slug).single();

  if (error) {
    throw new Error(`Could not resolve ${table} slug "${slug}" while importing ${context}: ${error.message}`);
  }

  const id = data?.id;
  if (typeof id !== "string") {
    throw new Error(`Could not resolve ${table} slug "${slug}" while importing ${context}: missing id`);
  }

  return id;
}

async function upsertBySlug(
  supabase: ServiceRoleClient,
  table: keyof Database["public"]["Tables"],
  row: Record<string, unknown>,
): Promise<void> {
  await supabase.from(table).upsert(row, { onConflict: "slug" }).throwOnError();
}

async function importLeetcode(supabase: ServiceRoleClient, seed: LeetcodeSeed): Promise<void> {
  const patternIds = new Map<string, string>();
  const subpatternIds = new Map<string, string>();

  for (const pattern of seed.patterns) {
    await upsertBySlug(supabase, "leetcode_patterns", {
      slug: pattern.slug,
      name: pattern.name,
      description: pattern.description,
      display_order: pattern.displayOrder,
    });
    patternIds.set(
      pattern.slug,
      await getIdBySlug(supabase, "leetcode_patterns", pattern.slug, `pattern ${pattern.slug}`),
    );
  }

  for (const subpattern of seed.subpatterns) {
    const patternId = patternIds.get(subpattern.patternSlug);
    if (!patternId) {
      throw new Error(
        `Could not resolve parent leetcode pattern slug "${subpattern.patternSlug}" for subpattern "${subpattern.slug}"`,
      );
    }

    await upsertBySlug(supabase, "leetcode_subpatterns", {
      pattern_id: patternId,
      slug: subpattern.slug,
      name: subpattern.name,
      description: subpattern.description,
      display_order: subpattern.displayOrder,
    });
    subpatternIds.set(
      subpattern.slug,
      await getIdBySlug(
        supabase,
        "leetcode_subpatterns",
        subpattern.slug,
        `subpattern ${subpattern.slug}`,
      ),
    );
  }

  for (const problem of seed.problems) {
    const subpatternId = subpatternIds.get(problem.subpatternSlug);
    if (!subpatternId) {
      throw new Error(
        `Could not resolve parent leetcode subpattern slug "${problem.subpatternSlug}" for problem "${problem.slug}"`,
      );
    }

    await upsertBySlug(supabase, "leetcode_problems", {
      subpattern_id: subpatternId,
      slug: problem.slug,
      title: problem.title,
      source_url: problem.sourceUrl,
      difficulty: problem.difficulty,
      estimated_minutes: problem.estimatedMinutes,
      tags: problem.tags,
    });
  }
}

async function importRoadmap(supabase: ServiceRoleClient, seed: RoadmapSeed): Promise<void> {
  await upsertBySlug(supabase, "roadmaps", {
    slug: seed.roadmap.slug,
    title: seed.roadmap.title,
    source_url: seed.roadmap.sourceUrl,
    description: seed.roadmap.description,
  });

  const roadmapId = await getIdBySlug(
    supabase,
    "roadmaps",
    seed.roadmap.slug,
    `roadmap ${seed.roadmap.slug}`,
  );
  const topicIds = new Map<string, string>();

  for (const topic of seed.topics) {
    await upsertBySlug(supabase, "roadmap_topics", {
      roadmap_id: roadmapId,
      parent_topic_id: null,
      slug: topic.slug,
      title: topic.title,
      description: topic.description,
      source_url: topic.sourceUrl,
      display_order: topic.displayOrder,
    });
    topicIds.set(
      topic.slug,
      await getIdBySlug(supabase, "roadmap_topics", topic.slug, `roadmap topic ${topic.slug}`),
    );
  }

  for (const topic of seed.topics) {
    const topicId = topicIds.get(topic.slug);
    if (!topicId) {
      throw new Error(`Could not resolve roadmap topic slug "${topic.slug}" while assigning parents`);
    }

    const parentTopicId = topic.parentSlug ? topicIds.get(topic.parentSlug) : null;
    if (topic.parentSlug && !parentTopicId) {
      throw new Error(
        `Could not resolve parent roadmap topic slug "${topic.parentSlug}" for topic "${topic.slug}"`,
      );
    }

    await upsertBySlug(supabase, "roadmap_topics", {
      roadmap_id: roadmapId,
      parent_topic_id: parentTopicId,
      slug: topic.slug,
      title: topic.title,
      description: topic.description,
      source_url: topic.sourceUrl,
      display_order: topic.displayOrder,
    });
  }

  for (const topicId of topicIds.values()) {
    await supabase.from("roadmap_resources").delete().eq("topic_id", topicId).throwOnError();
  }

  for (const resource of seed.resources) {
    const topicId = topicIds.get(resource.topicSlug);
    if (!topicId) {
      throw new Error(
        `Could not resolve parent roadmap topic slug "${resource.topicSlug}" for resource "${resource.title}"`,
      );
    }

    await supabase
      .from("roadmap_resources")
      .insert({
        topic_id: topicId,
        title: resource.title,
        url: resource.url,
        resource_type: resource.resourceType,
        summary: resource.summary,
      })
      .throwOnError();
  }
}

async function importSystemDesign(
  supabase: ServiceRoleClient,
  seed: SystemDesignSeed,
): Promise<void> {
  const topicIds = new Map<string, string>();

  for (const topic of seed.topics) {
    await upsertBySlug(supabase, "system_design_topics", {
      slug: topic.slug,
      title: topic.title,
      description: topic.description,
      concept_tags: topic.conceptTags,
    });
    topicIds.set(
      topic.slug,
      await getIdBySlug(
        supabase,
        "system_design_topics",
        topic.slug,
        `system design topic ${topic.slug}`,
      ),
    );
  }

  for (const prompt of seed.prompts) {
    const topicId = topicIds.get(prompt.topicSlug);
    if (!topicId) {
      throw new Error(
        `Could not resolve parent system design topic slug "${prompt.topicSlug}" for prompt "${prompt.slug}"`,
      );
    }

    await upsertBySlug(supabase, "system_design_prompts", {
      topic_id: topicId,
      slug: prompt.slug,
      title: prompt.title,
      prompt_text: prompt.promptText,
      difficulty: prompt.difficulty,
      source_url: prompt.sourceUrl,
      expected_concepts: prompt.expectedConcepts,
    });
  }
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const input = await readSeedInput(process.cwd());
  const summary = buildImportSummary(input);

  if (!dryRun) {
    const { createSupabaseServiceRoleClient } = await import(
      "../../src/server/supabase/service-role"
    );
    const supabase = createSupabaseServiceRoleClient();

    await importLeetcode(supabase, input.leetcode);
    await importRoadmap(supabase, input.roadmap);
    await importSystemDesign(supabase, input.systemDesign);
  }

  console.log(JSON.stringify(summary, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
