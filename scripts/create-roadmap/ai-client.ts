import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateObject, type LanguageModel, type ModelMessage } from "ai";
import type { ZodType } from "zod";

export type AiProvider = "ollama" | "openai-compatible" | "openrouter" | "openai" | "anthropic";

export type AiOptions = {
  provider: AiProvider;
  model: string;
  baseUrl: string | undefined;
  apiKey: string | undefined;
  timeoutMs: number;
  maxOutputTokens: number;
};

const defaultOllamaBaseUrl = "http://localhost:11434/v1";
const defaultOpenRouterBaseUrl = "https://openrouter.ai/api/v1";
const defaultTimeoutMs = 60_000;
const defaultMaxOutputTokens = 2_000;

const defaultModels: Record<Exclude<AiProvider, "openai-compatible">, string> = {
  ollama: "qwen2.5:7b-instruct",
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-4-5-20251001",
  openrouter: "openai/gpt-4o-mini",
};

export function getAiOptions(): AiOptions {
  const provider = parseProvider(process.env.AI_PROVIDER);
  const options: AiOptions = {
    provider,
    model: resolveModelName(provider),
    baseUrl: process.env.AI_BASE_URL ?? process.env.LOCAL_AI_BASE_URL ?? defaultBaseUrl(provider),
    apiKey: resolveApiKey(provider),
    timeoutMs: parsePositiveInt(
      process.env.AI_TIMEOUT_MS ?? process.env.LOCAL_AI_TIMEOUT_MS,
      defaultTimeoutMs,
      "AI_TIMEOUT_MS",
    ),
    maxOutputTokens: parsePositiveInt(
      process.env.AI_MAX_OUTPUT_TOKENS ?? process.env.LOCAL_AI_MAX_OUTPUT_TOKENS,
      defaultMaxOutputTokens,
      "AI_MAX_OUTPUT_TOKENS",
    ),
  };

  return options;
}

export async function completeObject<T>({
  schema,
  messages,
  options = getAiOptions(),
}: {
  schema: ZodType<T>;
  messages: ModelMessage[];
  options?: AiOptions;
}): Promise<T> {
  validateAiOptions(options);

  const { object } = await generateObject({
    model: resolveModel(options),
    schema,
    messages,
    temperature: 0.1,
    maxOutputTokens: options.maxOutputTokens,
    abortSignal: AbortSignal.timeout(options.timeoutMs),
  });

  return object;
}

export function validateAiOptions(options: AiOptions): void {
  if (requiresApiKey(options.provider) && !options.apiKey) {
    throw new Error(`${apiKeyEnvHint(options.provider)} is required when AI_PROVIDER=${options.provider}.`);
  }

  if (options.provider === "openai-compatible" && !options.baseUrl) {
    throw new Error('AI_BASE_URL is required when AI_PROVIDER=openai-compatible.');
  }
}

function resolveModel(options: AiOptions): LanguageModel {
  switch (options.provider) {
    case "openai":
      return createOpenAI({
        apiKey: options.apiKey,
        baseURL: options.baseUrl,
      })(options.model);
    case "anthropic":
      return createAnthropic({ apiKey: options.apiKey })(options.model);
    case "ollama":
    case "openrouter":
    case "openai-compatible":
      return createOpenAICompatible({
        name: options.provider,
        baseURL: requireBaseUrl(options),
        apiKey: options.apiKey,
        headers: openRouterHeaders(options.provider),
        // Local/compatible servers must opt in so generateObject sends the JSON schema.
        supportsStructuredOutputs: true,
      })(options.model);
  }
}

function parseProvider(value: string | undefined): AiProvider {
  if (!value) return "ollama";
  if (
    value === "ollama" ||
    value === "openai-compatible" ||
    value === "openrouter" ||
    value === "openai" ||
    value === "anthropic"
  ) {
    return value;
  }
  throw new Error(`Unknown AI_PROVIDER: ${value}`);
}

function resolveModelName(provider: AiProvider): string {
  const explicit = process.env.AI_MODEL ?? process.env.LOCAL_AI_MODEL;
  if (explicit) return explicit;
  if (provider === "openai-compatible") {
    throw new Error("AI_MODEL is required when AI_PROVIDER=openai-compatible.");
  }
  return defaultModels[provider];
}

function defaultBaseUrl(provider: AiProvider): string | undefined {
  if (provider === "ollama") return defaultOllamaBaseUrl;
  if (provider === "openrouter") return defaultOpenRouterBaseUrl;
  return undefined;
}

function resolveApiKey(provider: AiProvider): string | undefined {
  if (provider === "openai") {
    return process.env.OPENAI_API_KEY ?? process.env.AI_API_KEY;
  }
  if (provider === "anthropic") {
    return process.env.ANTHROPIC_API_KEY ?? process.env.AI_API_KEY;
  }
  if (provider === "openrouter") {
    return process.env.OPENROUTER_API_KEY ?? process.env.AI_API_KEY;
  }
  return process.env.AI_API_KEY;
}

function requiresApiKey(provider: AiProvider): boolean {
  return provider === "openai" || provider === "anthropic" || provider === "openrouter";
}

function apiKeyEnvHint(provider: AiProvider): string {
  if (provider === "openai") return "OPENAI_API_KEY";
  if (provider === "anthropic") return "ANTHROPIC_API_KEY";
  if (provider === "openrouter") return "OPENROUTER_API_KEY";
  return "AI_API_KEY";
}

function parsePositiveInt(raw: string | undefined, fallback: number, name: string): number {
  if (raw === undefined || raw === "") return fallback;

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0 || !Number.isInteger(value)) {
    throw new Error(`${name} must be a positive integer. Received: ${JSON.stringify(raw)}`);
  }

  return value;
}

function requireBaseUrl(options: AiOptions): string {
  if (!options.baseUrl) {
    throw new Error(`AI_BASE_URL is required for provider "${options.provider}".`);
  }
  return options.baseUrl;
}

function openRouterHeaders(provider: AiProvider): Record<string, string> | undefined {
  if (provider !== "openrouter") return undefined;

  return {
    "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER ?? "https://codemap.dev",
    "X-Title": process.env.OPENROUTER_APP_NAME ?? "Codemap",
  };
}
