import "server-only";

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type RoadmapSummary = {
  slug: string;
  title: string;
  summary: string;
  url: string;
  topicCount: number;
};

export type RoadmapResource = {
  type: string;
  title: string;
  url: string;
};

export type RoadmapTopic = {
  slug: string;
  title: string;
  summary: string;
  order: number;
  type: string;
  parents: string[];
  children: string[];
  video: RoadmapResource | null;
  articles: RoadmapResource[];
  resourceCount: number;
};

export type RoadmapDetail = RoadmapSummary & {
  topics: RoadmapTopic[];
  topicGroups: Array<{
    topic: RoadmapTopic;
    children: RoadmapTopic[];
  }>;
  edges: Array<{
    from: string;
    to: string;
    style: string;
  }>;
};

type RawRoadmapData = Record<string, RawRoadmap>;

type RawRoadmap = {
  title: string;
  summary: string;
  url: string;
  order: string[];
  topics: Record<string, RawRoadmapTopic>;
  edges: Array<{
    from: string;
    to: string;
    style: string;
  }>;
};

type RawRoadmapTopic = {
  title: string;
  sourceId: string;
  type: string;
  order: number;
  summary: string;
  video: {
    title: string;
    url: string;
  } | null;
  articles: RoadmapResource[];
  parents: string[];
  children: string[];
};

const rawRoadmaps = loadRoadmaps();

export function getRoadmapCatalog(): RoadmapSummary[] {
  return Object.entries(rawRoadmaps).map(([slug, roadmap]) => {
    const topicCount = roadmap.order.filter((topicSlug) => {
      const topic = roadmap.topics[topicSlug];
      if (!topic) return false;
      const resourceCount = (topic.video ? 1 : 0) + topic.articles.length;
      return topic.type === "topic" || resourceCount > 0;
    }).length;

    return {
      slug,
      title: roadmap.title,
      summary: roadmap.summary,
      url: roadmap.url,
      topicCount,
    };
  });
}

export function getRoadmapBySlug(slug: string): RoadmapDetail | null {
  const roadmap = rawRoadmaps[slug];

  if (!roadmap) {
    return null;
  }

  const topics = roadmap.order
    .map((topicSlug) => {
      const topic = roadmap.topics[topicSlug];

      if (!topic) {
        return null;
      }

      const resourceCount = (topic.video ? 1 : 0) + topic.articles.length;

      return {
        slug: topicSlug,
        title: topic.title,
        summary: topic.summary,
        order: topic.order,
        type: topic.type,
        parents: topic.parents,
        children: topic.children,
        video: topic.video,
        articles: topic.articles.map((article) => ({
          ...article,
          url: normalizeRoadmapResourceUrl(article.url),
        })),
        resourceCount,
      };
    })
    .filter((topic): topic is RoadmapTopic => topic !== null);

  const filteredTopics = topics.filter(
    (topic) => topic.type === "topic" || topic.resourceCount > 0,
  );
  const topicSlugSet = new Set(filteredTopics.map((topic) => topic.slug));
  const orderedTopics = filteredTopics.map((topic) => ({
    ...topic,
    parents: topic.parents.filter((parent) => topicSlugSet.has(parent)),
    children: topic.children.filter((child) => topicSlugSet.has(child)),
  }));
  const groupedChildSlugs = new Set(
    orderedTopics.flatMap((topic) =>
      topic.type === "topic"
        ? orderedTopics
            .filter((child) => child.parents.includes(topic.slug))
            .map((child) => child.slug)
        : [],
    ),
  );

  return {
    slug,
    title: roadmap.title,
    summary: roadmap.summary,
    url: roadmap.url,
    topicCount: filteredTopics.length,
    topics: orderedTopics,
    topicGroups: orderedTopics
      .filter((topic) => topic.type === "topic" || !groupedChildSlugs.has(topic.slug))
      .map((topic) => ({
        topic,
        children:
          topic.type === "topic"
            ? orderedTopics.filter((child) => child.parents.includes(topic.slug))
            : [],
      })),
    edges: roadmap.edges.filter(
      (edge) => topicSlugSet.has(edge.from) && topicSlugSet.has(edge.to),
    ),
  };
}

function loadRoadmaps(): RawRoadmapData {
  const roadmapDir = join(process.cwd(), "data", "roadmap");
  const roadmaps: RawRoadmapData = {};

  for (const fileName of readdirSync(roadmapDir).sort()) {
    if (!fileName.endsWith("-roadmap.json")) continue;

    const slug = fileName.replace(/-roadmap\.json$/, "");
    const filePath = join(roadmapDir, fileName);
    roadmaps[slug] = JSON.parse(readFileSync(filePath, "utf8")) as RawRoadmap;
  }

  return roadmaps;
}

function normalizeRoadmapResourceUrl(url: string) {
  if (url.startsWith("/")) {
    return `https://roadmap.sh${url}`;
  }

  return url;
}
