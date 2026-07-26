import { discoverSources } from "./discover-sources";
import { extractQuestions, ExtractQuestionsOptions } from "./extract-questions";
import { requireCliValue, runCli } from "./cli";

type CliOptions = {
  roadmapSlug: string;
  topicSlug: string | null;
  sourceOutput: string | null;
  questionOutput: string | null;
  maxQueries: number;
  maxResultsPerQuery: number;
  maxSources: number;
  extractor: ExtractQuestionsOptions["extractor"];
  maxPageChars: number;
};

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));
  const manifestPath = await discoverSources({
    roadmapSlug: options.roadmapSlug,
    topicSlug: options.topicSlug,
    output: options.sourceOutput,
    maxQueries: options.maxQueries,
    maxResultsPerQuery: options.maxResultsPerQuery,
    maxSources: options.maxSources,
  });

  const questionBankPath = await extractQuestions({
    manifestPath,
    output: options.questionOutput,
    maxSources: options.maxSources,
    extractor: options.extractor,
    maxPageChars: options.maxPageChars,
  });

  console.log(`[done] manifest=${manifestPath}`);
  console.log(`[done] questions=${questionBankPath}`);
}

function parseCliOptions(args: string[]): CliOptions {
  const options: CliOptions = {
    roadmapSlug: "",
    topicSlug: null,
    sourceOutput: null,
    questionOutput: null,
    maxQueries: 5,
    maxResultsPerQuery: 8,
    maxSources: 8,
    extractor: "fetch",
    maxPageChars: 24_000,
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
      case "--source-output":
        options.sourceOutput = requireCliValue(arg, next);
        index += 1;
        break;
      case "--question-output":
        options.questionOutput = requireCliValue(arg, next);
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

  if (!options.roadmapSlug) {
    throw new Error("--roadmap is required.");
  }

  return options;
}

function parseExtractor(value: string): ExtractQuestionsOptions["extractor"] {
  if (value === "fetch" || value === "playwright") return value;
  throw new Error("--extractor must be fetch or playwright.");
}

runCli(main, import.meta.url);
