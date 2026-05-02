import { describe, expect, it } from "vitest";
import { createEnv } from "./env";

describe("createEnv", () => {
  it("parses even when Supabase settings are missing (offline/local mode)", () => {
    const env = createEnv({});
    expect(env.APP_BASE_URL).toBeTruthy();
  });

  it("parses a complete environment", () => {
    const env = createEnv({
      CRON_SECRET: "secret-secret-secret",
      RESEND_API_KEY: "resend",
      EMAIL_FROM: "Learning <learning@example.com>",
      OPENAI_API_KEY: "openai",
      OWNER_EMAIL: "owner@example.com",
      APP_BASE_URL: "http://localhost:3000",
      AI_FLASHCARDS_ENABLED: "false",
    });

    expect(env.OWNER_EMAIL).toBe("owner@example.com");
    expect(env.AI_FLASHCARDS_ENABLED).toBe(false);
  });

  it("defaults AI flashcards to disabled", () => {
    const env = createEnv({
      CRON_SECRET: "secret-secret-secret",
      RESEND_API_KEY: "resend",
      EMAIL_FROM: "Learning <learning@example.com>",
      OPENAI_API_KEY: "openai",
      OWNER_EMAIL: "owner@example.com",
      APP_BASE_URL: "http://localhost:3000",
    });

    expect(env.AI_FLASHCARDS_ENABLED).toBe(false);
  });
});
