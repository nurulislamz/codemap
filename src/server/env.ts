import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_DB_URL: z.string().min(1),
  CRON_SECRET: z.string().min(16).or(z.literal("secret")),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  OWNER_EMAIL: z.string().email(),
  APP_BASE_URL: z.string().url(),
  AI_FLASHCARDS_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type AppEnv = z.infer<typeof envSchema>;

export function createEnv(input: NodeJS.ProcessEnv): AppEnv {
  return envSchema.parse(input);
}

export function getEnv(): AppEnv {
  return createEnv(process.env);
}
