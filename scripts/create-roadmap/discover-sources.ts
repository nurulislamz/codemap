import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { completeObject, getAiOptions } from "./ai-client";
import { requireCliValue, runCli } from "./cli";
import { getRoadmapTarget } from "./roadmap-data";
import {
  queryResponseSchema,
  RankResponse,
  rankResponseSchema,
  SourceCandidate,
  sourceManifestSchema,
} from "./schemas";

export type DiscoverSourcesOptions = {
  roadmapSlug: string;
  topicSlug: string | null;
  output: string | null;
  maxQueries: number;
  maxResultsPerQuery: number;
  maxSources: number;
};

type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  query: string;
};

export async function discoverSources(options: DiscoverSourcesOptions): Promise<string> {
  const target = await getRoadmapTarget({
    roadmapSlug: options.roadmapSlug,
    topicSlug: options.topicSlug,
  });
  const aiOptions = getAiOptions();

  const queryResponse = await completeObject({
    schema: queryResponseSchema,
    messages: [
      {
        role: "system",
        content: "Generate concise web search queries for finding interview question pages.",
      },
      {
        role: "user",
        content: [
          `Roadmap: ${target.roadmapTitle} (${target.roadmapSlug})`,
          target.topicTitle ? `Topic: ${target.topicTitle} (${target.topicSlug})` : "Topic: full roadmap",
          target.topicSummary ? `Topic summary: ${target.topicSummary}` : "",
          "Find popular interview question pages for this target.",
          "Include common wording variants such as top interview questions, advanced questions, and practical questions.",
        ].filter(Boolean).join("\n"),
      },
    ],
    options: aiOptions,
  });

  const queries = normalizeQueries(queryResponse.queries).slice(0, options.maxQueries);
  if (queries.length === 0) {
    throw new Error("The AI model did not return any search queries.");
  }

  const results: SearchResult[] = [];
  for (const query of queries) {
    const queryResults = await searchDuckDuckGo(query, options.maxResultsPerQuery);
    results.push(...queryResults.map((result) => ({ ...result, query })));
  }

  const uniqueResults = dedupeResults(results);
  const rankResponse = await completeObject({
    schema: rankResponseSchema,
    messages: [
      {
        role: "system",
        content: "Rank likely interview-question source pages by relevance and quality.",
      },
      {
        role: "user",
        content: JSON.stringify({
          target,
          results: uniqueResults.map((result) => ({
            title: result.title,
            url: result.url,
            snippet: result.snippet,
            query: result.query,
          })),
          instructions: [
            "Prefer public pages with actual question and answer content.",
            "Reject search pages, category pages, ads, thin pages, and login-gated pages.",
            `Return at most ${options.maxSources} sources.`,
          ],
        }),
      },
    ],
    options: aiOptions,
  });

  const candidates = buildSourceCandidates(rankResponse, uniqueResults, options.maxSources);
  const manifest = sourceManifestSchema.parse({
    roadmapSlug: target.roadmapSlug,
    roadmapTitle: target.roadmapTitle,
    topicSlug: target.topicSlug,
    topicTitle: target.topicTitle,
    queries,
    sources: candidates,
    generatedAt: new Date().toISOString(),
    model: aiOptions.model,
  });
  const outputPath = resolve(
    options.output ?? defaultSourcePath(target.roadmapSlug, target.topicSlug),
  );

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`[sources] ${outputPath}`);
  console.log(`[sources] queries=${queries.length} results=${uniqueResults.length} selected=${candidates.length}`);

  return outputPath;
}

async function main(): Promise<void> {
  await discoverSources(parseCliOptions(process.argv.slice(2)));
}

function parseCliOptions(args: string[]): DiscoverSourcesOptions {
  const options: DiscoverSourcesOptions = {
    roadmapSlug: "",
    topicSlug: null,
    output: null,
    maxQueries: 5,
    maxResultsPerQuery: 8,
    maxSources: 8,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    switch (arg) {
      case "--roadmap":
        options.roadmapSlug = requireCliValue(arg, next);
        index += 1;
        break;
      case "--topic":
        options.topicSlug = requireCliValue(arg, next);
        index += 1;
        break;
      case "--output":
        options.output = requireCliValue(arg, next);
        index += 1;
        break;
      case "--max-queries":
        options.maxQueries = Number(requireCliValue(arg, next));
        index += 1;
        break;
      case "--max-results-per-query":
        options.maxResultsPerQuery = Number(requireCliValue(arg, next));
        index += 1;
        break;
      case "--max-sources":
        options.maxSources = Number(requireCliValue(arg, next));
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.roadmapSlug) {
    throw new Error("--roadmap is required.");
  }

  return options;
}

function normalizeQueries(queries: unknown): string[] {
  if (!Array.isArray(queries)) return [];

  return Array.from(
    new Set(
      queries
        .filter((query): query is string => typeof query === "string")
        .map((query) => query.trim())
        .filter(Boolean),
    ),
  );
}

async function searchDuckDuckGo(query: string, maxResults: number): Promise<Omit<SearchResult, "query">[]> {
  const response = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 CodemapQuestionSeeder/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Search failed for "${query}": ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const matches = Array.from(html.matchAll(/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g));

  return matches.slice(0, maxResults).flatMap((match) => {
    const url = decodeDuckDuckGoUrl(decodeHtml(match[1]));
    if (!url) return [];

    return [{
      title: stripTags(decodeHtml(match[2])),
      url,
      snippet: stripTags(decodeHtml(match[3])),
    }];
  });
}

function decodeDuckDuckGoUrl(url: string): string | null {
  try {
    const parsed = new URL(url, "https://duckduckgo.com");
    const redirect = parsed.searchParams.get("uddg");
    return redirect ? decodeURIComponent(redirect) : parsed.href;
  } catch {
    return null;
  }
}

function decodeHtml(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function dedupeResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  const unique: SearchResult[] = [];

  for (const result of results) {
    const key = normalizeUrl(result.url);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(result);
  }

  return unique;
}

function normalizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.href;
  } catch {
    return null;
  }
}

function buildSourceCandidates(
  rankResponse: RankResponse,
  results: SearchResult[],
  maxSources: number,
): SourceCandidate[] {
  const byUrl = new Map(results.map((result) => [normalizeUrl(result.url), result]));

  return rankResponse.sources.slice(0, maxSources).flatMap((source, index) => {
    const normalized = normalizeUrl(source.url);
    const result = normalized ? byUrl.get(normalized) : null;
    if (!normalized || !result) return [];

    return [{
      url: result.url,
      title: source.title || result.title,
      discoveredFromQuery: result.query,
      rank: index + 1,
      reason: source.reason,
      status: "candidate" as const,
    }];
  });
}

function defaultSourcePath(roadmapSlug: string, topicSlug: string | null): string {
  return join("data", "test-yourself", "sources", `${roadmapSlug}.${topicSlug ?? "full-roadmap"}.sources.json`);
}

runCli(main, import.meta.url);
