import "server-only";

import rawRoadmaps from "@/data/roadmap/backend-roadmap.json";

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

export function getRoadmapCatalog(): RoadmapSummary[] {
  return Object.entries(rawRoadmaps as RawRoadmapData).map(([slug, roadmap]) => ({
    slug,
    title: roadmap.title,
    summary: roadmap.summary,
    url: roadmap.url,
    topicCount: roadmap.order.length,
  }));
}

export function getRoadmapBySlug(slug: string): RoadmapDetail | null {
  const roadmap = (rawRoadmaps as RawRoadmapData)[slug];

  if (!roadmap) {
    return null;
  }

  const topics = roadmap.order
    .map((topicSlug) => {
      const topic = roadmap.topics[topicSlug];

      if (!topic) {
        return null;
      }

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
        resourceCount: (topic.video ? 1 : 0) + topic.articles.length,
      };
    })
    .filter((topic): topic is RoadmapTopic => topic !== null);

  return {
    slug,
    title: roadmap.title,
    summary: roadmap.summary,
    url: roadmap.url,
    topicCount: topics.length,
    topics,
    edges: roadmap.edges,
  };
}

export function getRoadmapTopic(
  roadmap: RoadmapDetail,
  topicSlug: string | null | undefined,
): RoadmapTopic {
  return (
    roadmap.topics.find((topic) => topic.slug === topicSlug) ??
    roadmap.topics[0]
  );
}

function normalizeRoadmapResourceUrl(url: string) {
  if (url.startsWith("/")) {
    return `https://roadmap.sh${url}`;
  }

  return url;
}
