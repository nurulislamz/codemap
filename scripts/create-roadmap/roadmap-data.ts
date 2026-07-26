import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

type RawRoadmap = {
  title: string;
  summary: string;
  topics: Record<
    string,
    {
      title: string;
      summary: string;
      type: string;
      order: number;
    }
  >;
};

export type RoadmapTopicTarget = {
  roadmapSlug: string;
  roadmapTitle: string;
  topicSlug: string | null;
  topicTitle: string | null;
  topicSummary: string | null;
};

export async function getRoadmapTarget({
  roadmapSlug,
  topicSlug,
}: {
  roadmapSlug: string;
  topicSlug: string | null;
}): Promise<RoadmapTopicTarget> {
  const roadmap = await readRoadmap(roadmapSlug);
  const topic = topicSlug ? roadmap.topics[topicSlug] : null;

  if (topicSlug && !topic) {
    throw new Error(`Unknown topic "${topicSlug}" for roadmap "${roadmapSlug}".`);
  }

  return {
    roadmapSlug,
    roadmapTitle: roadmap.title,
    topicSlug,
    topicTitle: topic?.title ?? null,
    topicSummary: topic?.summary ?? null,
  };
}

export async function listTopicSlugs(roadmapSlug: string): Promise<string[]> {
  const roadmap = await readRoadmap(roadmapSlug);

  return Object.entries(roadmap.topics)
    .filter(([, topic]) => topic.type === "topic")
    .sort(([, first], [, second]) => first.order - second.order)
    .map(([slug]) => slug);
}

async function readRoadmap(roadmapSlug: string): Promise<RawRoadmap> {
  const dataDir = join(process.cwd(), "data", "roadmap");
  const files = await readdir(dataDir);
  const fileName = files.find((file) => file === `${roadmapSlug}-roadmap.json`);

  if (!fileName) {
    throw new Error(`Unknown roadmap "${roadmapSlug}".`);
  }

  return JSON.parse(await readFile(join(dataDir, fileName), "utf8")) as RawRoadmap;
}
