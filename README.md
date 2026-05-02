# LeetCode Backend Helper

Personal learning assistant for backend interview preparation, built with Next.js.

## Getting Started

Install dependencies and run the development server with pnpm:

```bash
corepack pnpm install
corepack pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Layout

- `src/app` – thin Next.js route glue: layouts, pages, loading states, and API endpoints.
- `src/features` – product-area implementation such as auth, app shell, coming-soon pages, and LeetCode UI/data orchestration.
- `src/backend` – server-only integrations and persistence (Firebase admin access, AI jobs, cron, email, env/config helpers).
- `src/domain` – reusable pure feature logic that does not depend on React, Next.js, Firebase, or browser APIs.
- `src/ui` – small shared UI primitives that are reused across features.
- `src/data` – checked-in static datasets.
- `src/test` – shared test setup utilities.

## Crawl4AI Setup (Python Scraper)

To install Crawl4AI for ad-hoc scraping:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements-crawl4ai.txt
python3 -m playwright install --with-deps chromium
```

Run a single URL scrape:

```bash
corepack pnpm scrape:crawl4ai "https://example.com" --output crawl-output.md
```

Run a constrained deep crawl:

```bash
corepack pnpm scrape:crawl4ai "https://docs.crawl4ai.com" --deep --max-depth 2 --max-pages 20 --check-robots-txt
```

### Crawl4AI Roadmap Tree Scraper

To crawl an entire roadmap tree and save each roadmap page: 

```bash
corepack pnpm scrape:roadmap-tree https://roadmap.sh/backend \
  --tree \
  --scope-prefix /backend \
  --scope-regex "^/backend(?:/[^/]+)?$" \
  --max-depth 4 \
  --max-pages 120 \
  --remove-consent-popups --simulate-user --wait-until networkidle --wait-for-timeout 1000
```

Manifest output defaults to `scripts/scrape/crawl-output/roadmap-tree.json`.

Convert a crawl manifest into structured JSON:

```bash
corepack pnpm scrape:roadmap-json -- scripts/scrape/crawl-output/roadmap-tree.json \
  --output scripts/scrape/crawl-output/roadmap-tree.structured.json \
  --root-key backend
```

Create the app-ready backend roadmap graph with per-topic summaries and resources:

```bash
corepack pnpm scrape:roadmap-json -- https://roadmap.sh/backend.json \
  --output src/data/roadmap/backend-roadmap.json \
  --root-key backend
```

## Firebase Emulator Setup (local)

To run Firebase locally:

```bash
corepack pnpm install
corepack pnpm firebase:emulators
```

In local auth/Firestore client code, keep emulator hosts in `.env.local`:

```bash
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
NEXT_PUBLIC_USE_FIREBASE_AUTH_EMULATOR=true
```

Use your emulator `projectId` values from `.firebaserc` and your Firebase web config in env:

```bash
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-firebase-project-id>
NEXT_PUBLIC_FIREBASE_API_KEY=demo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=leetcode-backend-helper-dev.firebaseapp.com
```

Seed Firestore collections for local use:

```bash
corepack pnpm seed:firestore
```

Use dry-run mode to preview what will be written:

```bash
corepack pnpm seed:firestore -- --dry-run
```

The seed creates schema-shaped collections for:

- `profiles`
- `notification_preferences`
- `leetcode_major_patterns`
- `leetcode_minor_patterns`
- `leetcode_attempts`
- `daily_plans`
- `daily_plan_items`
- `flashcards`
- `ai_generation_jobs`
- `email_notifications`

## Verification

```bash
corepack pnpm lint
corepack pnpm test
corepack pnpm build
corepack pnpm test:e2e
```
