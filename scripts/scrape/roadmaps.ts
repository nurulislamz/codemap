import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { buildRoadmapGraphFromRoadmapData } from "./roadmap-json";

type RoadmapGraph = {
  title: string;
  summary: string;
  url: string;
  order: string[];
  topics: Record<
    string,
    {
      title: string;
      sourceId: string;
      type: string;
      order: number;
      summary: string;
      video: { title: string; url: string } | null;
      articles: Array<{ type: string; title: string; url: string }>;
      parents: string[];
      children: string[];
    }
  >;
  edges: Array<{ from: string; to: string; style: string }>;
};

type CliArgs = {
  output: string;
  slugs: string[];
  skipTopicContent: boolean;
};

function parseCliArgs(args: string[]): CliArgs {
  let output = "data/roadmap/backend-roadmap.json";
  let skipTopicContent = false;
  const slugs: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--output") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--output requires a value.");
      }
      output = value;
      index += 1;
      continue;
    }

    if (arg === "--skip-topic-content") {
      skipTopicContent = true;
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    slugs.push(arg);
  }

  if (slugs.length === 0) {
    slugs.push(
      "backend",
      "frontend",
      "devops",
      "full-stack",
      "system-design",
      "software-architect",
    );
  }

  return { output, slugs, skipTopicContent };
}

function removeEmptyButtonTopics(roadmap: RoadmapGraph): RoadmapGraph {
  const toRemove = new Set<string>();

  for (const slug of roadmap.order) {
    const topic = roadmap.topics[slug];
    if (!topic) continue;

    const hasResources = Boolean(topic.video) || topic.articles.length > 0;

    // roadmap.sh sometimes includes dummy leaf/button nodes with no resources.
    // We keep section headings (type === "topic") so the UI can still group concepts.
    if (topic.type !== "topic" && !hasResources) {
      toRemove.add(slug);
    }
  }

  if (toRemove.size === 0) {
    return roadmap;
  }

  const topics: RoadmapGraph["topics"] = {};
  for (const slug of roadmap.order) {
    if (toRemove.has(slug)) continue;
    const topic = roadmap.topics[slug];
    if (!topic) continue;

    topics[slug] = {
      ...topic,
      parents: topic.parents.filter((parent) => !toRemove.has(parent)),
      children: topic.children.filter((child) => !toRemove.has(child)),
    };
  }

  const order = roadmap.order.filter((slug) => !toRemove.has(slug));
  const edges = roadmap.edges.filter(
    (edge) => !toRemove.has(edge.from) && !toRemove.has(edge.to),
  );

  return { ...roadmap, order, topics, edges };
}

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));
  const outputPath = resolve(args.output);

  const roadmaps: Record<string, unknown> = {};

  for (const slug of args.slugs) {
    const response = await fetch(`https://roadmap.sh/${slug}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${slug}.json: ${response.status} ${response.statusText}`);
    }

    const roadmapData = (await response.json()) as {
      slug?: string;
      nodes?: Array<{ id?: string; type?: string }>;
    };

    const nodeIds = Array.isArray(roadmapData.nodes)
      ? roadmapData.nodes
          .filter((node) => node?.type !== "title" && typeof node?.id === "string")
          .map((node) => node.id as string)
      : [];

    const topicContentByNodeId: Record<string, { description?: string; resources?: unknown[] }> = {};

    if (!args.skipTopicContent && nodeIds.length > 0) {
      const queue = [...nodeIds];
      const concurrency = 8;
      let completed = 0;

      async function worker(): Promise<void> {
        while (queue.length > 0) {
          const nodeId = queue.shift();
          if (!nodeId) return;

          const contentResponse = await fetch(`https://roadmap.sh/${slug}/${nodeId}.json`);
          if (contentResponse.ok) {
            const json = (await contentResponse.json()) as {
              description?: string;
              resources?: unknown[];
            };
            topicContentByNodeId[nodeId] = {
              description: json.description ?? "",
              resources: Array.isArray(json.resources) ? json.resources : [],
            };
          }

          completed += 1;
          if (completed % 25 === 0 || completed === nodeIds.length) {
            console.log(`[${slug}] topic-content ${completed}/${nodeIds.length}`);
          }
        }
      }

      await Promise.all(Array.from({ length: concurrency }, () => worker()));
    }

    const result = buildRoadmapGraphFromRoadmapData(roadmapData as never, {
      rootKey: slug,
      topicContentByNodeId: args.skipTopicContent ? {} : (topicContentByNodeId as never),
    });

    const roadmap = (result as Record<string, unknown>)[slug] as RoadmapGraph;
    roadmaps[slug] = removeEmptyButtonTopics(roadmap);
    console.log(`[roadmap] ${slug}`);
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(roadmaps, null, 2)}\n`, "utf8");
  console.log(`[json] ${outputPath}`);
}

if (process.argv[1]?.endsWith("roadmaps.ts")) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
