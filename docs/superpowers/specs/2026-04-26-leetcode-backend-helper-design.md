# LeetCode Backend Helper Project Specification

## Spec Status

- Status: approved v1 design
- Owner: personal-use project
- Source-of-truth role: this document defines the product behavior, architecture, and implementation constraints for future plans and code generation.
- Spec workflow: Specify -> Plan -> Tasks -> Implement.

## 1. Functional Specification

### 1.1 Product Summary

Build a personal learning assistant for backend interview preparation. The app helps one authenticated user plan, execute, and review daily work across three tracks:

- LeetCode practice grouped by pattern and subpattern.
- Backend engineering roadmap learning based on roadmap.sh content.
- System design practice through prompts, readings, guided sessions, and review.

The app sends daily email notifications with the user's assigned LeetCode problems, roadmap readings, system design practice, and due flashcards. It also provides a timer link for timed LeetCode attempts and an Anki-style flashcard system that can use AI to generate review cards from weak areas.

### 1.2 Target User

The target user is one developer preparing for backend engineering interviews. The app is not a public SaaS in v1. It may use Supabase Auth, but the product assumes one owner account and private data.

### 1.3 Goals

- Create a structured daily todo list for backend interview preparation.
- Track progress across LeetCode, backend roadmap topics, and system design topics.
- Send actionable daily email reminders.
- Keep source learning content deterministic by scraping initial corpora into versioned Markdown seed files before importing into the database.
- Use AI only where it adds leverage: flashcard generation, hints, and weak-area reinforcement.

### 1.4 Non-Goals

- No multi-user teams, public profiles, sharing, payments, or subscriptions.
- No real-time collaboration.
- No runtime dependency on scraping third-party websites.
- No attempt to mirror all of roadmap.sh or LeetCode perfectly.
- No automated submission checking against LeetCode.
- No mobile native app in v1.

### 1.5 Core User Stories

#### LeetCode Practice

- As the user, I want to see today's LeetCode problems so I can practice without deciding what to do each day.
- As the user, I want problems grouped by pattern and subpattern so I can learn repeatable techniques.
- As the user, I want to click a timed-practice link so a countdown starts for a specific problem.
- As the user, I want to record attempt status, elapsed time, confidence, and notes.
- As the user, I want unfinished or failed problems to reappear later for spaced review.

#### Backend Roadmap

- As the user, I want a backend roadmap checklist so I can track what I have learned and what remains.
- As the user, I want roadmap topics to include articles or resources so I know what to read next.
- As the user, I want daily reading suggestions sent by email.
- As the user, I want to mark topics as not started, learning, reviewed, or mastered.

#### System Design Practice

- As the user, I want a library of system design prompts so I can practice common interview scenarios.
- As the user, I want each prompt to include guidance, expected concepts, and follow-up questions.
- As the user, I want to track completed readings and practice sessions.
- As the user, I want the app to suggest the next system design topic based on gaps.

#### Flashcards

- As the user, I want flashcards generated from weak topics so I can review what I forget.
- As the user, I want hints before revealing answers.
- As the user, I want review scheduling based on recall quality.
- As the user, I want AI-generated cards to be stored as drafts until accepted or rejected.

#### Notifications

- As the user, I want one daily email containing today's tasks across all tracks.
- As the user, I want optional reminder emails for unfinished tasks.
- As the user, I want notification preferences so I can control email timing and categories.

### 1.6 Acceptance Criteria

- The user can sign in with Supabase Auth and access a private dashboard.
- The dashboard shows today's tasks grouped by LeetCode, roadmap, system design, and flashcards.
- The user can start a LeetCode timer from a task link and complete, fail, skip, or abandon the attempt.
- LeetCode problems are browsable by pattern and subpattern.
- Backend roadmap topics are imported from reviewed Markdown seed files and can be checked off.
- System design prompts are imported from reviewed Markdown seed files and can be practiced.
- A scheduled job sends a daily email with the current day's tasks.
- AI flashcard generation runs asynchronously from queued jobs and never blocks dashboard rendering.
- AI-generated flashcards require user acceptance before entering the active review deck.
- The app works on Vercel serverless infrastructure without long-running background processes.

## 2. Language-Agnostic Technical Specification

### 2.1 System Architecture

The system has five major parts:

- Web application: authenticated dashboard, task views, timers, progress tracking, and flashcard review.
- Supabase backend: authentication, relational data, row-level security, and persisted job state.
- Seed content pipeline: scraper scripts create Markdown seed files; import scripts normalize those files into database records.
- Scheduled jobs: Vercel Cron calls protected API routes to generate daily tasks, send emails, and process queued AI jobs.
- External services: email provider for notifications and AI provider for flashcard generation and hints.

Runtime application behavior must depend on Supabase data, not live scraping. Scraping is a development/content-maintenance operation.

### 2.2 Content Pipeline

#### Seed Files

Initial content is stored in committed Markdown files:

- `content/seeds/leetcode-patterns.md`
- `content/seeds/backend-roadmaps.md`
- `content/seeds/system-design-prompts.md`

Each seed file must be human-reviewable and stable enough to diff in git. The files are the review boundary between scraping and database import.

#### Scraper Behavior

Scrapers collect initial data from public sources and write Markdown, not directly to Supabase. Scrapers must record source URL, scraped date, title, and extracted content. Scrapers must be safe to rerun and should avoid overwriting manually curated notes unless explicitly requested.

#### Import Behavior

Import scripts read Markdown seed files, validate required fields, and upsert normalized rows into Supabase. Import scripts should be idempotent by using stable slugs.

### 2.3 Data Model

#### Identity

- `profiles`: one row per authenticated user.
- `notification_preferences`: email address, send time, timezone, enabled categories.

#### LeetCode

- `leetcode_patterns`: pattern name, slug, description, display order.
- `leetcode_subpatterns`: parent pattern, name, slug, description, display order.
- `leetcode_problems`: title, slug, source URL, difficulty, estimated minutes, pattern, subpattern, tags.
- `leetcode_assignments`: user, problem, assigned date, due date, status, priority.
- `leetcode_attempts`: user, problem, started at, ended at, time limit minutes, elapsed seconds, result, confidence, notes.

#### Roadmap

- `roadmaps`: title, slug, source URL, description.
- `roadmap_topics`: roadmap, parent topic, title, slug, description, source URL, display order.
- `roadmap_resources`: topic, title, URL, resource type, summary.
- `roadmap_progress`: user, topic, status, confidence, last reviewed at, notes.

#### System Design

- `system_design_topics`: title, slug, description, concept tags.
- `system_design_prompts`: topic, title, slug, prompt text, difficulty, source URL, expected concepts.
- `system_design_resources`: topic or prompt, title, URL, resource type, summary.
- `system_design_sessions`: user, prompt, started at, completed at, status, notes, self score.

#### Daily Planning

- `daily_plans`: user, date, generated at, status.
- `daily_plan_items`: plan, track, target entity, title, description, status, scheduled order.

#### Flashcards

- `flashcards`: user, source track, source entity, question, answer, hint, status.
- `flashcard_reviews`: user, flashcard, reviewed at, recall rating, next review at.
- `ai_generation_jobs`: user, job type, input payload, status, output payload, error message, attempts.

#### Notifications

- `email_notifications`: user, notification type, subject, body, status, scheduled for, sent at, provider message id, error message.

### 2.4 Scheduling Rules

- Generate each daily plan once per user per local calendar date.
- Daily plan generation selects tasks from all three tracks using due items, incomplete work, and weak areas.
- LeetCode assignments should prefer unfinished weak patterns before introducing new patterns.
- Roadmap assignments should follow dependency order from the imported roadmap topic tree.
- System design assignments should alternate between reading and practice.
- Flashcards due for review should be included in the daily plan.
- Email notifications should summarize all due items in one daily email by default.

### 2.5 Timer Rules

- A LeetCode timer starts when the user opens a signed timer route for an assigned problem.
- A timer creates a `leetcode_attempts` row with `started_at` and `time_limit_minutes`.
- The UI must show remaining time and allow completion, failure, skip, or abandon.
- The server records final elapsed time based on server timestamps, not only client-side timers.
- Expired timers can still be submitted, but the attempt is marked over time.

### 2.6 AI Flashcard Rules

- AI generation uses queued jobs stored in Supabase.
- Inputs should include weak topic, recent notes, failed recalls, and accepted source material snippets.
- Generated cards must include question, answer, hint, source track, and source entity.
- Generated cards are saved as draft until the user accepts them.
- Rejected draft cards must not reappear unless regenerated by a new job.
- The app must not send private notes to an AI provider unless the user has explicitly enabled AI flashcards.

### 2.7 Email Rules

- The default notification cadence is one daily planning email.
- Reminder emails are optional and controlled by preferences.
- Email content must include direct links to today's dashboard, LeetCode timers, roadmap readings, system design prompt, and due flashcards.
- Failed email sends must be stored and retried with a bounded retry count.

### 2.8 Security and Privacy

- All user-specific tables must enforce row-level security.
- Cron and import endpoints must require server-side secrets.
- Service role keys must never be exposed to the browser.
- AI and email provider API keys must remain server-only.
- The app must validate that timer links and task mutations belong to the authenticated user.

### 2.9 Error Handling

- Scraper failures should fail the scrape command and preserve the previous seed files.
- Import failures should identify the seed file, section, and missing or invalid field.
- Daily plan generation should be idempotent and safe to retry.
- Email failures should be recorded without preventing the user from seeing the dashboard.
- AI generation failures should update job status and expose a retry option.

### 2.10 Observability

- Scheduled jobs should log start time, end time, item counts, and failure reasons.
- Import scripts should print counts for created, updated, skipped, and failed records.
- The dashboard should expose enough state to tell whether today's plan and email were generated.

## 3. Implementation Constraints

### 3.1 Tech Stack

- Application framework: Next.js App Router.
- Deployment: Vercel.
- Database and auth: Supabase Postgres and Supabase Auth.
- Scheduled jobs: Vercel Cron calling protected Next.js route handlers.
- Email: Resend by default, behind a provider abstraction so another transactional provider can be swapped later.
- AI: OpenAI by default, behind a server-only flashcard generation adapter with queued job processing.
- Language: TypeScript.

### 3.2 Repository Structure

The implementation should start with this repository structure:

```text
content/
  seeds/
    leetcode-patterns.md
    backend-roadmaps.md
    system-design-prompts.md
docs/
  superpowers/
    specs/
scripts/
  scrape/
  import/
src/
  app/
  components/
  features/
  lib/
  server/
supabase/
  migrations/
  seed/
```

### 3.3 Code Conventions

- Use strict TypeScript.
- Keep server-only Supabase clients separate from browser clients.
- Keep feature code grouped by domain: LeetCode, roadmap, system design, flashcards, notifications.
- Do not mix scraping logic into request-time application code.
- Prefer small modules with explicit interfaces over large cross-domain utility files.
- Treat Markdown seed files as content inputs, not generated throwaway artifacts.

### 3.4 Testing Requirements

- Unit tests for scheduling logic, timer calculations, spaced repetition decisions, and Markdown seed parsing.
- Integration tests for Supabase import idempotency.
- Route handler tests for protected cron endpoints.
- End-to-end smoke test for sign-in, dashboard loading, starting a timer, completing a task, and reviewing a flashcard.

### 3.5 Content Compliance Constraints

- Scraped content must retain source URLs and scraped dates.
- The seed corpus should store summaries, metadata, links, and curated excerpts rather than unnecessary full-page copies.
- Runtime UI should link back to original sources for external articles and problems.
- If a source blocks scraping or has unclear terms, the scraper should skip it and record a manual-review note in the seed file.

### 3.6 Deployment Constraints

- The app must run without persistent background workers.
- Long-running work must be split into bounded cron-triggered batches.
- Cron endpoints must be idempotent.
- Environment variables must define Supabase, email, AI, and cron secrets.
- The application should support one deployment environment first, with production/staging separation deferred until needed.

## 4. Milestone Boundaries

### Milestone 1: Foundation and Seed Content

- Next.js app scaffolded for Vercel.
- Supabase Auth connected.
- Database schema and row-level security created.
- Scrapers generate Markdown seed files.
- Import scripts load seed content into Supabase.

### Milestone 2: Daily Dashboard and LeetCode Timer

- Dashboard shows today's plan.
- LeetCode pattern browser works.
- Timer links create and complete attempts.
- LeetCode progress updates daily planning inputs.

### Milestone 3: Roadmap and System Design Tracking

- Roadmap checklist and resources are visible and updatable.
- System design prompt library and sessions are visible and updatable.
- Daily planner chooses tasks across all three tracks.

### Milestone 4: Notifications and Flashcards

- Daily email is sent from a Vercel Cron job.
- Flashcards can be reviewed with spaced repetition.
- AI draft flashcards are generated asynchronously and accepted or rejected.

## 5. Implementation Defaults

- Email provider default: Resend, behind a small server-side email adapter.
- AI provider default: OpenAI, behind a small server-side flashcard generation adapter.
- Initial roadmap source: roadmap.sh backend roadmap and linked topic resources.
- Initial LeetCode corpus: a curated Markdown taxonomy of common interview patterns and subpatterns, with each problem linked to its original LeetCode URL.
- Initial system design corpus: curated Markdown prompt files using source links, summaries, expected concepts, and personal notes rather than full copied articles.

Implementation planning may replace a provider only if the adapter interface and acceptance criteria remain unchanged.
