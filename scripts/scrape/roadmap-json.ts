import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

interface ManifestEntry {
  url: string;
  depth: number;
  parent: string | null;
  title: string;
  status: "ok" | "error";
  path?: string;
}

interface RoadmapResource {
  title: string;
  url: string;
}

interface RoadmapArticleResource extends RoadmapResource {
  type: string;
}

export interface RoadmapJsonNode {
  title: string;
  slug: string;
  url: string;
  description: string;
  resources: RoadmapResource[];
  topics: Record<string, RoadmapJsonNode>;
}

interface PageData {
  title: string;
  description: string;
  resources: RoadmapResource[];
  sections: Array<{
    title: string;
    description: string;
    resources: RoadmapResource[];
  }>;
}

interface BuildOptions {
  rootKey?: string;
}

interface RoadmapApiNode {
  id: string;
  type: string;
  width?: number | string;
  height?: number | string;
  position?: {
    x?: number;
    y?: number;
  };
  measured?: {
    width?: number;
    height?: number;
  };
  style?: {
    width?: number | string;
    height?: number | string;
  };
  data?: {
    label?: string;
    legend?: unknown;
  };
}

interface RoadmapApiEdge {
  source: string;
  target: string;
  data?: {
    edgeStyle?: string;
  };
}

interface RoadmapApiData {
  slug: string;
  title?: {
    card?: string;
    page?: string;
  };
  description?: string;
  nodes: RoadmapApiNode[];
  edges: RoadmapApiEdge[];
}

interface RoadmapTopicContentResource extends RoadmapResource {
  type: string;
}

interface RoadmapTopicContent {
  description?: string;
  resources?: RoadmapTopicContentResource[];
}

interface RoadmapGraphOptions extends BuildOptions {
  topicContentByNodeId?: Record<string, RoadmapTopicContent>;
}

export interface RoadmapGraphTopic {
  title: string;
  sourceId: string;
  type: string;
  order: number;
  summary: string;
  video: RoadmapResource | null;
  articles: RoadmapArticleResource[];
  parents: string[];
  children: string[];
}

type RoadmapTopicLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  hasLegend: boolean;
};

export interface RoadmapGraph {
  title: string;
  summary: string;
  url: string;
  order: string[];
  topics: Record<string, RoadmapGraphTopic>;
  edges: Array<{
    from: string;
    to: string;
    style: string;
  }>;
}

const ignoredLinkHosts = new Set([
  "facebook.com",
  "github.com",
  "linkedin.com",
  "news.ycombinator.com",
  "reddit.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "thenewstack.io",
]);

const ignoredLineFragments = [
  "AI TutorHave a question?",
  "Join the Community",
  "roadmap.sh is the",
  "Rank 7th out of",
];

const ignoredSectionTitles = new Set(["Frequently Asked Questions"]);

const roadmapTopicNodeTypes = new Set(["button", "label", "paragraph", "subtopic", "topic"]);
const ignoredRoadmapNodeLabels = new Set([
  "At this point, you should know enough to get a job. Gain hands-on practice by building projects.",
  "Click to visit the roadmap",
  "Find the detailed version of this roadmap along with other similar roadmaps",
  "Have a look at the following relevant tracks",
  "Learn one language and build lots of projects before moving on",
  "roadmap.sh",
  "Visit Beginner Friendly Version",
  "You may never need most of these, just know what they are and when to use them",
]);

export async function buildRoadmapJsonFromManifest(
  manifestPath: string,
  options: BuildOptions = {},
): Promise<Record<string, RoadmapJsonNode>> {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as ManifestEntry[];
  const okEntries = manifest.filter((entry) => entry.status === "ok" && entry.path);
  const pageDataByUrl = new Map<string, PageData>();
  const childrenByUrl = new Map<string, ManifestEntry[]>();

  for (const entry of okEntries) {
    if (!entry.path) continue;
    pageDataByUrl.set(entry.url, parseMarkdownPage(await readFile(entry.path, "utf8"), entry.title));

    if (entry.parent) {
      const children = childrenByUrl.get(entry.parent) ?? [];
      children.push(entry);
      childrenByUrl.set(entry.parent, children);
    }
  }

  const rootEntry = okEntries.find((entry) => entry.parent === null) ?? okEntries[0];
  if (!rootEntry) {
    throw new Error(`No successful scrape entries found in ${manifestPath}.`);
  }

  const rootKey = options.rootKey ?? keyFromUrl(rootEntry.url);
  return {
    [rootKey]: buildNode(rootEntry, pageDataByUrl, childrenByUrl),
  };
}

export function buildRoadmapGraphFromRoadmapData(
  roadmap: RoadmapApiData,
  options: RoadmapGraphOptions = {},
): Record<string, RoadmapGraph> {
  const rootKey = options.rootKey ?? toCamelCase(roadmap.slug);
  const rootTitle = roadmap.title?.page ?? roadmap.title?.card ?? roadmap.slug;
  const meaningfulNodes = roadmap.nodes.filter(isMeaningfulRoadmapNode);
  const topicNodes = meaningfulNodes
    .filter((node) => node.type !== "title")
    .sort(compareRoadmapNodesByPosition);
  const nodeIdToKey = new Map<string, string>();
  const usedKeys = new Map<string, number>();

  for (const node of meaningfulNodes) {
    if (node.type === "title") {
      nodeIdToKey.set(node.id, rootKey);
      continue;
    }

    nodeIdToKey.set(node.id, uniqueKey(toCamelCase(node.data?.label ?? node.id), usedKeys));
  }

  const topics: Record<string, RoadmapGraphTopic> = {};
  const fallbackOrder: string[] = [];
  const topicLayouts = new Map<string, RoadmapTopicLayout>();

  topicNodes.forEach((node, index) => {
    const key = nodeIdToKey.get(node.id);
    if (!key) return;

    const content = options.topicContentByNodeId?.[node.id];
    const resources = content?.resources ?? [];
    const video = resources.find((resource) => resource.type === "video");

    fallbackOrder.push(key);
    topics[key] = {
      title: cleanText(node.data?.label ?? key),
      sourceId: node.id,
      type: node.type,
      order: index + 1,
      summary: summaryFromMarkdown(content?.description ?? ""),
      video: video ? { title: video.title, url: video.url } : null,
      articles: resources
        .filter((resource) => resource.type !== "video")
        .map((resource) => ({
          type: resource.type,
          title: resource.title,
          url: resource.url,
        })),
      parents: [],
      children: [],
    };

    topicLayouts.set(key, layoutFromRoadmapNode(node));
  });

  const graph = buildRawEdgeGraph(roadmap.edges);
  const edges = collapseRoadmapEdges(roadmap.edges, graph, nodeIdToKey);
  assignImpliedEdges(topics, edges, topicLayouts);
  const order = buildTopicOrder(rootKey, topics, edges, fallbackOrder);

  for (const edge of edges) {
    if (topics[edge.from] && !topics[edge.from].children.includes(edge.to)) {
      topics[edge.from].children.push(edge.to);
    }

    if (topics[edge.to] && !topics[edge.to].parents.includes(edge.from)) {
      topics[edge.to].parents.push(edge.from);
    }
  }

  order.forEach((key, index) => {
    topics[key].order = index + 1;
  });

  return {
    [rootKey]: {
      title: rootTitle,
      summary: cleanText((roadmap.description ?? "").replaceAll("@currentYear@", String(new Date().getFullYear()))),
      url: `https://roadmap.sh/${roadmap.slug}`,
      order,
      topics,
      edges,
    },
  };
}

function isMeaningfulRoadmapNode(node: RoadmapApiNode): boolean {
  const label = cleanText(node.data?.label ?? "");
  if (!label) return false;
  if (label === "vertical node" || label === "horizontal node") return false;
  if (ignoredRoadmapNodeLabels.has(label)) return false;
  return node.type === "title" || roadmapTopicNodeTypes.has(node.type);
}

function compareRoadmapNodesByPosition(a: RoadmapApiNode, b: RoadmapApiNode): number {
  const yDiff = (a.position?.y ?? 0) - (b.position?.y ?? 0);
  if (yDiff !== 0) return yDiff;
  return (a.position?.x ?? 0) - (b.position?.x ?? 0);
}

function uniqueKey(baseKey: string, usedKeys: Map<string, number>): string {
  const key = baseKey || "topic";
  const count = usedKeys.get(key) ?? 0;
  usedKeys.set(key, count + 1);
  return count === 0 ? key : `${key}${count + 1}`;
}

function layoutFromRoadmapNode(node: RoadmapApiNode): RoadmapTopicLayout {
  return {
    x: node.position?.x ?? 0,
    y: node.position?.y ?? 0,
    width: numericSize(node.measured?.width ?? node.width ?? node.style?.width),
    height: numericSize(node.measured?.height ?? node.height ?? node.style?.height),
    hasLegend: Boolean(node.data?.legend),
  };
}

function numericSize(value: number | string | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function assignImpliedEdges(
  topics: Record<string, RoadmapGraphTopic>,
  edges: RoadmapGraph["edges"],
  topicLayouts: Map<string, RoadmapTopicLayout>,
): void {
  const entries = Object.entries(topics)
    .map(([slug, topic]) => ({ slug, topic, layout: topicLayouts.get(slug) }))
    .filter((entry) => entry.layout !== undefined);

  const seen = new Set(edges.map((edge) => `${edge.from}->${edge.to}`));
  const explicitParents = new Set(edges.map((edge) => edge.to));
  const explicitChildren = new Set(edges.map((edge) => edge.from));

  const orphanTopics = entries.filter(
    ({ slug, topic }) =>
      !explicitParents.has(slug) &&
      !explicitChildren.has(slug) &&
      topic.type !== "topic" &&
      (topic.video !== null || topic.articles.length > 0),
  );

  const candidateParents = entries.filter((entry) => isVisualGroupParent(entry.topic, entry.layout));

  const assignParent = (orphan: (typeof orphanTopics)[number]): boolean => {
    let bestParent: (typeof candidateParents)[number] | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const candidate of candidateParents) {
      if (candidate.slug === orphan.slug) continue;

      const match = visualGroupMatch(candidate.topic, candidate.layout, orphan.layout);
      if (!match) continue;

      if (match.score >= bestScore) continue;

      bestParent = candidate;
      bestScore = match.score;
    }

    if (!bestParent) {
      return false;
    }

    const from = bestParent.slug;
    const to = orphan.slug;
    const edgeKey = `${from}->${to}`;

    if (seen.has(edgeKey)) return false;

    seen.add(edgeKey);
    edges.push({ from, to, style: "solid" });

    bestParent.topic.children.push(to);
    orphan.topic.parents.push(from);

    return true;
  };

  for (const orphan of orphanTopics) {
    assignParent(orphan);
  }
}

function isVisualGroupParent(topic: RoadmapGraphTopic, layout: RoadmapTopicLayout | undefined): boolean {
  if (!layout) return false;
  if (topic.type === "topic" || topic.type === "label" || topic.type === "paragraph") return true;
  return topic.type === "subtopic" && !layout.hasLegend && layout.width >= 220;
}

function visualGroupMatch(
  candidate: RoadmapGraphTopic,
  candidateLayout: RoadmapTopicLayout,
  childLayout: RoadmapTopicLayout | undefined,
): { isAbove: boolean; score: number } | null {
  if (!childLayout) return null;

  const xGap = Math.abs(candidateLayout.x - childLayout.x);
  const yGap = Math.abs(candidateLayout.y - childLayout.y);
  const isAbove = candidateLayout.y < childLayout.y;

  if (candidate.type === "label") {
    if (!isAbove || xGap > 170 || yGap > 175) return null;
    return { isAbove, score: yGap + xGap };
  }

  if (candidate.type === "paragraph") {
    if (!isAbove || xGap > 210 || yGap > 280) return null;
    return { isAbove, score: yGap + xGap };
  }

  if (candidate.type === "subtopic") {
    if (!isAbove || xGap > 230 || yGap > 380) return null;
    return { isAbove, score: yGap + xGap };
  }

  if (candidate.type !== "topic") return null;

  const hasCloseColumn = xGap <= 260;
  const hasSameRowRelationship = yGap <= 90 && xGap <= 520;

  if (isAbove && yGap > 240) return null;
  if (!isAbove && yGap > 280) return null;
  if (!hasCloseColumn && !hasSameRowRelationship) return null;

  return { isAbove, score: yGap + xGap * 1.5 };
}

function buildRawEdgeGraph(edges: RoadmapApiEdge[]): {
  outgoing: Map<string, string[]>;
  incoming: Map<string, string[]>;
} {
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();

  for (const edge of edges) {
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
    incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge.source]);
  }

  return { outgoing, incoming };
}

function collapseRoadmapEdges(
  rawEdges: RoadmapApiEdge[],
  graph: { outgoing: Map<string, string[]>; incoming: Map<string, string[]> },
  nodeIdToKey: Map<string, string>,
): RoadmapGraph["edges"] {
  const edges: RoadmapGraph["edges"] = [];
  const seen = new Set<string>();

  for (const rawEdge of rawEdges) {
    const sources = findNearestMappedNodes(rawEdge.source, graph.incoming, nodeIdToKey);
    const targets = findNearestMappedNodes(rawEdge.target, graph.outgoing, nodeIdToKey);
    const style = rawEdge.data?.edgeStyle === "dashed" ? "dashed" : "solid";

    for (const from of sources) {
      for (const to of targets) {
        if (from === to) continue;

        const key = `${from}->${to}`;
        if (seen.has(key)) continue;

        seen.add(key);
        edges.push({ from, to, style });
      }
    }
  }

  return edges;
}

function buildTopicOrder(
  rootKey: string,
  topics: Record<string, RoadmapGraphTopic>,
  edges: RoadmapGraph["edges"],
  fallbackOrder: string[],
): string[] {
  const childrenByKey = new Map<string, string[]>();
  const visited = new Set<string>();
  const order: string[] = [];

  for (const edge of edges) {
    childrenByKey.set(edge.from, [...(childrenByKey.get(edge.from) ?? []), edge.to]);
  }

  function visit(key: string): void {
    for (const child of childrenByKey.get(key) ?? []) {
      if (!topics[child] || visited.has(child)) continue;

      visited.add(child);
      order.push(child);
      visit(child);
    }
  }

  visit(rootKey);

  for (const key of fallbackOrder) {
    if (visited.has(key)) continue;

    visited.add(key);
    order.push(key);
  }

  return order;
}

function findNearestMappedNodes(
  startNodeId: string,
  nextNodesByNodeId: Map<string, string[]>,
  nodeIdToKey: Map<string, string>,
): string[] {
  const mappedStart = nodeIdToKey.get(startNodeId);
  if (mappedStart) return [mappedStart];

  const found: string[] = [];
  const seen = new Set([startNodeId]);
  const queue = [...(nextNodesByNodeId.get(startNodeId) ?? [])];

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (!nodeId || seen.has(nodeId)) continue;

    seen.add(nodeId);
    const mapped = nodeIdToKey.get(nodeId);
    if (mapped) {
      found.push(mapped);
      continue;
    }

    queue.push(...(nextNodesByNodeId.get(nodeId) ?? []));
  }

  return found;
}

function summaryFromMarkdown(markdown: string): string {
  const lines = markdown
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("#"));
  return collectParagraphs(lines)[0] ?? "";
}

function buildNode(
  entry: ManifestEntry,
  pageDataByUrl: Map<string, PageData>,
  childrenByUrl: Map<string, ManifestEntry[]>,
): RoadmapJsonNode {
  const page = pageDataByUrl.get(entry.url);
  const title = page?.title || entry.title || keyFromUrl(entry.url);
  const node: RoadmapJsonNode = {
    title,
    slug: keyFromUrl(entry.url),
    url: entry.url,
    description: page?.description ?? "",
    resources: page?.resources ?? [],
    topics: {},
  };

  for (const section of page?.sections ?? []) {
    const sectionKey = toCamelCase(section.title);
    if (!sectionKey || node.topics[sectionKey]) continue;

    node.topics[sectionKey] = {
      title: section.title,
      slug: sectionKey,
      url: entry.url,
      description: section.description,
      resources: section.resources,
      topics: {},
    };
  }

  for (const child of childrenByUrl.get(entry.url) ?? []) {
    const childKey = keyFromUrl(child.url);
    node.topics[childKey] = buildNode(child, pageDataByUrl, childrenByUrl);
  }

  return node;
}

export function parseMarkdownPage(markdown: string, fallbackTitle: string): PageData {
  const lines = markdown.split(/\r?\n/);
  const title = extractTitle(lines) || fallbackTitle;
  const description = extractDescription(lines);

  return {
    title,
    description,
    resources: extractResources(markdown),
    sections: extractSections(lines),
  };
}

function extractTitle(lines: string[]): string {
  const heading = lines.find((line) => line.startsWith("# "));
  return heading ? cleanText(heading.replace(/^#\s+/, "")) : "";
}

function extractDescription(lines: string[]): string {
  const descriptionLine = lines
    .filter((line) => !line.startsWith("# "))
    .map(cleanText)
    .find(isUsefulDescription);
  if (descriptionLine) {
    return descriptionLine;
  }

  const paragraphs = collectParagraphs(lines.filter((line) => !line.startsWith("# ")));
  return paragraphs.find(isUsefulDescription) ?? "";
}

function extractSections(lines: string[]): PageData["sections"] {
  const sections: PageData["sections"] = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current) {
        sections.push(sectionFromLines(current.title, current.lines));
      }

      current = { title: cleanText(line.replace(/^##\s+/, "")), lines: [] };
      continue;
    }

    current?.lines.push(line);
  }

  if (current) {
    sections.push(sectionFromLines(current.title, current.lines));
  }

  return sections.filter(
    (section) =>
      !ignoredSectionTitles.has(section.title) &&
      (section.description || section.resources.length > 0),
  );
}

function sectionFromLines(title: string, lines: string[]): PageData["sections"][number] {
  return {
    title,
    description: extractDescription(lines),
    resources: extractResources(lines.join("\n")),
  };
}

function collectParagraphs(lines: string[]): string[] {
  const paragraphs: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    const cleaned = cleanText(line);
    if (!cleaned) {
      if (current.length > 0) {
        paragraphs.push(current.join(" "));
        current = [];
      }
      continue;
    }

    if (cleaned.startsWith("## ") || cleaned.startsWith("[](")) continue;
    current.push(cleaned);
  }

  if (current.length > 0) {
    paragraphs.push(current.join(" "));
  }

  return paragraphs;
}

function isUsefulDescription(value: string): boolean {
  if (value.length < 30) return false;
  if (ignoredLineFragments.some((fragment) => value.includes(fragment))) return false;
  if (/^Roadmap\b/.test(value)) return false;
  if (/^Frequently Asked Questions\b/.test(value)) return false;
  return true;
}

function extractResources(markdown: string): RoadmapResource[] {
  const resources: RoadmapResource[] = [];
  const seen = new Set<string>();
  const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(markdown)) !== null) {
    const title = cleanResourceTitle(match[1]);
    const url = match[2];
    if (!title || title.startsWith("!") || seen.has(url) || shouldIgnoreResource(url)) continue;

    seen.add(url);
    resources.push({ title, url });
  }

  return resources;
}

function shouldIgnoreResource(url: string): boolean {
  const parsed = new URL(url);
  const host = parsed.hostname.replace(/^www\./, "");
  if (ignoredLinkHosts.has(host)) return true;
  if (parsed.hostname === "roadmap.sh") {
    if (parsed.pathname === "/") return true;
    if (parsed.pathname.startsWith("/about")) return true;
    if (parsed.pathname.startsWith("/ai")) return true;
    if (parsed.pathname.startsWith("/auth")) return true;
    if (parsed.pathname.startsWith("/discord")) return true;
    if (parsed.pathname.startsWith("/img")) return true;
    if (parsed.pathname.startsWith("/manifest")) return true;
    if (parsed.pathname.startsWith("/privacy")) return true;
    if (parsed.pathname.startsWith("/roadmaps")) return true;
    if (parsed.pathname.startsWith("/signup")) return true;
    if (parsed.pathname.startsWith("/terms")) return true;
  }

  return false;
}

function keyFromUrl(url: string): string {
  const parsed = new URL(url);
  const segments = parsed.pathname.split("/").filter(Boolean);
  return toCamelCase(segments[segments.length - 1] ?? parsed.hostname);
}

function toCamelCase(value: string): string {
  const words = cleanText(value)
    .replace(/['’]/g, "")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);

  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      return index === 0 ? lower : lower[0]?.toUpperCase() + lower.slice(1);
    })
    .join("");
}

function cleanText(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/#+\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanResourceTitle(value: string): string {
  const title = cleanText(value);
  const halfLength = title.length / 2;
  if (Number.isInteger(halfLength) && title.slice(0, halfLength) === title.slice(halfLength)) {
    return title.slice(0, halfLength);
  }

  return title;
}

function parseCliArgs(argv: string[]): {
  manifest: string;
  output: string;
  rootKey?: string;
  skipTopicContent: boolean;
} {
  const args = [...argv];
  if (args[0] === "--") {
    args.shift();
  }

  const manifest = args.shift();
  if (!manifest) {
    throw new Error(
      "Usage: tsx scripts/scrape/roadmap-json.ts <manifest> --output <path> [--root-key frontEndBasics]",
    );
  }

  let output = "scripts/scrape/crawl-output/roadmap-tree.structured.json";
  let rootKey: string | undefined;
  let skipTopicContent = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--output") {
      output = requiredValue(args, index, "--output");
      index += 1;
      continue;
    }

    if (arg === "--root-key") {
      rootKey = requiredValue(args, index, "--root-key");
      index += 1;
      continue;
    }

    if (arg === "--skip-topic-content") {
      skipTopicContent = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { manifest, output, rootKey, skipTopicContent };
}

function requiredValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value.`);
  }

  return value;
}

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));
  const outputPath = resolve(args.output);
  const source = await readJsonSource(args.manifest);
  const roadmapJson = isRoadmapApiData(source)
    ? buildRoadmapGraphFromRoadmapData(source, {
        rootKey: args.rootKey,
        topicContentByNodeId: args.skipTopicContent
          ? {}
          : await fetchRoadmapTopicContent(source),
      })
    : await buildRoadmapJsonFromManifest(args.manifest, {
        rootKey: args.rootKey,
      });

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(roadmapJson, null, 2)}\n`, "utf8");
  console.log(`[json] ${outputPath}`);
}

async function readJsonSource(source: string): Promise<unknown> {
  if (/^https?:\/\//.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${source}: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  return JSON.parse(await readFile(source, "utf8")) as unknown;
}

function isRoadmapApiData(value: unknown): value is RoadmapApiData {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const candidate = value as Partial<RoadmapApiData>;
  return (
    typeof candidate.slug === "string" &&
    Array.isArray(candidate.nodes) &&
    Array.isArray(candidate.edges)
  );
}

async function fetchRoadmapTopicContent(
  roadmap: RoadmapApiData,
): Promise<Record<string, RoadmapTopicContent>> {
  const nodes = roadmap.nodes.filter((node) => node.type !== "title" && isMeaningfulRoadmapNode(node));
  const contentByNodeId: Record<string, RoadmapTopicContent> = {};
  const queue = [...nodes];
  const concurrency = 8;
  let completed = 0;

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const node = queue.shift();
      if (!node) return;

      const content = await fetchOneRoadmapTopicContent(roadmap.slug, node.id);
      if (content) {
        contentByNodeId[node.id] = content;
      }

      completed += 1;
      if (completed % 25 === 0 || completed === nodes.length) {
        console.log(`[topic-content] ${completed}/${nodes.length}`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return contentByNodeId;
}

async function fetchOneRoadmapTopicContent(
  slug: string,
  nodeId: string,
): Promise<RoadmapTopicContent | null> {
  const url = `https://roadmap.sh/${slug}/${nodeId}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as RoadmapTopicContent;
  return {
    description: json.description ?? "",
    resources: Array.isArray(json.resources) ? json.resources : [],
  };
}

if (process.argv[1]?.endsWith("roadmap-json.ts")) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
