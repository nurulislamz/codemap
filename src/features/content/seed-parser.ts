type Difficulty = "easy" | "medium" | "hard";

export interface LeetcodeSeed {
  patterns: Array<{
    slug: string;
    name: string;
    description: string;
    displayOrder: number;
  }>;
  subpatterns: Array<{
    slug: string;
    patternSlug: string;
    name: string;
    description: string;
    displayOrder: number;
  }>;
  problems: Array<{
    slug: string;
    subpatternSlug: string;
    title: string;
    sourceUrl: string;
    difficulty: Difficulty;
    estimatedMinutes: number;
    tags: string[];
  }>;
}

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
    difficulty: Difficulty;
    sourceUrl: string | null;
    expectedConcepts: string[];
  }>;
}

interface Section {
  heading: string;
  body: string[];
  startLine: number;
}

function parseSections(markdown: string): Section[] {
  const lines = markdown.split(/\r?\n/);
  const sections: Section[] = [];
  let current: Section | null = null;

  lines.forEach((line, lineIndex) => {
    if (/^#{1,6}\s/.test(line)) {
      current = { heading: line.trim(), body: [], startLine: lineIndex + 1 };
      sections.push(current);
      return;
    }

    current?.body.push(line);
  });

  return sections;
}

function field(lines: string[], name: string): string | null {
  const normalizedName = name.toLowerCase();
  for (const line of lines) {
    const trimmed = line.trim();
    const separator = trimmed.indexOf(":");
    if (separator === -1) continue;

    const candidate = trimmed.slice(0, separator).toLowerCase();
    if (candidate === normalizedName) {
      return trimmed.slice(separator + 1).trim();
    }
  }

  return null;
}

function requiredField(lines: string[], name: string, context: string): string {
  const value = field(lines, name);
  if (!value) {
    if (context.startsWith("prompt ") && name.toLowerCase() === "slug") {
      throw new Error(`Missing prompt slug for ${context.slice("prompt ".length)}`);
    }

    throw new Error(`Missing ${name.toLowerCase()} for ${context}`);
  }

  return value;
}

function csv(value: string | null): string[] {
  return value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function parseDifficulty(value: string | null, context: string): Difficulty {
  if (value === "easy" || value === "medium" || value === "hard") {
    return value;
  }

  throw new Error(
    `Invalid difficulty for ${context}: ${value ?? "missing"} (expected easy, medium, or hard)`,
  );
}

function parseInteger(value: string, name: string, context: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name.toLowerCase()} for ${context}: ${value}`);
  }

  return parsed;
}

function titleFromHeading(heading: string, prefix: string): string {
  return heading.slice(prefix.length).trim();
}

function firstParagraph(lines: string[]): string {
  const paragraph: string[] = [];
  let hasStarted = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed && hasStarted) break;
    if (!trimmed || /^[A-Za-z ]+:/.test(trimmed)) continue;

    hasStarted = true;
    paragraph.push(trimmed);
  }

  return paragraph.join("\n").trim();
}

function listItemSections(lines: string[], marker: string): Array<{ title: string; lines: string[] }> {
  const items: Array<{ title: string; lines: string[] }> = [];
  let current: { title: string; lines: string[] } | null = null;
  const prefix = `- ${marker}:`;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(prefix)) {
      current = { title: trimmed.slice(prefix.length).trim(), lines: [] };
      items.push(current);
      continue;
    }

    if (current && (line.startsWith("  ") || !trimmed)) {
      current.lines.push(line);
    }
  }

  return items;
}

export function parseLeetcodeSeed(markdown: string): LeetcodeSeed {
  const seed: LeetcodeSeed = { patterns: [], subpatterns: [], problems: [] };
  let currentPatternSlug: string | null = null;
  let currentSubpatternSlug: string | null = null;

  for (const section of parseSections(markdown)) {
    if (section.heading.startsWith("## Pattern:")) {
      const name = titleFromHeading(section.heading, "## Pattern:");
      const slug = requiredField(section.body, "Slug", `pattern ${name}`);
      const description = requiredField(section.body, "Description", `pattern ${name}`);
      currentPatternSlug = slug;
      currentSubpatternSlug = null;
      seed.patterns.push({
        slug,
        name,
        description,
        displayOrder: seed.patterns.length,
      });
      continue;
    }

    if (section.heading.startsWith("### Subpattern:")) {
      const name = titleFromHeading(section.heading, "### Subpattern:");
      if (!currentPatternSlug) {
        throw new Error(`Missing parent pattern for subpattern ${name}`);
      }

      const slug = requiredField(section.body, "Slug", `subpattern ${name}`);
      const description = field(section.body, "Description") ?? "";
      currentSubpatternSlug = slug;
      seed.subpatterns.push({
        slug,
        patternSlug: currentPatternSlug,
        name,
        description,
        displayOrder: seed.subpatterns.length,
      });

      for (const problem of listItemSections(section.body, "Problem")) {
        const context = `problem ${problem.title}`;
        const problemSlug = requiredField(problem.lines, "Slug", context);
        const sourceUrl = requiredField(problem.lines, "URL", context);
        const estimatedMinutes = parseInteger(
          requiredField(problem.lines, "Estimated Minutes", context),
          "Estimated Minutes",
          context,
        );
        seed.problems.push({
          slug: problemSlug,
          subpatternSlug: currentSubpatternSlug,
          title: problem.title,
          sourceUrl,
          difficulty: parseDifficulty(field(problem.lines, "Difficulty"), problem.title),
          estimatedMinutes,
          tags: csv(field(problem.lines, "Tags")),
        });
      }
    }
  }

  return seed;
}

export function parseRoadmapSeed(markdown: string): RoadmapSeed {
  const sections = parseSections(markdown);
  const root = sections.find((section) => section.heading === "# Backend Roadmap");
  if (!root) {
    throw new Error("Missing Backend Roadmap heading");
  }

  const seed: RoadmapSeed = {
    roadmap: {
      slug: "backend",
      title: "Backend Roadmap",
      sourceUrl: requiredField(root.body, "Source", "roadmap Backend Roadmap"),
      description:
        field(root.body, "Description") ??
        "Backend engineering roadmap.",
    },
    topics: [],
    resources: [],
  };
  let currentTopicSlug: string | null = null;

  for (const section of sections) {
    if (!section.heading.startsWith("## Topic:")) continue;

    const title = titleFromHeading(section.heading, "## Topic:");
    const slug = requiredField(section.body, "Slug", `topic ${title}`);
    currentTopicSlug = slug;
    seed.topics.push({
      slug,
      parentSlug: field(section.body, "Parent") || null,
      title,
      description: requiredField(section.body, "Description", `topic ${title}`),
      sourceUrl: field(section.body, "Source"),
      displayOrder: seed.topics.length,
    });

    for (const resource of listItemSections(section.body, "Resource")) {
      const context = `resource ${resource.title}`;
      if (!currentTopicSlug) {
        throw new Error(`Missing topic for ${context}`);
      }

      seed.resources.push({
        topicSlug: currentTopicSlug,
        title: resource.title,
        url: requiredField(resource.lines, "URL", context),
        resourceType: requiredField(resource.lines, "Type", context),
        summary: requiredField(resource.lines, "Summary", context),
      });
    }
  }

  return seed;
}

export function parseSystemDesignSeed(markdown: string): SystemDesignSeed {
  const seed: SystemDesignSeed = { topics: [], prompts: [] };
  let currentTopicSlug: string | null = null;

  for (const section of parseSections(markdown)) {
    if (section.heading.startsWith("## Topic:")) {
      const title = titleFromHeading(section.heading, "## Topic:");
      const slug = requiredField(section.body, "Slug", `topic ${title}`);
      currentTopicSlug = slug;
      seed.topics.push({
        slug,
        title,
        description: field(section.body, "Description") ?? "",
        conceptTags: csv(field(section.body, "Tags")),
      });
      continue;
    }

    if (section.heading.startsWith("### Prompt:")) {
      const title = titleFromHeading(section.heading, "### Prompt:");
      if (!currentTopicSlug) {
        throw new Error(`Missing topic for prompt ${title}`);
      }

      const context = `prompt ${title}`;
      const slug = requiredField(section.body, "Slug", context);
      const promptText = firstParagraph(section.body);
      if (!promptText) {
        throw new Error(`Missing prompt text for ${context}`);
      }

      seed.prompts.push({
        topicSlug: currentTopicSlug,
        slug,
        title,
        promptText,
        difficulty: parseDifficulty(field(section.body, "Difficulty"), title),
        sourceUrl: field(section.body, "Source"),
        expectedConcepts: csv(field(section.body, "Expected Concepts")),
      });
    }
  }

  return seed;
}
