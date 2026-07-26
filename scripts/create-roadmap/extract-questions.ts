import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { completeObject, getAiOptions } from "./ai-client";
import { requireCliValue, runCli } from "./cli";
import {
  ExtractedQuestion,
  ExtractionResponse,
  extractionResponseSchema,
  QuestionBank,
  questionBankSchema,
  sourceManifestSchema,
} from "./schemas";

export type ExtractQuestionsOptions = {
  manifestPath: string;
  output: string | null;
  maxSources: number;
  extractor: "fetch" | "playwright";
  maxPageChars: number;
};

export async function extractQuestions(options: ExtractQuestionsOptions): Promise<string> {
  const manifest = sourceManifestSchema.parse(
    JSON.parse(await readFile(options.manifestPath, "utf8")),
  );
  const aiOptions = getAiOptions();
  const extractionRuns: QuestionBank["extractionRuns"] = [];
  const questions: ExtractedQuestion[] = [];
  const sources = manifest.sources
    .filter((source) => source.status !== "rejected")
    .slice(0, options.maxSources);

  for (const source of sources) {
    try {
      const pageText = await readPageText(source.url, options.extractor);
      const extraction = await completeObject({
        schema: extractionResponseSchema,
        messages: [
          {
            role: "system",
            content: [
              "Extract interview questions and answers from page text.",
              "Do not invent questions that are not supported by the page.",
              "Use concise expected answers and accepted points.",
            ].join(" "),
          },
          {
            role: "user",
            content: JSON.stringify({
              roadmapSlug: manifest.roadmapSlug,
              roadmapTitle: manifest.roadmapTitle,
              topicSlug: manifest.topicSlug,
              topicTitle: manifest.topicTitle,
              sourceUrl: source.url,
              pageText: pageText.slice(0, options.maxPageChars),
            }),
          },
        ],
        options: aiOptions,
      });
      const normalized = normalizeQuestions({
        questions: extraction.questions,
        roadmapSlug: manifest.roadmapSlug,
        topicSlug: manifest.topicSlug,
        sourceUrl: source.url,
      });

      questions.push(...normalized);
      extractionRuns.push({
        sourceUrl: source.url,
        extractedAt: new Date().toISOString(),
        extractor: options.extractor,
        model: aiOptions.model,
        questionCount: normalized.length,
        status: "extracted",
      });
      console.log(`[extract] ${source.url} questions=${normalized.length}`);
    } catch (error) {
      extractionRuns.push({
        sourceUrl: source.url,
        extractedAt: new Date().toISOString(),
        extractor: options.extractor,
        model: aiOptions.model,
        questionCount: 0,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
      console.warn(`[extract] failed ${source.url}`);
    }
  }

  const dedupedQuestions = dedupeQuestions(questions);
  const bank = questionBankSchema.parse({
    roadmapSlug: manifest.roadmapSlug,
    roadmapTitle: manifest.roadmapTitle,
    topicSlug: manifest.topicSlug,
    topicTitle: manifest.topicTitle,
    generatedAt: new Date().toISOString(),
    model: aiOptions.model,
    questions: dedupedQuestions,
    extractionRuns,
  });
  const outputPath = resolve(
    options.output ?? defaultQuestionBankPath(manifest.roadmapSlug, manifest.topicSlug),
  );

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(bank, null, 2)}\n`, "utf8");
  console.log(`[questions] ${outputPath}`);
  console.log(`[questions] sources=${sources.length} questions=${dedupedQuestions.length}`);

  return outputPath;
}

async function main(): Promise<void> {
  await extractQuestions(parseCliOptions(process.argv.slice(2)));
}

function parseCliOptions(args: string[]): ExtractQuestionsOptions {
  const options: ExtractQuestionsOptions = {
    manifestPath: "",
    output: null,
    maxSources: 5,
    extractor: "fetch",
    maxPageChars: 24_000,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    switch (arg) {
      case "--manifest":
        options.manifestPath = requireCliValue(arg, next);
        index += 1;
        break;
      case "--output":
        options.output = requireCliValue(arg, next);
        index += 1;
        break;
      case "--max-sources":
        options.maxSources = Number(requireCliValue(arg, next));
        index += 1;
        break;
      case "--extractor":
        options.extractor = parseExtractor(requireCliValue(arg, next));
        index += 1;
        break;
      case "--max-page-chars":
        options.maxPageChars = Number(requireCliValue(arg, next));
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.manifestPath) {
    throw new Error("--manifest is required.");
  }

  return options;
}

function parseExtractor(value: string): ExtractQuestionsOptions["extractor"] {
  if (value === "fetch" || value === "playwright") return value;
  throw new Error("--extractor must be fetch or playwright.");
}

async function readPageText(url: string, extractor: ExtractQuestionsOptions["extractor"]): Promise<string> {
  if (extractor === "playwright") {
    return readPageTextWithPlaywright(url);
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 CodemapQuestionSeeder/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
  }

  return htmlToText(await response.text());
}

async function readPageTextWithPlaywright(url: string): Promise<string> {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);

    return page.locator("body").innerText({ timeout: 10_000 });
  } finally {
    await browser.close();
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<\/(h[1-6]|p|li|dt|dd|div|section|article|br)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeQuestions({
  questions,
  roadmapSlug,
  topicSlug,
  sourceUrl,
}: {
  questions: ExtractionResponse["questions"];
  roadmapSlug: string;
  topicSlug: string | null;
  sourceUrl: string;
}): ExtractedQuestion[] {
  return questions.flatMap((question, index) => {
    if (!question.question.trim()) return [];

    return [{
      id: buildQuestionId(roadmapSlug, topicSlug, sourceUrl, index, question.question),
      roadmapSlug,
      topicSlug,
      type: question.type,
      difficulty: question.difficulty,
      question: question.question.trim(),
      expectedAnswer: question.expectedAnswer?.trim(),
      acceptedPoints: question.acceptedPoints?.map((point) => point.trim()).filter(Boolean),
      choices: question.choices,
      correctChoiceIds: question.correctChoiceIds,
      explanation: question.explanation.trim(),
      sourceUrls: [sourceUrl],
      reviewStatus: "needs-review" as const,
    }];
  });
}

function buildQuestionId(
  roadmapSlug: string,
  topicSlug: string | null,
  sourceUrl: string,
  index: number,
  question: string,
): string {
  const slug = `${roadmapSlug}-${topicSlug ?? "full-roadmap"}-${hash(`${sourceUrl}:${index}:${question}`)}`;
  return slug.toLowerCase();
}

function hash(value: string): string {
  let result = 5381;

  for (let index = 0; index < value.length; index += 1) {
    result = ((result << 5) + result) ^ value.charCodeAt(index);
  }

  return (result >>> 0).toString(36);
}

function dedupeQuestions(questions: ExtractedQuestion[]): ExtractedQuestion[] {
  const seen = new Map<string, ExtractedQuestion>();

  for (const question of questions) {
    const key = question.question.toLowerCase().replace(/\W+/g, " ").trim();
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, question);
      continue;
    }

    seen.set(key, {
      ...existing,
      sourceUrls: Array.from(new Set([...existing.sourceUrls, ...question.sourceUrls])),
    });
  }

  return Array.from(seen.values());
}

function defaultQuestionBankPath(roadmapSlug: string, topicSlug: string | null): string {
  return join("data", "test-yourself", "question-banks", `${roadmapSlug}.${topicSlug ?? "full-roadmap"}.questions.json`);
}

runCli(main, import.meta.url);
