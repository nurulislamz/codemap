import "server-only";

export interface RoadmapSeed {
  roadmap: {
    slug: string;
    title: string;
    sourceUrl: string;
    description: string;
  };
  topics: Array<{
    slug: string;
    parentSlug: string | null;
    title: string;
    description: string;
    sourceUrl: string | null;
    displayOrder: number;
  }>;
  resources: Array<{
    topicSlug: string;
    title: string;
    url: string;
    resourceType: string;
    summary: string;
  }>;
}

export interface SystemDesignSeed {
  topics: Array<{
    slug: string;
    title: string;
    description: string;
    conceptTags: string[];
  }>;
  prompts: Array<{
    topicSlug: string;
    slug: string;
    title: string;
    promptText: string;
    difficulty: "easy" | "medium" | "hard";
    sourceUrl: string | null;
    expectedConcepts: string[];
  }>;
}

type SeedCache = {
  roadmap: RoadmapSeed;
  systemDesign: SystemDesignSeed;
};

const seedContent: SeedCache = {
  roadmap: {
    roadmap: {
      slug: "backend",
      title: "Backend Roadmap",
      sourceUrl: "https://roadmap.sh/backend",
      description: "Backend engineering roadmap.",
    },
    topics: [
      {
        slug: "internet",
        parentSlug: null,
        title: "Internet",
        description: "Understand DNS, HTTP, browsers, hosting, and how clients reach servers.",
        sourceUrl: "https://roadmap.sh/backend",
        displayOrder: 0,
      },
      {
        slug: "http",
        parentSlug: null,
        title: "HTTP",
        description: "Understand methods, status codes, headers, caching, cookies, and TLS.",
        sourceUrl: "https://roadmap.sh/backend",
        displayOrder: 1,
      },
    ],
    resources: [
      {
        topicSlug: "internet",
        title: "How does the internet work?",
        url: "https://roadmap.sh/guides/what-is-internet",
        resourceType: "article",
        summary: "High-level overview of networks, packets, DNS, and protocols.",
      },
      {
        topicSlug: "http",
        title: "HTTP in one picture",
        url: "https://roadmap.sh/guides/http-in-one-picture",
        resourceType: "article",
        summary: "Visual summary of request and response fundamentals.",
      },
    ],
  },
  systemDesign: {
    topics: [
      {
        slug: "fundamentals",
        title: "Fundamentals",
        description: "Core system design concepts for backend interview practice.",
        conceptTags: ["scalability", "availability", "data-modeling"],
      },
    ],
    prompts: [
      {
        topicSlug: "fundamentals",
        slug: "design-url-shortener",
        title: "Design a URL shortener",
        promptText:
          "Design a URL shortening service that supports creating short links, redirecting users, and tracking basic usage.",
        difficulty: "medium",
        sourceUrl: null,
        expectedConcepts: ["hashing", "redirects", "database-indexes", "rate-limits"],
      },
    ],
  },
};

export async function getSeedContent(): Promise<SeedCache> {
  return seedContent;
}
