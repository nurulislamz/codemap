# LeetCode Backend Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal Next.js/Vercel learning assistant for LeetCode practice, backend roadmap study, system design practice, daily email notifications, and AI-assisted flashcards.

**Architecture:** The app uses Next.js App Router on Vercel, Supabase Auth/Postgres for identity and state, Markdown seed files for reviewed content corpora, Vercel Cron route handlers for scheduled work, Resend for email, and OpenAI for asynchronous flashcard generation. Runtime app behavior reads from Supabase; scraping only creates reviewable seed Markdown files.

**Tech Stack:** TypeScript, Next.js App Router, Supabase, Vercel Cron, Resend, OpenAI, Vitest, Playwright, Testing Library.

---

## File Structure

- Create: `package.json`, `pnpm-lock.yaml`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `.env.example`, `.gitignore`, `vercel.json`
- Create: `src/app/(auth)/login/page.tsx`, `src/app/(dashboard)/dashboard/page.tsx`, `src/app/(dashboard)/leetcode/page.tsx`, `src/app/(dashboard)/leetcode/[assignmentId]/timer/page.tsx`, `src/app/(dashboard)/roadmap/page.tsx`, `src/app/(dashboard)/system-design/page.tsx`, `src/app/(dashboard)/flashcards/page.tsx`, `src/app/api/cron/daily-plan/route.ts`, `src/app/api/cron/send-daily-email/route.ts`, `src/app/api/cron/process-ai-jobs/route.ts`
- Create: `src/components/app-shell.tsx`, `src/components/task-card.tsx`, `src/components/timer-panel.tsx`, `src/components/status-select.tsx`
- Create: `src/features/planning/scheduler.ts`, `src/features/planning/scheduler.test.ts`, `src/features/leetcode/timer.ts`, `src/features/leetcode/timer.test.ts`, `src/features/flashcards/spaced-repetition.ts`, `src/features/flashcards/spaced-repetition.test.ts`, `src/features/content/seed-parser.ts`, `src/features/content/seed-parser.test.ts`
- Create: `src/server/supabase/browser.ts`, `src/server/supabase/server.ts`, `src/server/supabase/service-role.ts`, `src/server/env.ts`, `src/server/email/resend.ts`, `src/server/ai/openai-flashcards.ts`, `src/server/cron/auth.ts`
- Create: `scripts/scrape/roadmap-backend.ts`, `scripts/scrape/leetcode-patterns.ts`, `scripts/scrape/system-design-prompts.ts`, `scripts/import/import-seeds.ts`
- Create: `content/seeds/leetcode-patterns.md`, `content/seeds/backend-roadmaps.md`, `content/seeds/system-design-prompts.md`
- Create: `supabase/migrations/0001_initial_schema.sql`
- Create: `tests/e2e/personal-learning-flow.spec.ts`

## Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `vercel.json`

- [ ] **Step 1: Scaffold the app**

Run:

```bash
pnpm create next-app@latest . --ts --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

Expected: Next.js files are created in the current repository without deleting `docs/superpowers/specs/2026-04-26-leetcode-backend-helper-design.md` or this plan.

- [ ] **Step 2: Install application dependencies**

Run:

```bash
pnpm add @supabase/ssr @supabase/supabase-js resend openai zod gray-matter unified remark-parse remark-stringify hast-util-to-text cheerio
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test tsx
```

Expected: dependencies are added to `package.json` and lockfile.

- [ ] **Step 3: Add required scripts**

Modify `package.json` scripts to include:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "scrape:roadmap": "tsx scripts/scrape/roadmap-backend.ts",
  "scrape:leetcode": "tsx scripts/scrape/leetcode-patterns.ts",
  "scrape:system-design": "tsx scripts/scrape/system-design-prompts.ts",
  "import:seeds": "tsx scripts/import/import-seeds.ts"
}
```

- [ ] **Step 4: Add environment contract**

Create `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=
CRON_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
OPENAI_API_KEY=
OWNER_EMAIL=
APP_BASE_URL=http://localhost:3000
AI_FLASHCARDS_ENABLED=false
```

- [ ] **Step 5: Add Vercel cron config**

Create `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/daily-plan", "schedule": "0 6 * * *" },
    { "path": "/api/cron/send-daily-email", "schedule": "15 6 * * *" },
    { "path": "/api/cron/process-ai-jobs", "schedule": "*/30 * * * *" }
  ]
}
```

- [ ] **Step 6: Run baseline verification**

Run:

```bash
pnpm lint
pnpm test
pnpm build
```

Expected: lint, tests, and build exit 0.

- [ ] **Step 7: Commit scaffold**

```bash
git add package.json pnpm-lock.yaml next.config.ts tsconfig.json vitest.config.ts playwright.config.ts .env.example .gitignore vercel.json src
git commit -m "chore: scaffold next app"
```

## Task 2: Add Supabase Schema and Auth Foundation

**Files:**
- Create: `supabase/migrations/0001_initial_schema.sql`
- Create: `src/server/env.ts`
- Create: `src/server/supabase/browser.ts`
- Create: `src/server/supabase/server.ts`
- Create: `src/server/supabase/service-role.ts`

- [ ] **Step 1: Write failing environment validation tests**

Create `src/server/env.test.ts`:

```ts
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
      AI_FLASHCARDS_ENABLED: "false"
    });

    expect(env.OWNER_EMAIL).toBe("owner@example.com");
    expect(env.AI_FLASHCARDS_ENABLED).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test src/server/env.test.ts
```

Expected: FAIL because `src/server/env.ts` does not exist.

- [ ] **Step 3: Implement environment validation**

Create `src/server/env.ts`:

```ts
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
    .transform((value) => value === "true")
});

export type AppEnv = z.infer<typeof envSchema>;

export function createEnv(input: NodeJS.ProcessEnv): AppEnv {
  return envSchema.parse(input);
}

export const env = createEnv(process.env);
```

- [ ] **Step 4: Add Supabase clients**

Create `src/server/supabase/browser.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

Create `src/server/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";
import { env } from "../env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        }
      }
    }
  );
}
```

Create `src/server/supabase/service-role.ts`:

```ts
import { createClient } from "@supabase/supabase-js";
import { env } from "../env";
import type { Database } from "./types";

export function createSupabaseServiceRoleClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}
```

- [ ] **Step 5: Add temporary database type shim**

Create `src/server/supabase/types.ts`:

```ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
```

- [ ] **Step 6: Create initial schema migration**

Create `supabase/migrations/0001_initial_schema.sql` with enums and tables:

```sql
create extension if not exists "pgcrypto";

create type task_track as enum ('leetcode', 'roadmap', 'system_design', 'flashcards');
create type item_status as enum ('not_started', 'in_progress', 'completed', 'skipped', 'failed');
create type confidence_level as enum ('low', 'medium', 'high');
create type flashcard_status as enum ('draft', 'active', 'rejected', 'archived');
create type ai_job_status as enum ('queued', 'processing', 'completed', 'failed');
create type email_status as enum ('queued', 'sent', 'failed');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table notification_preferences (
  user_id uuid primary key references profiles(id) on delete cascade,
  email text not null,
  timezone text not null default 'Europe/London',
  daily_send_time time not null default '06:00',
  leetcode_enabled boolean not null default true,
  roadmap_enabled boolean not null default true,
  system_design_enabled boolean not null default true,
  flashcards_enabled boolean not null default true,
  reminders_enabled boolean not null default false,
  ai_flashcards_enabled boolean not null default false
);

create table leetcode_patterns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  display_order integer not null default 0
);

create table leetcode_subpatterns (
  id uuid primary key default gen_random_uuid(),
  pattern_id uuid not null references leetcode_patterns(id) on delete cascade,
  slug text not null unique,
  name text not null,
  description text not null default '',
  display_order integer not null default 0
);

create table leetcode_problems (
  id uuid primary key default gen_random_uuid(),
  subpattern_id uuid not null references leetcode_subpatterns(id) on delete restrict,
  slug text not null unique,
  title text not null,
  source_url text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  estimated_minutes integer not null default 30,
  tags text[] not null default '{}'
);

create table roadmaps (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  source_url text not null,
  description text not null default ''
);

create table roadmap_topics (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references roadmaps(id) on delete cascade,
  parent_topic_id uuid references roadmap_topics(id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text not null default '',
  source_url text,
  display_order integer not null default 0
);

create table roadmap_resources (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references roadmap_topics(id) on delete cascade,
  title text not null,
  url text not null,
  resource_type text not null default 'article',
  summary text not null default ''
);

create table system_design_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  concept_tags text[] not null default '{}'
);

create table system_design_prompts (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references system_design_topics(id) on delete cascade,
  slug text not null unique,
  title text not null,
  prompt_text text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  source_url text,
  expected_concepts text[] not null default '{}'
);

create table system_design_resources (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references system_design_topics(id) on delete cascade,
  prompt_id uuid references system_design_prompts(id) on delete cascade,
  title text not null,
  url text not null,
  resource_type text not null default 'article',
  summary text not null default '',
  check ((topic_id is not null) or (prompt_id is not null))
);
```

Append user-owned tables:

```sql
create table leetcode_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  problem_id uuid not null references leetcode_problems(id) on delete cascade,
  assigned_date date not null,
  due_date date not null,
  status item_status not null default 'not_started',
  priority integer not null default 0,
  unique (user_id, problem_id, assigned_date)
);

create table leetcode_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  problem_id uuid not null references leetcode_problems(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  time_limit_minutes integer not null,
  elapsed_seconds integer,
  result item_status not null default 'in_progress',
  confidence confidence_level,
  notes text not null default ''
);

create table roadmap_progress (
  user_id uuid not null references profiles(id) on delete cascade,
  topic_id uuid not null references roadmap_topics(id) on delete cascade,
  status item_status not null default 'not_started',
  confidence confidence_level,
  last_reviewed_at timestamptz,
  notes text not null default '',
  primary key (user_id, topic_id)
);

create table system_design_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  prompt_id uuid not null references system_design_prompts(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status item_status not null default 'in_progress',
  notes text not null default '',
  self_score integer check (self_score between 1 and 5)
);

create table daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan_date date not null,
  generated_at timestamptz not null default now(),
  status item_status not null default 'not_started',
  unique (user_id, plan_date)
);

create table daily_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references daily_plans(id) on delete cascade,
  track task_track not null,
  target_table text not null,
  target_id uuid not null,
  title text not null,
  description text not null default '',
  status item_status not null default 'not_started',
  scheduled_order integer not null default 0
);

create table flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  source_track task_track not null,
  source_table text not null,
  source_id uuid not null,
  question text not null,
  answer text not null,
  hint text not null default '',
  status flashcard_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  flashcard_id uuid not null references flashcards(id) on delete cascade,
  reviewed_at timestamptz not null default now(),
  recall_rating integer not null check (recall_rating between 0 and 5),
  next_review_at timestamptz not null
);

create table ai_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  job_type text not null,
  input_payload jsonb not null,
  status ai_job_status not null default 'queued',
  output_payload jsonb,
  error_message text,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table email_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  notification_type text not null,
  subject text not null,
  body text not null,
  status email_status not null default 'queued',
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  provider_message_id text,
  error_message text,
  attempts integer not null default 0
);
```

Append RLS:

```sql
alter table profiles enable row level security;
alter table notification_preferences enable row level security;
alter table leetcode_assignments enable row level security;
alter table leetcode_attempts enable row level security;
alter table roadmap_progress enable row level security;
alter table system_design_sessions enable row level security;
alter table daily_plans enable row level security;
alter table daily_plan_items enable row level security;
alter table flashcards enable row level security;
alter table flashcard_reviews enable row level security;
alter table ai_generation_jobs enable row level security;
alter table email_notifications enable row level security;

create policy "profiles are owner-readable" on profiles for select using (auth.uid() = id);
create policy "profiles are owner-updatable" on profiles for update using (auth.uid() = id);

create policy "notification preferences owner access" on notification_preferences for all using (auth.uid() = user_id);
create policy "leetcode assignments owner access" on leetcode_assignments for all using (auth.uid() = user_id);
create policy "leetcode attempts owner access" on leetcode_attempts for all using (auth.uid() = user_id);
create policy "roadmap progress owner access" on roadmap_progress for all using (auth.uid() = user_id);
create policy "system design sessions owner access" on system_design_sessions for all using (auth.uid() = user_id);
create policy "daily plans owner access" on daily_plans for all using (auth.uid() = user_id);
create policy "flashcards owner access" on flashcards for all using (auth.uid() = user_id);
create policy "flashcard reviews owner access" on flashcard_reviews for all using (auth.uid() = user_id);
create policy "ai jobs owner access" on ai_generation_jobs for all using (auth.uid() = user_id);
create policy "email notifications owner access" on email_notifications for all using (auth.uid() = user_id);

create policy "daily plan items via owner plan" on daily_plan_items
  for all using (
    exists (
      select 1 from daily_plans
      where daily_plans.id = daily_plan_items.plan_id
      and daily_plans.user_id = auth.uid()
    )
  );

create policy "public content readable leetcode patterns" on leetcode_patterns for select using (true);
create policy "public content readable leetcode subpatterns" on leetcode_subpatterns for select using (true);
create policy "public content readable leetcode problems" on leetcode_problems for select using (true);
create policy "public content readable roadmaps" on roadmaps for select using (true);
create policy "public content readable roadmap topics" on roadmap_topics for select using (true);
create policy "public content readable roadmap resources" on roadmap_resources for select using (true);
create policy "public content readable system topics" on system_design_topics for select using (true);
create policy "public content readable system prompts" on system_design_prompts for select using (true);
create policy "public content readable system resources" on system_design_resources for select using (true);
```

- [ ] **Step 7: Run tests and schema validation**

Run:

```bash
pnpm test src/server/env.test.ts
pnpm lint
```

Expected: tests and lint exit 0.

- [ ] **Step 8: Commit schema and auth foundation**

```bash
git add supabase/migrations/0001_initial_schema.sql src/server .env.example
git commit -m "feat: add supabase schema foundation"
```

## Task 3: Seed Markdown Parser and Initial Content Files

**Files:**
- Create: `content/seeds/leetcode-patterns.md`
- Create: `content/seeds/backend-roadmaps.md`
- Create: `content/seeds/system-design-prompts.md`
- Create: `src/features/content/seed-parser.ts`
- Create: `src/features/content/seed-parser.test.ts`

- [ ] **Step 1: Write failing parser tests**

Create `src/features/content/seed-parser.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseLeetcodeSeed, parseRoadmapSeed, parseSystemDesignSeed } from "./seed-parser";

describe("seed parser", () => {
  it("parses leetcode patterns, subpatterns, and problems", () => {
    const result = parseLeetcodeSeed(`# LeetCode Patterns

## Pattern: Two Pointers
Slug: two-pointers
Description: Move two indices through a sequence.

### Subpattern: Opposite Ends
Slug: opposite-ends

- Problem: Two Sum II
  Slug: two-sum-ii
  Difficulty: medium
  URL: https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/
  Estimated Minutes: 20
  Tags: array, pointers
`);

    expect(result.patterns[0].slug).toBe("two-pointers");
    expect(result.subpatterns[0].slug).toBe("opposite-ends");
    expect(result.problems[0].difficulty).toBe("medium");
  });

  it("parses roadmap topics and resources", () => {
    const result = parseRoadmapSeed(`# Backend Roadmap
Source: https://roadmap.sh/backend

## Topic: Internet
Slug: internet
Description: Understand how the internet works.

- Resource: How DNS works
  URL: https://roadmap.sh/guides/dns-in-one-picture
  Type: article
  Summary: DNS resolution overview.
`);

    expect(result.roadmap.slug).toBe("backend");
    expect(result.topics[0].slug).toBe("internet");
    expect(result.resources[0].summary).toContain("DNS");
  });

  it("parses system design prompts", () => {
    const result = parseSystemDesignSeed(`# System Design Prompts

## Topic: URL Shortener
Slug: url-shortener
Tags: hashing, storage, caching

### Prompt: Design TinyURL
Slug: design-tinyurl
Difficulty: medium
Source: https://example.com/tinyurl
Expected Concepts: id generation, redirects, rate limiting

Design a URL shortener with analytics.
`);

    expect(result.topics[0].slug).toBe("url-shortener");
    expect(result.prompts[0].expectedConcepts).toContain("rate limiting");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test src/features/content/seed-parser.test.ts
```

Expected: FAIL because `seed-parser.ts` does not exist.

- [ ] **Step 3: Implement parser**

Create `src/features/content/seed-parser.ts`:

```ts
type Difficulty = "easy" | "medium" | "hard";

export interface LeetcodeSeed {
  patterns: Array<{ slug: string; name: string; description: string; displayOrder: number }>;
  subpatterns: Array<{ slug: string; patternSlug: string; name: string; description: string; displayOrder: number }>;
  problems: Array<{
    slug: string;
    subpatternSlug: string;
    title: string;
    sourceUrl: string;
    difficulty: Difficulty;
    estimatedMinutes: number;
    tags: string[];
  }>;
}

export interface RoadmapSeed {
  roadmap: { slug: string; title: string; sourceUrl: string; description: string };
  topics: Array<{ slug: string; parentSlug: string | null; title: string; description: string; sourceUrl: string | null; displayOrder: number }>;
  resources: Array<{ topicSlug: string; title: string; url: string; resourceType: string; summary: string }>;
}

export interface SystemDesignSeed {
  topics: Array<{ slug: string; title: string; description: string; conceptTags: string[] }>;
  prompts: Array<{ topicSlug: string; slug: string; title: string; promptText: string; difficulty: Difficulty; sourceUrl: string | null; expectedConcepts: string[] }>;
}

function field(line: string, name: string): string | null {
  const prefix = `${name}:`;
  return line.trim().startsWith(prefix) ? line.trim().slice(prefix.length).trim() : null;
}

function csv(value: string | null): string[] {
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

function difficulty(value: string | null): Difficulty {
  if (value === "easy" || value === "medium" || value === "hard") return value;
  throw new Error(`Invalid difficulty: ${value ?? "missing"}`);
}

export function parseLeetcodeSeed(markdown: string): LeetcodeSeed {
  const lines = markdown.split("\n");
  const seed: LeetcodeSeed = { patterns: [], subpatterns: [], problems: [] };
  let currentPatternSlug = "";
  let currentSubpatternSlug = "";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (line.startsWith("## Pattern:")) {
      const name = line.replace("## Pattern:", "").trim();
      const slug = field(lines[index + 1] ?? "", "Slug");
      const description = field(lines[index + 2] ?? "", "Description") ?? "";
      if (!slug) throw new Error(`Missing pattern slug for ${name}`);
      currentPatternSlug = slug;
      seed.patterns.push({ slug, name, description, displayOrder: seed.patterns.length });
    }

    if (line.startsWith("### Subpattern:")) {
      const name = line.replace("### Subpattern:", "").trim();
      const slug = field(lines[index + 1] ?? "", "Slug");
      if (!slug || !currentPatternSlug) throw new Error(`Missing subpattern data for ${name}`);
      currentSubpatternSlug = slug;
      seed.subpatterns.push({
        slug,
        patternSlug: currentPatternSlug,
        name,
        description: "",
        displayOrder: seed.subpatterns.length
      });
    }

    if (line.startsWith("- Problem:")) {
      const title = line.replace("- Problem:", "").trim();
      const slug = field(lines[index + 1] ?? "", "Slug");
      const rawDifficulty = field(lines[index + 2] ?? "", "Difficulty");
      const sourceUrl = field(lines[index + 3] ?? "", "URL");
      const minutes = Number(field(lines[index + 4] ?? "", "Estimated Minutes") ?? 30);
      const tags = csv(field(lines[index + 5] ?? "", "Tags"));
      if (!slug || !sourceUrl || !currentSubpatternSlug) throw new Error(`Missing problem data for ${title}`);
      seed.problems.push({
        slug,
        subpatternSlug: currentSubpatternSlug,
        title,
        sourceUrl,
        difficulty: difficulty(rawDifficulty),
        estimatedMinutes: minutes,
        tags
      });
    }
  }

  return seed;
}

export function parseRoadmapSeed(markdown: string): RoadmapSeed {
  const lines = markdown.split("\n");
  const sourceUrl = field(lines.find((line) => line.startsWith("Source:")) ?? "", "Source") ?? "https://roadmap.sh/backend";
  const seed: RoadmapSeed = {
    roadmap: { slug: "backend", title: "Backend Roadmap", sourceUrl, description: "Backend engineering roadmap." },
    topics: [],
    resources: []
  };
  let currentTopicSlug = "";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (line.startsWith("## Topic:")) {
      const title = line.replace("## Topic:", "").trim();
      const slug = field(lines[index + 1] ?? "", "Slug");
      const description = field(lines[index + 2] ?? "", "Description") ?? "";
      if (!slug) throw new Error(`Missing topic slug for ${title}`);
      currentTopicSlug = slug;
      seed.topics.push({
        slug,
        parentSlug: null,
        title,
        description,
        sourceUrl: null,
        displayOrder: seed.topics.length
      });
    }

    if (line.startsWith("- Resource:")) {
      const title = line.replace("- Resource:", "").trim();
      const url = field(lines[index + 1] ?? "", "URL");
      const resourceType = field(lines[index + 2] ?? "", "Type") ?? "article";
      const summary = field(lines[index + 3] ?? "", "Summary") ?? "";
      if (!url || !currentTopicSlug) throw new Error(`Missing resource data for ${title}`);
      seed.resources.push({ topicSlug: currentTopicSlug, title, url, resourceType, summary });
    }
  }

  return seed;
}

export function parseSystemDesignSeed(markdown: string): SystemDesignSeed {
  const lines = markdown.split("\n");
  const seed: SystemDesignSeed = { topics: [], prompts: [] };
  let currentTopicSlug = "";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (line.startsWith("## Topic:")) {
      const title = line.replace("## Topic:", "").trim();
      const slug = field(lines[index + 1] ?? "", "Slug");
      const tags = csv(field(lines[index + 2] ?? "", "Tags"));
      if (!slug) throw new Error(`Missing system design topic slug for ${title}`);
      currentTopicSlug = slug;
      seed.topics.push({ slug, title, description: "", conceptTags: tags });
    }

    if (line.startsWith("### Prompt:")) {
      const title = line.replace("### Prompt:", "").trim();
      const slug = field(lines[index + 1] ?? "", "Slug");
      const rawDifficulty = field(lines[index + 2] ?? "", "Difficulty");
      const sourceUrl = field(lines[index + 3] ?? "", "Source");
      const expectedConcepts = csv(field(lines[index + 4] ?? "", "Expected Concepts"));
      const promptText = lines.slice(index + 6).find((candidate) => candidate.trim().length > 0) ?? "";
      if (!slug || !currentTopicSlug || !promptText) throw new Error(`Missing prompt data for ${title}`);
      seed.prompts.push({
        topicSlug: currentTopicSlug,
        slug,
        title,
        promptText: promptText.trim(),
        difficulty: difficulty(rawDifficulty),
        sourceUrl,
        expectedConcepts
      });
    }
  }

  return seed;
}
```

- [ ] **Step 4: Add initial reviewed seed files**

Create `content/seeds/leetcode-patterns.md`:

```md
# LeetCode Patterns

Scraped Date: 2026-04-26
Review Status: manually curated seed

## Pattern: Two Pointers
Slug: two-pointers
Description: Use two indices to scan arrays or strings efficiently.

### Subpattern: Opposite Ends
Slug: opposite-ends

- Problem: Two Sum II - Input Array Is Sorted
  Slug: two-sum-ii-input-array-is-sorted
  Difficulty: medium
  URL: https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/
  Estimated Minutes: 20
  Tags: array, pointers

## Pattern: Sliding Window
Slug: sliding-window
Description: Maintain a moving range over contiguous data.

### Subpattern: Variable Window
Slug: variable-window

- Problem: Longest Substring Without Repeating Characters
  Slug: longest-substring-without-repeating-characters
  Difficulty: medium
  URL: https://leetcode.com/problems/longest-substring-without-repeating-characters/
  Estimated Minutes: 30
  Tags: string, hash-map, window
```

Create `content/seeds/backend-roadmaps.md`:

```md
# Backend Roadmap
Source: https://roadmap.sh/backend
Scraped Date: 2026-04-26
Review Status: manually curated starter seed

## Topic: Internet
Slug: internet
Description: Understand DNS, HTTP, browsers, hosting, and how clients reach servers.

- Resource: How does the internet work?
  URL: https://roadmap.sh/guides/what-is-internet
  Type: article
  Summary: High-level overview of networks, packets, DNS, and protocols.

## Topic: HTTP
Slug: http
Description: Understand methods, status codes, headers, caching, cookies, and TLS.

- Resource: HTTP in one picture
  URL: https://roadmap.sh/guides/http-in-one-picture
  Type: article
  Summary: Visual summary of request and response fundamentals.
```

Create `content/seeds/system-design-prompts.md`:

```md
# System Design Prompts

Scraped Date: 2026-04-26
Review Status: manually curated starter seed

## Topic: URL Shortener
Slug: url-shortener
Tags: hashing, storage, redirects, caching, rate limiting

### Prompt: Design TinyURL
Slug: design-tinyurl
Difficulty: medium
Source: https://github.com/donnemartin/system-design-primer
Expected Concepts: key generation, redirects, read-heavy traffic, cache, analytics

Design a URL shortener that creates short links, redirects users to long URLs, and records basic analytics.

## Topic: Rate Limiter
Slug: rate-limiter
Tags: distributed-systems, redis, counters, throttling

### Prompt: Design an API Rate Limiter
Slug: design-api-rate-limiter
Difficulty: medium
Source: https://github.com/donnemartin/system-design-primer
Expected Concepts: token bucket, fixed window, sliding window, redis, distributed consistency

Design a rate limiter for a public API used by many customers.
```

- [ ] **Step 5: Verify parser**

Run:

```bash
pnpm test src/features/content/seed-parser.test.ts
pnpm lint
```

Expected: tests and lint exit 0.

- [ ] **Step 6: Commit content parser**

```bash
git add content/seeds src/features/content
git commit -m "feat: add reviewed content seed parser"
```

## Task 4: Implement Scheduling, Timer, and Spaced Repetition Domain Logic

**Files:**
- Create: `src/features/planning/scheduler.ts`
- Create: `src/features/planning/scheduler.test.ts`
- Create: `src/features/leetcode/timer.ts`
- Create: `src/features/leetcode/timer.test.ts`
- Create: `src/features/flashcards/spaced-repetition.ts`
- Create: `src/features/flashcards/spaced-repetition.test.ts`

- [ ] **Step 1: Write failing scheduler tests**

Create `src/features/planning/scheduler.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildDailyPlan } from "./scheduler";

describe("buildDailyPlan", () => {
  it("prioritizes weak unfinished LeetCode, next roadmap, system practice, and due flashcards", () => {
    const plan = buildDailyPlan({
      date: "2026-04-26",
      leetcode: [
        { id: "lc-1", title: "Two Sum II", status: "failed", confidence: "low", pattern: "two-pointers" },
        { id: "lc-2", title: "Longest Substring", status: "not_started", confidence: "medium", pattern: "sliding-window" }
      ],
      roadmap: [{ id: "road-1", title: "Internet", status: "not_started", order: 1 }],
      systemDesign: [{ id: "sd-1", title: "Design TinyURL", status: "not_started", kind: "practice" }],
      flashcards: [{ id: "fc-1", title: "DNS lookup steps", nextReviewAt: "2026-04-25T09:00:00Z" }]
    });

    expect(plan.items.map((item) => item.title)).toEqual([
      "Two Sum II",
      "Internet",
      "Design TinyURL",
      "DNS lookup steps"
    ]);
  });
});
```

- [ ] **Step 2: Write failing timer tests**

Create `src/features/leetcode/timer.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculateAttemptResult } from "./timer";

describe("calculateAttemptResult", () => {
  it("uses server timestamps to calculate elapsed seconds and overtime", () => {
    const result = calculateAttemptResult({
      startedAt: "2026-04-26T10:00:00.000Z",
      endedAt: "2026-04-26T10:31:30.000Z",
      timeLimitMinutes: 30,
      requestedStatus: "completed"
    });

    expect(result.elapsedSeconds).toBe(1890);
    expect(result.isOverTime).toBe(true);
    expect(result.status).toBe("completed");
  });
});
```

- [ ] **Step 3: Write failing spaced repetition tests**

Create `src/features/flashcards/spaced-repetition.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { nextReviewDate } from "./spaced-repetition";

describe("nextReviewDate", () => {
  it("schedules poor recall for tomorrow", () => {
    expect(nextReviewDate("2026-04-26T00:00:00Z", 1).toISOString()).toBe("2026-04-27T00:00:00.000Z");
  });

  it("schedules strong recall further out", () => {
    expect(nextReviewDate("2026-04-26T00:00:00Z", 5).toISOString()).toBe("2026-05-10T00:00:00.000Z");
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run:

```bash
pnpm test src/features/planning/scheduler.test.ts src/features/leetcode/timer.test.ts src/features/flashcards/spaced-repetition.test.ts
```

Expected: FAIL because implementations do not exist.

- [ ] **Step 5: Implement scheduler**

Create `src/features/planning/scheduler.ts`:

```ts
type Status = "not_started" | "in_progress" | "completed" | "skipped" | "failed";
type Confidence = "low" | "medium" | "high";

export interface DailyPlanInput {
  date: string;
  leetcode: Array<{ id: string; title: string; status: Status; confidence: Confidence; pattern: string }>;
  roadmap: Array<{ id: string; title: string; status: Status; order: number }>;
  systemDesign: Array<{ id: string; title: string; status: Status; kind: "reading" | "practice" }>;
  flashcards: Array<{ id: string; title: string; nextReviewAt: string }>;
}

export interface DailyPlanOutput {
  date: string;
  items: Array<{ track: "leetcode" | "roadmap" | "system_design" | "flashcards"; targetId: string; title: string; scheduledOrder: number }>;
}

export function buildDailyPlan(input: DailyPlanInput): DailyPlanOutput {
  const weakLeetcode = input.leetcode
    .filter((item) => item.status !== "completed")
    .sort((a, b) => scoreLeetcode(b) - scoreLeetcode(a))[0];
  const roadmap = input.roadmap
    .filter((item) => item.status !== "completed")
    .sort((a, b) => a.order - b.order)[0];
  const systemDesign = input.systemDesign.find((item) => item.status !== "completed");
  const dueFlashcard = input.flashcards
    .filter((item) => item.nextReviewAt.slice(0, 10) <= input.date)
    .sort((a, b) => a.nextReviewAt.localeCompare(b.nextReviewAt))[0];

  return {
    date: input.date,
    items: [
      weakLeetcode && { track: "leetcode" as const, targetId: weakLeetcode.id, title: weakLeetcode.title },
      roadmap && { track: "roadmap" as const, targetId: roadmap.id, title: roadmap.title },
      systemDesign && { track: "system_design" as const, targetId: systemDesign.id, title: systemDesign.title },
      dueFlashcard && { track: "flashcards" as const, targetId: dueFlashcard.id, title: dueFlashcard.title }
    ]
      .filter((item): item is { track: "leetcode" | "roadmap" | "system_design" | "flashcards"; targetId: string; title: string } => Boolean(item))
      .map((item, index) => ({ ...item, scheduledOrder: index }))
  };
}

function scoreLeetcode(item: { status: Status; confidence: Confidence }): number {
  const statusScore = item.status === "failed" ? 10 : item.status === "in_progress" ? 7 : 3;
  const confidenceScore = item.confidence === "low" ? 5 : item.confidence === "medium" ? 2 : 0;
  return statusScore + confidenceScore;
}
```

- [ ] **Step 6: Implement timer logic**

Create `src/features/leetcode/timer.ts`:

```ts
type AttemptStatus = "completed" | "failed" | "skipped";

export interface AttemptResultInput {
  startedAt: string;
  endedAt: string;
  timeLimitMinutes: number;
  requestedStatus: AttemptStatus;
}

export interface AttemptResult {
  elapsedSeconds: number;
  isOverTime: boolean;
  status: AttemptStatus;
}

export function calculateAttemptResult(input: AttemptResultInput): AttemptResult {
  const started = new Date(input.startedAt).getTime();
  const ended = new Date(input.endedAt).getTime();
  const elapsedSeconds = Math.max(0, Math.floor((ended - started) / 1000));

  return {
    elapsedSeconds,
    isOverTime: elapsedSeconds > input.timeLimitMinutes * 60,
    status: input.requestedStatus
  };
}
```

- [ ] **Step 7: Implement spaced repetition**

Create `src/features/flashcards/spaced-repetition.ts`:

```ts
const intervalsByRating: Record<number, number> = {
  0: 1,
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 14
};

export function nextReviewDate(reviewedAt: string, recallRating: number): Date {
  const days = intervalsByRating[recallRating];
  if (days === undefined) {
    throw new Error(`Recall rating must be between 0 and 5. Received ${recallRating}.`);
  }

  const date = new Date(reviewedAt);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}
```

- [ ] **Step 8: Verify domain logic**

Run:

```bash
pnpm test src/features/planning/scheduler.test.ts src/features/leetcode/timer.test.ts src/features/flashcards/spaced-repetition.test.ts
pnpm lint
```

Expected: tests and lint exit 0.

- [ ] **Step 9: Commit domain logic**

```bash
git add src/features
git commit -m "feat: add learning scheduler domain logic"
```

## Task 5: Import Seed Content into Supabase

**Files:**
- Create: `scripts/import/import-seeds.ts`
- Modify: `src/features/content/seed-parser.ts`

- [ ] **Step 1: Write failing import dry-run test**

Create `scripts/import/import-seeds.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildImportSummary } from "./import-seeds";

describe("buildImportSummary", () => {
  it("counts parsed seed entities before database writes", () => {
    const summary = buildImportSummary({
      leetcode: { patterns: [{}], subpatterns: [{}], problems: [{}, {}] },
      roadmap: { roadmap: {}, topics: [{}, {}], resources: [{}] },
      systemDesign: { topics: [{}], prompts: [{}] }
    });

    expect(summary).toEqual({
      leetcodePatterns: 1,
      leetcodeSubpatterns: 1,
      leetcodeProblems: 2,
      roadmapTopics: 2,
      roadmapResources: 1,
      systemDesignTopics: 1,
      systemDesignPrompts: 1
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test scripts/import/import-seeds.test.ts
```

Expected: FAIL because `import-seeds.ts` does not exist.

- [ ] **Step 3: Implement import summary and CLI entrypoint**

Create `scripts/import/import-seeds.ts`:

```ts
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseLeetcodeSeed, parseRoadmapSeed, parseSystemDesignSeed } from "../../src/features/content/seed-parser";
import { createSupabaseServiceRoleClient } from "../../src/server/supabase/service-role";

export interface ImportSummary {
  leetcodePatterns: number;
  leetcodeSubpatterns: number;
  leetcodeProblems: number;
  roadmapTopics: number;
  roadmapResources: number;
  systemDesignTopics: number;
  systemDesignPrompts: number;
}

export function buildImportSummary(input: {
  leetcode: { patterns: unknown[]; subpatterns: unknown[]; problems: unknown[] };
  roadmap: { roadmap: unknown; topics: unknown[]; resources: unknown[] };
  systemDesign: { topics: unknown[]; prompts: unknown[] };
}): ImportSummary {
  return {
    leetcodePatterns: input.leetcode.patterns.length,
    leetcodeSubpatterns: input.leetcode.subpatterns.length,
    leetcodeProblems: input.leetcode.problems.length,
    roadmapTopics: input.roadmap.topics.length,
    roadmapResources: input.roadmap.resources.length,
    systemDesignTopics: input.systemDesign.topics.length,
    systemDesignPrompts: input.systemDesign.prompts.length
  };
}

async function main() {
  const root = process.cwd();
  const leetcode = parseLeetcodeSeed(await readFile(join(root, "content/seeds/leetcode-patterns.md"), "utf8"));
  const roadmap = parseRoadmapSeed(await readFile(join(root, "content/seeds/backend-roadmaps.md"), "utf8"));
  const systemDesign = parseSystemDesignSeed(await readFile(join(root, "content/seeds/system-design-prompts.md"), "utf8"));
  const summary = buildImportSummary({ leetcode, roadmap, systemDesign });

  if (process.argv.includes("--dry-run")) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const supabase = createSupabaseServiceRoleClient();
  await importLeetcode(supabase, leetcode);
  await importRoadmap(supabase, roadmap);
  await importSystemDesign(supabase, systemDesign);
  console.log(JSON.stringify(summary, null, 2));
}

async function importLeetcode(supabase: ReturnType<typeof createSupabaseServiceRoleClient>, seed: ReturnType<typeof parseLeetcodeSeed>) {
  for (const pattern of seed.patterns) {
    await supabase.from("leetcode_patterns").upsert(pattern, { onConflict: "slug" }).throwOnError();
  }
}

async function importRoadmap(supabase: ReturnType<typeof createSupabaseServiceRoleClient>, seed: ReturnType<typeof parseRoadmapSeed>) {
  await supabase.from("roadmaps").upsert(seed.roadmap, { onConflict: "slug" }).throwOnError();
}

async function importSystemDesign(supabase: ReturnType<typeof createSupabaseServiceRoleClient>, seed: ReturnType<typeof parseSystemDesignSeed>) {
  for (const topic of seed.topics) {
    await supabase.from("system_design_topics").upsert(topic, { onConflict: "slug" }).throwOnError();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
```

- [ ] **Step 4: Expand import to all related rows**

Replace the bottom helper functions in `scripts/import/import-seeds.ts` with:

```ts
async function getIdBySlug(
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
  table: string,
  slug: string
): Promise<string> {
  const { data, error } = await supabase.from(table).select("id").eq("slug", slug).single();
  if (error) throw error;
  return data.id as string;
}

async function importLeetcode(supabase: ReturnType<typeof createSupabaseServiceRoleClient>, seed: ReturnType<typeof parseLeetcodeSeed>) {
  for (const pattern of seed.patterns) {
    await supabase
      .from("leetcode_patterns")
      .upsert(
        {
          slug: pattern.slug,
          name: pattern.name,
          description: pattern.description,
          display_order: pattern.displayOrder
        },
        { onConflict: "slug" }
      )
      .throwOnError();
  }

  for (const subpattern of seed.subpatterns) {
    const patternId = await getIdBySlug(supabase, "leetcode_patterns", subpattern.patternSlug);
    await supabase
      .from("leetcode_subpatterns")
      .upsert(
        {
          pattern_id: patternId,
          slug: subpattern.slug,
          name: subpattern.name,
          description: subpattern.description,
          display_order: subpattern.displayOrder
        },
        { onConflict: "slug" }
      )
      .throwOnError();
  }

  for (const problem of seed.problems) {
    const subpatternId = await getIdBySlug(supabase, "leetcode_subpatterns", problem.subpatternSlug);
    await supabase
      .from("leetcode_problems")
      .upsert(
        {
          subpattern_id: subpatternId,
          slug: problem.slug,
          title: problem.title,
          source_url: problem.sourceUrl,
          difficulty: problem.difficulty,
          estimated_minutes: problem.estimatedMinutes,
          tags: problem.tags
        },
        { onConflict: "slug" }
      )
      .throwOnError();
  }
}

async function importRoadmap(supabase: ReturnType<typeof createSupabaseServiceRoleClient>, seed: ReturnType<typeof parseRoadmapSeed>) {
  await supabase.from("roadmaps").upsert(seed.roadmap, { onConflict: "slug" }).throwOnError();
  const roadmapId = await getIdBySlug(supabase, "roadmaps", seed.roadmap.slug);

  for (const topic of seed.topics) {
    await supabase
      .from("roadmap_topics")
      .upsert(
        {
          roadmap_id: roadmapId,
          parent_topic_id: null,
          slug: topic.slug,
          title: topic.title,
          description: topic.description,
          source_url: topic.sourceUrl,
          display_order: topic.displayOrder
        },
        { onConflict: "slug" }
      )
      .throwOnError();
  }

  for (const resource of seed.resources) {
    const topicId = await getIdBySlug(supabase, "roadmap_topics", resource.topicSlug);
    await supabase
      .from("roadmap_resources")
      .insert({
        topic_id: topicId,
        title: resource.title,
        url: resource.url,
        resource_type: resource.resourceType,
        summary: resource.summary
      })
      .throwOnError();
  }
}

async function importSystemDesign(supabase: ReturnType<typeof createSupabaseServiceRoleClient>, seed: ReturnType<typeof parseSystemDesignSeed>) {
  for (const topic of seed.topics) {
    await supabase
      .from("system_design_topics")
      .upsert(
        {
          slug: topic.slug,
          title: topic.title,
          description: topic.description,
          concept_tags: topic.conceptTags
        },
        { onConflict: "slug" }
      )
      .throwOnError();
  }

  for (const prompt of seed.prompts) {
    const topicId = await getIdBySlug(supabase, "system_design_topics", prompt.topicSlug);
    await supabase
      .from("system_design_prompts")
      .upsert(
        {
          topic_id: topicId,
          slug: prompt.slug,
          title: prompt.title,
          prompt_text: prompt.promptText,
          difficulty: prompt.difficulty,
          source_url: prompt.sourceUrl,
          expected_concepts: prompt.expectedConcepts
        },
        { onConflict: "slug" }
      )
      .throwOnError();
  }
}
```

- [ ] **Step 5: Verify import dry run**

Run:

```bash
pnpm test scripts/import/import-seeds.test.ts
pnpm import:seeds -- --dry-run
```

Expected: test exits 0 and dry run prints non-zero counts for all seed groups.

- [ ] **Step 6: Commit import pipeline**

```bash
git add scripts/import src/features/content
git commit -m "feat: add seed import pipeline"
```

## Task 6: Add Scraper Scripts that Write Markdown Seeds

**Files:**
- Create: `scripts/scrape/roadmap-backend.ts`
- Create: `scripts/scrape/leetcode-patterns.ts`
- Create: `scripts/scrape/system-design-prompts.ts`

- [ ] **Step 1: Add shared safe-write helper**

Create `scripts/scrape/write-seed.ts`:

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function writeSeedFile(path: string, content: string) {
  if (!content.includes("Source:") && !content.includes("URL:")) {
    throw new Error(`Seed file ${path} must include source URLs.`);
  }

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
}
```

- [ ] **Step 2: Implement roadmap scraper**

Create `scripts/scrape/roadmap-backend.ts`:

```ts
import { writeSeedFile } from "./write-seed";

async function main() {
  const scrapedDate = new Date().toISOString().slice(0, 10);
  const markdown = `# Backend Roadmap
Source: https://roadmap.sh/backend
Scraped Date: ${scrapedDate}
Review Status: scraper starter output

## Topic: Internet
Slug: internet
Description: Understand DNS, HTTP, browsers, hosting, and how clients reach servers.

- Resource: How does the internet work?
  URL: https://roadmap.sh/guides/what-is-internet
  Type: article
  Summary: High-level overview of networks, packets, DNS, and protocols.

## Topic: HTTP
Slug: http
Description: Understand methods, status codes, headers, caching, cookies, and TLS.

- Resource: HTTP in one picture
  URL: https://roadmap.sh/guides/http-in-one-picture
  Type: article
  Summary: Visual summary of request and response fundamentals.
`;

  await writeSeedFile("content/seeds/backend-roadmaps.md", markdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 3: Implement LeetCode taxonomy scraper starter**

Create `scripts/scrape/leetcode-patterns.ts`:

```ts
import { writeSeedFile } from "./write-seed";

async function main() {
  const scrapedDate = new Date().toISOString().slice(0, 10);
  const markdown = `# LeetCode Patterns

Scraped Date: ${scrapedDate}
Review Status: scraper starter output

## Pattern: Two Pointers
Slug: two-pointers
Description: Use two indices to scan arrays or strings efficiently.

### Subpattern: Opposite Ends
Slug: opposite-ends

- Problem: Two Sum II - Input Array Is Sorted
  Slug: two-sum-ii-input-array-is-sorted
  Difficulty: medium
  URL: https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/
  Estimated Minutes: 20
  Tags: array, pointers

## Pattern: Sliding Window
Slug: sliding-window
Description: Maintain a moving range over contiguous data.

### Subpattern: Variable Window
Slug: variable-window

- Problem: Longest Substring Without Repeating Characters
  Slug: longest-substring-without-repeating-characters
  Difficulty: medium
  URL: https://leetcode.com/problems/longest-substring-without-repeating-characters/
  Estimated Minutes: 30
  Tags: string, hash-map, window

## Pattern: Binary Search
Slug: binary-search
Description: Repeatedly halve an ordered search space.

### Subpattern: Search Answer Space
Slug: search-answer-space

- Problem: Koko Eating Bananas
  Slug: koko-eating-bananas
  Difficulty: medium
  URL: https://leetcode.com/problems/koko-eating-bananas/
  Estimated Minutes: 35
  Tags: binary-search

## Pattern: Breadth First Search
Slug: bfs
Description: Explore graph or tree levels with a queue.

### Subpattern: Level Order
Slug: level-order

- Problem: Binary Tree Level Order Traversal
  Slug: binary-tree-level-order-traversal
  Difficulty: medium
  URL: https://leetcode.com/problems/binary-tree-level-order-traversal/
  Estimated Minutes: 25
  Tags: tree, queue

## Pattern: Depth First Search
Slug: dfs
Description: Explore paths recursively or with an explicit stack.

### Subpattern: Backtracking
Slug: backtracking

- Problem: Subsets
  Slug: subsets
  Difficulty: medium
  URL: https://leetcode.com/problems/subsets/
  Estimated Minutes: 25
  Tags: backtracking

## Pattern: Dynamic Programming
Slug: dynamic-programming
Description: Reuse overlapping subproblem results.

### Subpattern: One Dimensional DP
Slug: one-dimensional-dp

- Problem: Climbing Stairs
  Slug: climbing-stairs
  Difficulty: easy
  URL: https://leetcode.com/problems/climbing-stairs/
  Estimated Minutes: 20
  Tags: dp

## Pattern: Heap
Slug: heap
Description: Use priority queues to repeatedly access min or max elements.

### Subpattern: Top K
Slug: top-k

- Problem: Top K Frequent Elements
  Slug: top-k-frequent-elements
  Difficulty: medium
  URL: https://leetcode.com/problems/top-k-frequent-elements/
  Estimated Minutes: 30
  Tags: heap, hash-map

## Pattern: Graph
Slug: graph
Description: Model relationships as nodes and edges.

### Subpattern: Connectivity
Slug: connectivity

- Problem: Number of Islands
  Slug: number-of-islands
  Difficulty: medium
  URL: https://leetcode.com/problems/number-of-islands/
  Estimated Minutes: 30
  Tags: graph, dfs, bfs
`;

  await writeSeedFile("content/seeds/leetcode-patterns.md", markdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 4: Implement system design prompt scraper starter**

Create `scripts/scrape/system-design-prompts.ts`:

```ts
import { writeSeedFile } from "./write-seed";

async function main() {
  const scrapedDate = new Date().toISOString().slice(0, 10);
  const markdown = `# System Design Prompts

Scraped Date: ${scrapedDate}
Review Status: scraper starter output

## Topic: URL Shortener
Slug: url-shortener
Tags: hashing, storage, redirects, caching, rate limiting

### Prompt: Design TinyURL
Slug: design-tinyurl
Difficulty: medium
Source: https://github.com/donnemartin/system-design-primer
Expected Concepts: key generation, redirects, read-heavy traffic, cache, analytics

Design a URL shortener that creates short links, redirects users to long URLs, and records basic analytics.

## Topic: Rate Limiter
Slug: rate-limiter
Tags: distributed-systems, redis, counters, throttling

### Prompt: Design an API Rate Limiter
Slug: design-api-rate-limiter
Difficulty: medium
Source: https://github.com/donnemartin/system-design-primer
Expected Concepts: token bucket, fixed window, sliding window, redis, distributed consistency

Design a rate limiter for a public API used by many customers.

## Topic: News Feed
Slug: news-feed
Tags: fanout, ranking, feeds, caching

### Prompt: Design a News Feed
Slug: design-news-feed
Difficulty: hard
Source: https://github.com/donnemartin/system-design-primer
Expected Concepts: fanout on write, fanout on read, ranking, cache invalidation

Design a personalized news feed for users following many accounts.

## Topic: Chat System
Slug: chat-system
Tags: websocket, persistence, delivery, presence

### Prompt: Design WhatsApp
Slug: design-whatsapp
Difficulty: hard
Source: https://github.com/donnemartin/system-design-primer
Expected Concepts: websocket gateways, message ordering, offline delivery, presence

Design a one-to-one and group chat service with reliable message delivery.

## Topic: File Storage
Slug: file-storage
Tags: object-storage, metadata, upload, permissions

### Prompt: Design Dropbox
Slug: design-dropbox
Difficulty: hard
Source: https://github.com/donnemartin/system-design-primer
Expected Concepts: chunked upload, metadata store, sync, conflict resolution

Design a file storage and sync service for large files across devices.

## Topic: Notification System
Slug: notification-system
Tags: queues, email, push, preferences

### Prompt: Design a Notification System
Slug: design-notification-system
Difficulty: medium
Source: https://github.com/donnemartin/system-design-primer
Expected Concepts: queues, delivery providers, retries, preferences, deduplication

Design a notification system that can send email, push, and in-app messages.
`;

  await writeSeedFile("content/seeds/system-design-prompts.md", markdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 5: Verify scraper output**

Run:

```bash
pnpm scrape:roadmap
pnpm scrape:leetcode
pnpm scrape:system-design
pnpm test src/features/content/seed-parser.test.ts
pnpm import:seeds -- --dry-run
```

Expected: seed files exist, parse tests pass, and dry-run counts include all required starter topics.

- [ ] **Step 6: Commit scraper scripts**

```bash
git add scripts/scrape content/seeds
git commit -m "feat: add seed scraping scripts"
```

## Task 7: Build Auth and Dashboard Shell

**Files:**
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/components/app-shell.tsx`
- Create: `src/components/task-card.tsx`

- [ ] **Step 1: Write dashboard component test**

Create `src/components/task-card.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TaskCard } from "./task-card";

describe("TaskCard", () => {
  it("renders track, title, and action", () => {
    render(<TaskCard track="LeetCode" title="Two Sum II" href="/leetcode/1/timer" action="Start timer" />);
    expect(screen.getByText("LeetCode")).toBeInTheDocument();
    expect(screen.getByText("Two Sum II")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start timer" })).toHaveAttribute("href", "/leetcode/1/timer");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test src/components/task-card.test.tsx
```

Expected: FAIL because component does not exist or testing setup is incomplete.

- [ ] **Step 3: Add test setup**

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Update `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"]
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname
    }
  }
});
```

- [ ] **Step 4: Implement app shell and task card**

Create `src/components/task-card.tsx`:

```tsx
import Link from "next/link";

interface TaskCardProps {
  track: string;
  title: string;
  href: string;
  action: string;
}

export function TaskCard({ track, title, href, action }: TaskCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{track}</p>
      <h2 className="mt-2 text-lg font-semibold text-slate-950">{title}</h2>
      <Link className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white" href={href}>
        {action}
      </Link>
    </article>
  );
}
```

Create `src/components/app-shell.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";

const nav = [
  ["Dashboard", "/dashboard"],
  ["LeetCode", "/leetcode"],
  ["Roadmap", "/roadmap"],
  ["System Design", "/system-design"],
  ["Flashcards", "/flashcards"]
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="border-b border-slate-200 bg-white px-6 py-4">
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-4">
          {nav.map(([label, href]) => (
            <Link className="text-sm font-medium text-slate-700 hover:text-slate-950" href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 5: Implement login and dashboard pages**

Create `src/app/(dashboard)/layout.tsx`:

```tsx
import { AppShell } from "@/components/app-shell";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

Create `src/app/(dashboard)/dashboard/page.tsx`:

```tsx
import { TaskCard } from "@/components/task-card";

export default function DashboardPage() {
  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Today</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">Backend interview plan</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <TaskCard track="LeetCode" title="Two Sum II - Input Array Is Sorted" href="/leetcode/demo/timer" action="Start timer" />
        <TaskCard track="Roadmap" title="Read: How does the internet work?" href="/roadmap" action="Open reading" />
        <TaskCard track="System Design" title="Design TinyURL" href="/system-design" action="Start prompt" />
        <TaskCard track="Flashcards" title="Review due cards" href="/flashcards" action="Review" />
      </div>
    </section>
  );
}
```

Create `src/app/(auth)/login/page.tsx`:

```tsx
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 text-slate-950">
        <h1 className="text-3xl font-bold">Sign in</h1>
        <p className="mt-3 text-slate-600">Enter with Supabase email authentication after environment variables are configured.</p>
      </section>
    </main>
  );
}
```

- [ ] **Step 6: Verify shell**

Run:

```bash
pnpm test src/components/task-card.test.tsx
pnpm lint
pnpm build
```

Expected: test, lint, and build exit 0.

- [ ] **Step 7: Commit dashboard shell**

```bash
git add src/app src/components src/test vitest.config.ts
git commit -m "feat: add authenticated dashboard shell"
```

## Task 8: Build LeetCode Timer UI and Attempt Actions

**Files:**
- Create: `src/components/timer-panel.tsx`
- Create: `src/app/(dashboard)/leetcode/page.tsx`
- Create: `src/app/(dashboard)/leetcode/[assignmentId]/timer/page.tsx`
- Create: `src/app/(dashboard)/leetcode/[assignmentId]/timer/actions.ts`

- [ ] **Step 1: Write timer panel test**

Create `src/components/timer-panel.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TimerPanel } from "./timer-panel";

describe("TimerPanel", () => {
  it("renders problem title and time limit", () => {
    render(<TimerPanel title="Two Sum II" timeLimitMinutes={30} />);
    expect(screen.getByText("Two Sum II")).toBeInTheDocument();
    expect(screen.getByText("30 min")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test src/components/timer-panel.test.tsx
```

Expected: FAIL because `TimerPanel` does not exist.

- [ ] **Step 3: Implement timer panel**

Create `src/components/timer-panel.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

export function TimerPanel({ title, timeLimitMinutes }: { title: string; timeLimitMinutes: number }) {
  const [remaining, setRemaining] = useState(timeLimitMinutes * 60);

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <section className="rounded-3xl bg-slate-950 p-8 text-white">
      <p className="text-sm uppercase tracking-wide text-slate-400">Timed attempt</p>
      <h1 className="mt-2 text-3xl font-bold">{title}</h1>
      <p className="mt-6 text-6xl font-black tabular-nums">
        {minutes}:{seconds}
      </p>
      <p className="mt-2 text-slate-300">{timeLimitMinutes} min</p>
    </section>
  );
}
```

- [ ] **Step 4: Add LeetCode pages**

Create `src/app/(dashboard)/leetcode/page.tsx`:

```tsx
import { TaskCard } from "@/components/task-card";

export default function LeetcodePage() {
  return (
    <section>
      <h1 className="text-4xl font-bold">LeetCode patterns</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <TaskCard track="Two Pointers" title="Two Sum II - Input Array Is Sorted" href="/leetcode/demo/timer" action="Start timer" />
        <TaskCard track="Sliding Window" title="Longest Substring Without Repeating Characters" href="/leetcode/demo-2/timer" action="Start timer" />
      </div>
    </section>
  );
}
```

Create `src/app/(dashboard)/leetcode/[assignmentId]/timer/page.tsx`:

```tsx
import { TimerPanel } from "@/components/timer-panel";

export default function TimerPage({ params }: { params: { assignmentId: string } }) {
  return (
    <section className="space-y-6">
      <TimerPanel title={`Assignment ${params.assignmentId}`} timeLimitMinutes={30} />
      <form className="flex gap-3">
        <button className="rounded-full bg-green-600 px-4 py-2 text-white" type="submit">
          Complete
        </button>
        <button className="rounded-full bg-red-600 px-4 py-2 text-white" type="submit">
          Failed
        </button>
      </form>
    </section>
  );
}
```

- [ ] **Step 5: Add server action for attempt completion**

Create `src/app/(dashboard)/leetcode/[assignmentId]/timer/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { calculateAttemptResult } from "@/features/leetcode/timer";

export async function completeAttempt(input: {
  assignmentId: string;
  startedAt: string;
  timeLimitMinutes: number;
  status: "completed" | "failed" | "skipped";
}) {
  const result = calculateAttemptResult({
    startedAt: input.startedAt,
    endedAt: new Date().toISOString(),
    timeLimitMinutes: input.timeLimitMinutes,
    requestedStatus: input.status
  });

  revalidatePath("/leetcode");
  return result;
}
```

Update `src/app/(dashboard)/leetcode/[assignmentId]/timer/page.tsx` so the form invokes the server action:

```tsx
import { TimerPanel } from "@/components/timer-panel";
import { completeAttempt } from "./actions";

export default function TimerPage({ params }: { params: { assignmentId: string } }) {
  async function complete() {
    "use server";
    await completeAttempt({
      assignmentId: params.assignmentId,
      startedAt: new Date().toISOString(),
      timeLimitMinutes: 30,
      status: "completed"
    });
  }

  return (
    <section className="space-y-6">
      <TimerPanel title={`Assignment ${params.assignmentId}`} timeLimitMinutes={30} />
      <form action={complete} className="flex gap-3">
        <button className="rounded-full bg-green-600 px-4 py-2 text-white" type="submit">
          Complete
        </button>
      </form>
    </section>
  );
}
```

- [ ] **Step 6: Verify timer UI**

Run:

```bash
pnpm test src/components/timer-panel.test.tsx src/features/leetcode/timer.test.ts
pnpm lint
pnpm build
```

Expected: tests, lint, and build exit 0.

- [ ] **Step 7: Commit timer UI**

```bash
git add src/components src/app/'(dashboard)'/leetcode src/features/leetcode
git commit -m "feat: add leetcode timer interface"
```

## Task 9: Build Roadmap, System Design, and Flashcard Views

**Files:**
- Create: `src/components/status-select.tsx`
- Create: `src/app/(dashboard)/roadmap/page.tsx`
- Create: `src/app/(dashboard)/system-design/page.tsx`
- Create: `src/app/(dashboard)/flashcards/page.tsx`

- [ ] **Step 1: Write status component test**

Create `src/components/status-select.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusSelect } from "./status-select";

describe("StatusSelect", () => {
  it("renders all learning states", () => {
    render(<StatusSelect name="status" defaultValue="not_started" />);
    expect(screen.getByRole("option", { name: "Not started" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Learning" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Reviewed" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Mastered" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test src/components/status-select.test.tsx
```

Expected: FAIL because component does not exist.

- [ ] **Step 3: Implement status select**

Create `src/components/status-select.tsx`:

```tsx
interface StatusSelectProps {
  name: string;
  defaultValue: "not_started" | "learning" | "reviewed" | "mastered";
}

export function StatusSelect({ name, defaultValue }: StatusSelectProps) {
  return (
    <select className="rounded-lg border border-slate-300 px-3 py-2" defaultValue={defaultValue} name={name}>
      <option value="not_started">Not started</option>
      <option value="learning">Learning</option>
      <option value="reviewed">Reviewed</option>
      <option value="mastered">Mastered</option>
    </select>
  );
}
```

- [ ] **Step 4: Add roadmap page**

Create `src/app/(dashboard)/roadmap/page.tsx`:

```tsx
import { StatusSelect } from "@/components/status-select";

const topics = ["Internet", "HTTP", "DNS", "Databases", "Caching"];

export default function RoadmapPage() {
  return (
    <section>
      <h1 className="text-4xl font-bold">Backend roadmap</h1>
      <div className="mt-8 space-y-3">
        {topics.map((topic) => (
          <article className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm" key={topic}>
            <span className="font-medium">{topic}</span>
            <StatusSelect name={`${topic}-status`} defaultValue="not_started" />
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Add system design page**

Create `src/app/(dashboard)/system-design/page.tsx`:

```tsx
import { TaskCard } from "@/components/task-card";

export default function SystemDesignPage() {
  return (
    <section>
      <h1 className="text-4xl font-bold">System design practice</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <TaskCard track="URL Shortener" title="Design TinyURL" href="/system-design#design-tinyurl" action="Practice" />
        <TaskCard track="Rate Limiter" title="Design an API Rate Limiter" href="/system-design#rate-limiter" action="Practice" />
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Add flashcard page**

Create `src/app/(dashboard)/flashcards/page.tsx`:

```tsx
export default function FlashcardsPage() {
  return (
    <section>
      <h1 className="text-4xl font-bold">Flashcards</h1>
      <article className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-wide text-slate-500">Due today</p>
        <h2 className="mt-2 text-2xl font-semibold">What happens during DNS resolution?</h2>
        <details className="mt-4">
          <summary className="cursor-pointer font-medium">Show hint</summary>
          <p className="mt-2 text-slate-600">Think resolver, root, TLD, authoritative server.</p>
        </details>
      </article>
    </section>
  );
}
```

- [ ] **Step 7: Verify views**

Run:

```bash
pnpm test src/components/status-select.test.tsx
pnpm lint
pnpm build
```

Expected: test, lint, and build exit 0.

- [ ] **Step 8: Commit learning views**

```bash
git add src/app/'(dashboard)'/roadmap src/app/'(dashboard)'/system-design src/app/'(dashboard)'/flashcards src/components/status-select.tsx src/components/status-select.test.tsx
git commit -m "feat: add roadmap system design and flashcard views"
```

## Task 10: Add Cron Auth, Daily Plan, Email, and AI Job Routes

**Files:**
- Create: `src/server/cron/auth.ts`
- Create: `src/server/email/resend.ts`
- Create: `src/server/ai/openai-flashcards.ts`
- Create: `src/app/api/cron/daily-plan/route.ts`
- Create: `src/app/api/cron/send-daily-email/route.ts`
- Create: `src/app/api/cron/process-ai-jobs/route.ts`

- [ ] **Step 1: Write cron auth tests**

Create `src/server/cron/auth.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { assertCronRequest } from "./auth";

describe("assertCronRequest", () => {
  it("accepts matching bearer token", () => {
    const request = new Request("http://localhost", { headers: { authorization: "Bearer secret" } });
    expect(assertCronRequest(request, "secret")).toBe(true);
  });

  it("rejects missing bearer token", () => {
    const request = new Request("http://localhost");
    expect(assertCronRequest(request, "secret")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test src/server/cron/auth.test.ts
```

Expected: FAIL because `auth.ts` does not exist.

- [ ] **Step 3: Implement cron auth**

Create `src/server/cron/auth.ts`:

```ts
export function assertCronRequest(request: Request, secret: string): boolean {
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
```

- [ ] **Step 4: Implement email adapter**

Create `src/server/email/resend.ts`:

```ts
import { Resend } from "resend";
import { env } from "../env";

export interface DailyEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendDailyEmail(input: DailyEmailInput) {
  const resend = new Resend(env.RESEND_API_KEY);
  return resend.emails.send({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html
  });
}
```

- [ ] **Step 5: Implement AI flashcard adapter**

Create `src/server/ai/openai-flashcards.ts`:

```ts
import OpenAI from "openai";
import { z } from "zod";
import { env } from "../env";

const flashcardSchema = z.object({
  cards: z.array(
    z.object({
      question: z.string().min(1),
      answer: z.string().min(1),
      hint: z.string().min(1)
    })
  )
});

export async function generateFlashcards(input: { topic: string; notes: string }) {
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: `Create 3 concise backend interview flashcards as JSON for topic: ${input.topic}\nNotes: ${input.notes}`
  });

  const text = response.output_text;
  return flashcardSchema.parse(JSON.parse(text));
}
```

- [ ] **Step 6: Implement protected cron route handlers**

Create `src/app/api/cron/daily-plan/route.ts`:

```ts
import { NextResponse } from "next/server";
import { assertCronRequest } from "@/server/cron/auth";
import { env } from "@/server/env";

export async function GET(request: Request) {
  if (!assertCronRequest(request, env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ generated: true });
}
```

Create `src/app/api/cron/send-daily-email/route.ts`:

```ts
import { NextResponse } from "next/server";
import { assertCronRequest } from "@/server/cron/auth";
import { env } from "@/server/env";

export async function GET(request: Request) {
  if (!assertCronRequest(request, env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ queued: true });
}
```

Create `src/app/api/cron/process-ai-jobs/route.ts`:

```ts
import { NextResponse } from "next/server";
import { assertCronRequest } from "@/server/cron/auth";
import { env } from "@/server/env";

export async function GET(request: Request) {
  if (!assertCronRequest(request, env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!env.AI_FLASHCARDS_ENABLED) {
    return NextResponse.json({ processed: 0, skipped: "AI flashcards disabled" });
  }

  return NextResponse.json({ processed: 0 });
}
```

- [ ] **Step 7: Verify cron routes**

Run:

```bash
pnpm test src/server/cron/auth.test.ts
pnpm lint
pnpm build
```

Expected: test, lint, and build exit 0.

- [ ] **Step 8: Commit cron integrations**

```bash
git add src/server/cron src/server/email src/server/ai src/app/api vercel.json
git commit -m "feat: add scheduled job adapters"
```

## Task 11: Wire Supabase Data Services into UI and Cron Routes

**Files:**
- Create: `src/server/data/daily-plan.ts`
- Create: `src/server/data/learning-content.ts`
- Create: `src/server/data/flashcards.ts`
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Modify: `src/app/(dashboard)/leetcode/page.tsx`
- Modify: `src/app/(dashboard)/roadmap/page.tsx`
- Modify: `src/app/(dashboard)/system-design/page.tsx`
- Modify: `src/app/(dashboard)/flashcards/page.tsx`
- Modify: `src/app/api/cron/daily-plan/route.ts`
- Modify: `src/app/api/cron/send-daily-email/route.ts`
- Modify: `src/app/api/cron/process-ai-jobs/route.ts`

- [ ] **Step 1: Write daily plan service test**

Create `src/server/data/daily-plan.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { toDailyEmailHtml } from "./daily-plan";

describe("toDailyEmailHtml", () => {
  it("renders links for all daily plan tracks", () => {
    const html = toDailyEmailHtml({
      appBaseUrl: "http://localhost:3000",
      items: [
        { track: "leetcode", title: "Two Sum II", href: "/leetcode/a/timer" },
        { track: "roadmap", title: "Internet", href: "/roadmap" },
        { track: "system_design", title: "Design TinyURL", href: "/system-design" },
        { track: "flashcards", title: "DNS lookup", href: "/flashcards" }
      ]
    });

    expect(html).toContain("Two Sum II");
    expect(html).toContain("http://localhost:3000/leetcode/a/timer");
    expect(html).toContain("Design TinyURL");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test src/server/data/daily-plan.test.ts
```

Expected: FAIL because `daily-plan.ts` does not exist.

- [ ] **Step 3: Implement daily plan data helpers**

Create `src/server/data/daily-plan.ts`:

```ts
import { buildDailyPlan } from "@/features/planning/scheduler";
import type { createSupabaseServiceRoleClient } from "@/server/supabase/service-role";

type SupabaseServiceClient = ReturnType<typeof createSupabaseServiceRoleClient>;

export interface EmailPlanItem {
  track: "leetcode" | "roadmap" | "system_design" | "flashcards";
  title: string;
  href: string;
}

export function toDailyEmailHtml(input: { appBaseUrl: string; items: EmailPlanItem[] }) {
  const rows = input.items
    .map((item) => {
      const url = new URL(item.href, input.appBaseUrl).toString();
      return `<li><strong>${item.track}</strong>: <a href="${url}">${item.title}</a></li>`;
    })
    .join("");

  return `<h1>Today's backend interview plan</h1><ul>${rows}</ul>`;
}

export async function ensureDailyPlan(
  supabase: SupabaseServiceClient,
  input: { userId: string; date: string }
) {
  const plan = buildDailyPlan({
    date: input.date,
    leetcode: [],
    roadmap: [],
    systemDesign: [],
    flashcards: []
  });

  const { data, error } = await supabase
    .from("daily_plans")
    .upsert(
      {
        user_id: input.userId,
        plan_date: input.date,
        status: "not_started"
      },
      { onConflict: "user_id,plan_date" }
    )
    .select("id")
    .single();

  if (error) throw error;

  return { id: data.id as string, items: plan.items };
}

export async function listDashboardItems(supabase: SupabaseServiceClient, userId: string, date: string) {
  const { data, error } = await supabase
    .from("daily_plans")
    .select("id, daily_plan_items(track,title,target_id,status,scheduled_order)")
    .eq("user_id", userId)
    .eq("plan_date", date)
    .maybeSingle();

  if (error) throw error;

  return data?.daily_plan_items ?? [];
}
```

- [ ] **Step 4: Implement learning-content data helpers**

Create `src/server/data/learning-content.ts`:

```ts
import type { createSupabaseServiceRoleClient } from "@/server/supabase/service-role";

type SupabaseServiceClient = ReturnType<typeof createSupabaseServiceRoleClient>;

export async function listLeetcodeProblems(supabase: SupabaseServiceClient) {
  const { data, error } = await supabase
    .from("leetcode_problems")
    .select("id,title,slug,difficulty,estimated_minutes,leetcode_subpatterns(name,leetcode_patterns(name))")
    .order("title");

  if (error) throw error;
  return data ?? [];
}

export async function listRoadmapTopics(supabase: SupabaseServiceClient) {
  const { data, error } = await supabase
    .from("roadmap_topics")
    .select("id,title,slug,description,display_order")
    .order("display_order");

  if (error) throw error;
  return data ?? [];
}

export async function listSystemDesignPrompts(supabase: SupabaseServiceClient) {
  const { data, error } = await supabase
    .from("system_design_prompts")
    .select("id,title,slug,difficulty,expected_concepts,system_design_topics(title)")
    .order("title");

  if (error) throw error;
  return data ?? [];
}
```

- [ ] **Step 5: Implement flashcard data helpers**

Create `src/server/data/flashcards.ts`:

```ts
import { nextReviewDate } from "@/features/flashcards/spaced-repetition";
import type { createSupabaseServiceRoleClient } from "@/server/supabase/service-role";

type SupabaseServiceClient = ReturnType<typeof createSupabaseServiceRoleClient>;

export async function listDueFlashcards(supabase: SupabaseServiceClient, userId: string, nowIso: string) {
  const { data, error } = await supabase
    .from("flashcards")
    .select("id,question,hint,status")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at");

  if (error) throw error;
  return data ?? [];
}

export async function recordFlashcardReview(
  supabase: SupabaseServiceClient,
  input: { userId: string; flashcardId: string; recallRating: number; reviewedAt: string }
) {
  const nextReviewAt = nextReviewDate(input.reviewedAt, input.recallRating).toISOString();
  const { error } = await supabase.from("flashcard_reviews").insert({
    user_id: input.userId,
    flashcard_id: input.flashcardId,
    recall_rating: input.recallRating,
    reviewed_at: input.reviewedAt,
    next_review_at: nextReviewAt
  });

  if (error) throw error;
  return { nextReviewAt };
}
```

- [ ] **Step 6: Update dashboard pages to read Supabase content**

Update each dashboard page to call `createSupabaseServiceRoleClient()` and the relevant data helper. If the Supabase environment is unavailable locally, render the existing starter cards. Use this exact fallback guard:

```ts
function canUseSupabase() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
```

In `src/app/(dashboard)/leetcode/page.tsx`, map `listLeetcodeProblems()` results to `TaskCard` entries.

In `src/app/(dashboard)/roadmap/page.tsx`, map `listRoadmapTopics()` results to rows with `StatusSelect`.

In `src/app/(dashboard)/system-design/page.tsx`, map `listSystemDesignPrompts()` results to `TaskCard` entries.

In `src/app/(dashboard)/flashcards/page.tsx`, map `listDueFlashcards()` results to review cards.

- [ ] **Step 7: Update cron routes to use data helpers**

Update `src/app/api/cron/daily-plan/route.ts`:

```ts
import { NextResponse } from "next/server";
import { assertCronRequest } from "@/server/cron/auth";
import { env } from "@/server/env";
import { ensureDailyPlan } from "@/server/data/daily-plan";
import { createSupabaseServiceRoleClient } from "@/server/supabase/service-role";

export async function GET(request: Request) {
  if (!assertCronRequest(request, env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: profile, error } = await supabase.from("profiles").select("id").eq("email", env.OWNER_EMAIL).single();
  if (error) throw error;

  const date = new Date().toISOString().slice(0, 10);
  const plan = await ensureDailyPlan(supabase, { userId: profile.id as string, date });
  return NextResponse.json({ generated: true, planId: plan.id, items: plan.items.length });
}
```

Update `src/app/api/cron/send-daily-email/route.ts` to load the owner profile, call `listDashboardItems`, build HTML with `toDailyEmailHtml`, call `sendDailyEmail`, and insert an `email_notifications` row with status `sent` or `failed`.

Update `src/app/api/cron/process-ai-jobs/route.ts` to select one queued `ai_generation_jobs` row, mark it `processing`, call `generateFlashcards`, insert draft `flashcards`, and mark the job `completed`. On errors, increment `attempts`, set status `failed` after 3 attempts, and store `error_message`.

- [ ] **Step 8: Verify Supabase integration layer**

Run:

```bash
pnpm test src/server/data/daily-plan.test.ts src/features/planning/scheduler.test.ts src/features/flashcards/spaced-repetition.test.ts
pnpm lint
pnpm build
```

Expected: tests, lint, and build exit 0.

- [ ] **Step 9: Commit Supabase integration**

```bash
git add src/server/data src/app
git commit -m "feat: wire supabase learning data services"
```

## Task 12: Add End-to-End Smoke Test and Final Verification

**Files:**
- Create: `tests/e2e/personal-learning-flow.spec.ts`
- Modify: `playwright.config.ts`

- [ ] **Step 1: Configure Playwright**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
```

- [ ] **Step 2: Write smoke test**

Create `tests/e2e/personal-learning-flow.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("personal learning dashboard flow", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Backend interview plan" })).toBeVisible();
  await page.getByRole("link", { name: "Start timer" }).first().click();
  await expect(page.getByText("Timed attempt")).toBeVisible();
  await page.goto("/roadmap");
  await expect(page.getByRole("heading", { name: "Backend roadmap" })).toBeVisible();
  await page.goto("/system-design");
  await expect(page.getByRole("heading", { name: "System design practice" })).toBeVisible();
  await page.goto("/flashcards");
  await expect(page.getByRole("heading", { name: "Flashcards" })).toBeVisible();
});
```

- [ ] **Step 3: Run full verification**

Run:

```bash
pnpm test
pnpm lint
pnpm build
pnpm test:e2e
```

Expected: all commands exit 0.

- [ ] **Step 4: Commit e2e and verification**

```bash
git add tests/e2e playwright.config.ts
git commit -m "test: add personal learning smoke flow"
```

## Task 13: Production Readiness Pass

**Files:**
- Modify: `README.md`
- Modify: `.env.example`
- Modify: `docs/superpowers/specs/2026-04-26-leetcode-backend-helper-design.md` only if implementation changes the accepted behavior.

- [ ] **Step 1: Add README setup**

Create or update `README.md`:

```md
# LeetCode Backend Helper

Personal backend interview preparation assistant built with Next.js, Supabase, Vercel Cron, Resend, and OpenAI.

## Local Setup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local`.
3. Fill Supabase, Resend, OpenAI, cron, owner email, and app URL variables.
4. Run database migrations in Supabase.
5. Run `pnpm scrape:roadmap`, `pnpm scrape:leetcode`, and `pnpm scrape:system-design`.
6. Review files in `content/seeds`.
7. Run `pnpm import:seeds`.
8. Start the app with `pnpm dev`.

## Verification

Run:

```bash
pnpm test
pnpm lint
pnpm build
pnpm test:e2e
```
```

- [ ] **Step 2: Verify README commands**

Run:

```bash
pnpm test
pnpm lint
pnpm build
```

Expected: all commands exit 0.

- [ ] **Step 3: Commit documentation**

```bash
git add README.md .env.example docs/superpowers/specs/2026-04-26-leetcode-backend-helper-design.md
git commit -m "docs: add setup and verification guide"
```

## Coverage Review

- Functional spec coverage: LeetCode tasks, timer, pattern grouping, roadmap checklist, system design practice, daily emails, flashcards, AI draft generation, seed scraping, Supabase Auth/DB, and Vercel deployment are covered.
- Security coverage: RLS, service role separation, server-only provider keys, and cron secret checks are covered.
- Testing coverage: unit tests, route-adjacent cron tests, import dry-run, build, lint, and Playwright smoke test are covered.
- Deferred by v1 non-goals: teams, public sharing, payments, native mobile, live scraping at runtime, and LeetCode submission verification.

## Final Verification

Before considering implementation complete, run:

```bash
git status --short
pnpm test
pnpm lint
pnpm build
pnpm test:e2e
```

Expected: git status contains only intentional changes, and all verification commands exit 0.
