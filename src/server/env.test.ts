import { describe, expect, it } from "vitest";
import { createEnv } from "./env";

describe("createEnv", () => {
  it("requires Supabase, cron, email, AI, owner, and app URL settings", () => {
    expect(() => createEnv({})).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("parses a complete environment", () => {
    const env = createEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
      SUPABASE_DB_URL: "postgres://user:pass@localhost:5432/postgres",
      CRON_SECRET: "secret",
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
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
      SUPABASE_DB_URL: "postgres://user:pass@localhost:5432/postgres",
      CRON_SECRET: "secret",
      RESEND_API_KEY: "resend",
      EMAIL_FROM: "Learning <learning@example.com>",
      OPENAI_API_KEY: "openai",
      OWNER_EMAIL: "owner@example.com",
      APP_BASE_URL: "http://localhost:3000",
    });

    expect(env.AI_FLASHCARDS_ENABLED).toBe(false);
  });
});
