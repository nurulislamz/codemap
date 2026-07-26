import { afterEach, describe, expect, it, vi } from "vitest";

import { getAiOptions, validateAiOptions, type AiOptions } from "./ai-client";

const envKeys = [
  "AI_PROVIDER",
  "AI_MODEL",
  "AI_BASE_URL",
  "AI_API_KEY",
  "AI_TIMEOUT_MS",
  "AI_MAX_OUTPUT_TOKENS",
  "LOCAL_AI_MODEL",
  "LOCAL_AI_BASE_URL",
  "LOCAL_AI_TIMEOUT_MS",
  "LOCAL_AI_MAX_OUTPUT_TOKENS",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "OPENROUTER_API_KEY",
] as const;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getAiOptions", () => {
  it("defaults to local ollama settings", () => {
    for (const key of envKeys) {
      vi.stubEnv(key, undefined);
    }

    expect(getAiOptions()).toEqual({
      provider: "ollama",
      model: "qwen2.5:7b-instruct",
      baseUrl: "http://localhost:11434/v1",
      apiKey: undefined,
      timeoutMs: 60_000,
      maxOutputTokens: 2_000,
    });
  });

  it("uses provider-specific default models", () => {
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("OPENAI_API_KEY", "sk-test");

    expect(getAiOptions().model).toBe("gpt-4o-mini");
  });

  it("prefers provider-specific API keys over AI_API_KEY", () => {
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("OPENAI_API_KEY", "sk-openai");
    vi.stubEnv("AI_API_KEY", "sk-generic");

    expect(getAiOptions().apiKey).toBe("sk-openai");
  });

  it("falls back to AI_API_KEY when provider-specific key is missing", () => {
    vi.stubEnv("AI_PROVIDER", "anthropic");
    vi.stubEnv("AI_API_KEY", "sk-generic");

    expect(getAiOptions().apiKey).toBe("sk-generic");
  });

  it("reads legacy LOCAL_AI_* env vars", () => {
    vi.stubEnv("LOCAL_AI_MODEL", "llama3.2");
    vi.stubEnv("LOCAL_AI_BASE_URL", "http://127.0.0.1:11434/v1");
    vi.stubEnv("LOCAL_AI_TIMEOUT_MS", "45000");
    vi.stubEnv("LOCAL_AI_MAX_OUTPUT_TOKENS", "1500");

    expect(getAiOptions()).toMatchObject({
      model: "llama3.2",
      baseUrl: "http://127.0.0.1:11434/v1",
      timeoutMs: 45_000,
      maxOutputTokens: 1_500,
    });
  });

  it("throws for unknown providers", () => {
    vi.stubEnv("AI_PROVIDER", "unknown");

    expect(() => getAiOptions()).toThrow('Unknown AI_PROVIDER: unknown');
  });

  it("throws when openai-compatible is used without AI_MODEL", () => {
    vi.stubEnv("AI_PROVIDER", "openai-compatible");
    vi.stubEnv("AI_BASE_URL", "http://localhost:1234/v1");

    expect(() => getAiOptions()).toThrow("AI_MODEL is required when AI_PROVIDER=openai-compatible.");
  });

  it("throws for invalid timeout values", () => {
    vi.stubEnv("AI_TIMEOUT_MS", "abc");

    expect(() => getAiOptions()).toThrow("AI_TIMEOUT_MS must be a positive integer.");
  });

  it("throws for zero max output tokens", () => {
    vi.stubEnv("AI_MAX_OUTPUT_TOKENS", "0");

    expect(() => getAiOptions()).toThrow("AI_MAX_OUTPUT_TOKENS must be a positive integer.");
  });
});

describe("validateAiOptions", () => {
  it("requires an API key for hosted providers", () => {
    const options: AiOptions = {
      provider: "openai",
      model: "gpt-4o-mini",
      baseUrl: undefined,
      apiKey: undefined,
      timeoutMs: 60_000,
      maxOutputTokens: 2_000,
    };

    expect(() => validateAiOptions(options)).toThrow(
      "OPENAI_API_KEY is required when AI_PROVIDER=openai.",
    );
  });

  it("requires AI_BASE_URL for openai-compatible providers", () => {
    const options: AiOptions = {
      provider: "openai-compatible",
      model: "custom-model",
      baseUrl: undefined,
      apiKey: undefined,
      timeoutMs: 60_000,
      maxOutputTokens: 2_000,
    };

    expect(() => validateAiOptions(options)).toThrow(
      "AI_BASE_URL is required when AI_PROVIDER=openai-compatible.",
    );
  });

  it("allows ollama without an API key", () => {
    const options: AiOptions = {
      provider: "ollama",
      model: "qwen2.5:7b-instruct",
      baseUrl: "http://localhost:11434/v1",
      apiKey: undefined,
      timeoutMs: 60_000,
      maxOutputTokens: 2_000,
    };

    expect(() => validateAiOptions(options)).not.toThrow();
  });
});
