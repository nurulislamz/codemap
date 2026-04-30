import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const defaultDataPath = "src/data/leetcode/leetcode-patterns.json";
const defaultCacheDir = "scripts/scrape/crawl-output/neetcode";
const defaultReportPath = "scripts/scrape/crawl-output/neetcode-report.json";
const neetcodeSolutionsBaseUrl = "https://neetcode.io/solutions";

type Difficulty = "easy" | "medium" | "hard";

export interface NeetcodeSolution {
  textUrl: string;
  videoUrl?: string;
}

export interface ProblemEntry {
  number?: string | null;
  title?: string | null;
  leetcodeUrl?: string | null;
  difficulty?: Difficulty | null;
  solutions?: {
    neetcode?: NeetcodeSolution;
  };
}

interface SubPatternEntry {
  name: string;
  problems: Array<string | ProblemEntry>;
}

interface PatternEntry {
  name: string;
  subPatterns: SubPatternEntry[];
}

export interface LeetcodePatternsData {
  patterns: PatternEntry[];
}

export interface ParsedLeetcodePatterns {
  header: string;
  data: LeetcodePatternsData;
}

interface CliOptions {
  dataPath: string;
  cacheDir: string;
  reportPath: string;
  write: boolean;
  dryRun: boolean;
  force: boolean;
  limit: number | null;
  python: string;
  start: number;
}

interface EnrichmentReportItem {
  number: string;
  title: string;
  leetcodeUrl: string;
  slug: string;
  textUrl: string;
  status: "found" | "missing" | "skipped" | "error";
  videoUrl?: string;
  error?: string;
}

export function extractLeetcodeSlug(leetcodeUrl: string): string | null {
  try {
    const parsed = new URL(leetcodeUrl);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const problemsIndex = segments.indexOf("problems");
    return problemsIndex >= 0 ? segments[problemsIndex + 1] ?? null : null;
  } catch {
    return null;
  }
}

export function buildNeetcodeSolutionUrl(slug: string): string {
  return `${neetcodeSolutionsBaseUrl}/${slug}`;
}

export function hasNeetcodeSolutionPage(html: string, slug: string): boolean {
  const lower = html.toLowerCase();
  if (!html.trim()) return false;
  if (lower.includes("page not found") || lower.includes(">404<") || lower.includes("not-found")) {
    return false;
  }

  const slugPattern = new RegExp(`(?:/solutions/|solutions%2f)${escapeRegExp(slug)}`, "i");
  return slugPattern.test(html) && lower.includes("solution");
}

export function extractYoutubeUrl(html: string): string | undefined {
  const patterns = [
    /https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/i,
    /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{6,})/i,
    /https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{6,})/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return `https://www.youtube.com/watch?v=${match[1]}`;
    }
  }

  return undefined;
}

export function parseLeetcodePatterns(content: string): ParsedLeetcodePatterns {
  const headerMatch = content.match(/^((?:\s*\/\/.*\n|\s*\n)*)/);
  const header = headerMatch?.[1] ?? "";
  const jsonContent = content.slice(header.length);
  return {
    header,
    data: JSON.parse(jsonContent) as LeetcodePatternsData,
  };
}

export function serializeLeetcodePatterns(parsed: ParsedLeetcodePatterns): string {
  const header = parsed.header.trimEnd();
  const body = JSON.stringify(parsed.data, null, 2);
  return `${header ? `${header}\n\n` : ""}${body}\n`;
}

export function addNeetcodeSolution(problem: ProblemEntry, solution: NeetcodeSolution): void {
  problem.solutions = {
    ...problem.solutions,
    neetcode: solution,
  };
}

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));
  const source = await readFile(options.dataPath, "utf8");
  const parsed = parseLeetcodePatterns(source);
  const report: EnrichmentReportItem[] = [];
  let visited = 0;

  for (const problem of getProblemEntries(parsed.data)) {
    const slug = problem.leetcodeUrl ? extractLeetcodeSlug(problem.leetcodeUrl) : null;
    if (!slug || !problem.leetcodeUrl) {
      report.push(reportItem(problem, "", "", "skipped", undefined, "Missing LeetCode URL or slug"));
      continue;
    }

    if (visited++ < options.start) continue;
    if (options.limit !== null && report.filter((item) => item.status !== "skipped").length >= options.limit) break;

    const textUrl = buildNeetcodeSolutionUrl(slug);
    if (problem.solutions?.neetcode && !options.force) {
      report.push(reportItem(problem, slug, textUrl, "skipped", problem.solutions.neetcode.videoUrl));
      continue;
    }

    try {
      const html = await scrapeNeetcodeHtml(textUrl, slug, options);
      if (!hasNeetcodeSolutionPage(html, slug)) {
        report.push(reportItem(problem, slug, textUrl, "missing"));
        continue;
      }

      const videoUrl = extractYoutubeUrl(html);
      addNeetcodeSolution(problem, { textUrl, ...(videoUrl ? { videoUrl } : {}) });
      report.push(reportItem(problem, slug, textUrl, "found", videoUrl));
    } catch (error) {
      report.push(reportItem(problem, slug, textUrl, "error", undefined, errorMessage(error)));
    }
  }

  await mkdir(dirname(options.reportPath), { recursive: true });
  await writeFile(options.reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (options.write && !options.dryRun) {
    await writeFile(options.dataPath, serializeLeetcodePatterns(parsed), "utf8");
  }

  printReportSummary(report, options);
}

function parseCliOptions(args: string[]): CliOptions {
  const options: CliOptions = {
    dataPath: defaultDataPath,
    cacheDir: defaultCacheDir,
    reportPath: defaultReportPath,
    write: false,
    dryRun: true,
    force: false,
    limit: null,
    python: resolvePythonExecutable(process.env.PYTHON),
    start: 0,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];
    switch (arg) {
      case "--data":
        options.dataPath = requireValue(arg, next);
        index += 1;
        break;
      case "--cache-dir":
        options.cacheDir = requireValue(arg, next);
        index += 1;
        break;
      case "--report":
        options.reportPath = requireValue(arg, next);
        index += 1;
        break;
      case "--limit":
        options.limit = parseNonNegativeInteger(requireValue(arg, next), arg);
        index += 1;
        break;
      case "--python":
        options.python = resolvePythonExecutable(requireValue(arg, next));
        index += 1;
        break;
      case "--start":
        options.start = parseNonNegativeInteger(requireValue(arg, next), arg);
        index += 1;
        break;
      case "--write":
        options.write = true;
        options.dryRun = false;
        break;
      case "--dry-run":
        options.write = false;
        options.dryRun = true;
        break;
      case "--force":
        options.force = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function requireValue(flag: string, value: string | undefined): string {
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value.`);
  }
  return value;
}

function parseNonNegativeInteger(value: string, flag: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${flag} must be a non-negative integer.`);
  }
  return parsed;
}

function getProblemEntries(data: LeetcodePatternsData): ProblemEntry[] {
  return data.patterns.flatMap((pattern) =>
    pattern.subPatterns.flatMap((subPattern) =>
      subPattern.problems.filter((problem): problem is ProblemEntry => typeof problem !== "string"),
    ),
  );
}

async function scrapeNeetcodeHtml(textUrl: string, slug: string, options: CliOptions): Promise<string> {
  const cachePath = resolve(options.cacheDir, `${safeFileName(slug)}.html`);

  if (!options.force) {
    const cached = await readCachedFile(cachePath);
    if (cached !== null) return cached;
  }

  await mkdir(dirname(cachePath), { recursive: true });
  await execFileAsync(options.python, [
    "scripts/scrape/crawl4ai-cli.py",
    textUrl,
    "--format",
    "html",
    "--scan-full-page",
    "--wait-until",
    "networkidle",
    "--wait-for-timeout",
    "1000",
    "--output",
    cachePath,
  ]);

  return readFile(cachePath, "utf8");
}

export function resolvePythonExecutable(explicitPython?: string): string {
  if (explicitPython) return explicitPython;
  if (existsSync(".venv-crawl/bin/python")) return ".venv-crawl/bin/python";
  if (existsSync(".venv/bin/python")) return ".venv/bin/python";
  return "python3";
}

async function readCachedFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

function reportItem(
  problem: ProblemEntry,
  slug: string,
  textUrl: string,
  status: EnrichmentReportItem["status"],
  videoUrl?: string,
  error?: string,
): EnrichmentReportItem {
  return {
    number: problem.number ?? "Problem",
    title: problem.title ?? "LeetCode problem",
    leetcodeUrl: problem.leetcodeUrl ?? "",
    slug,
    textUrl,
    status,
    ...(videoUrl ? { videoUrl } : {}),
    ...(error ? { error } : {}),
  };
}

function printReportSummary(report: EnrichmentReportItem[], options: CliOptions): void {
  const counts = report.reduce<Record<string, number>>((accumulator, item) => {
    accumulator[item.status] = (accumulator[item.status] ?? 0) + 1;
    return accumulator;
  }, {});

  console.log(
    [
      `NeetCode enrichment ${options.write ? "wrote data" : "dry run"}.`,
      `found=${counts.found ?? 0}`,
      `missing=${counts.missing ?? 0}`,
      `skipped=${counts.skipped ?? 0}`,
      `error=${counts.error ?? 0}`,
      `report=${options.reportPath}`,
    ].join(" "),
  );
}

function safeFileName(value: string): string {
  return basename(value).replace(/[^a-zA-Z0-9._-]/g, "-");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const thisFile = fileURLToPath(import.meta.url);
if (resolve(process.argv[1] ?? "") === thisFile) {
  main().catch((error) => {
    console.error(errorMessage(error));
    process.exitCode = 1;
  });
}
