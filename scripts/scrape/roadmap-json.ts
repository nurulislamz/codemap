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

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { manifest, output, rootKey };
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
  const roadmapJson = await buildRoadmapJsonFromManifest(args.manifest, {
    rootKey: args.rootKey,
  });

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(roadmapJson, null, 2)}\n`, "utf8");
  console.log(`[json] ${outputPath}`);
}

if (process.argv[1]?.endsWith("roadmap-json.ts")) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
