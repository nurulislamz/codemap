import { z } from "zod";

type EnvInput = Record<string, string | undefined>;

const envSchema = z.object({
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(16).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OWNER_EMAIL: z.string().email().optional(),
  AI_FLASHCARDS_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type AppEnv = z.infer<typeof envSchema>;

export function createEnv(input: EnvInput): AppEnv {
  return envSchema.parse(input);
}

export function getEnv(): AppEnv {
  return createEnv(process.env);
}

export function requireEnv<T extends keyof AppEnv>(
  env: AppEnv,
  key: T,
): NonNullable<AppEnv[T]> {
  const value = env[key];
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing required environment variable: ${String(key)}`);
  }
  return value as NonNullable<AppEnv[T]>;
}
