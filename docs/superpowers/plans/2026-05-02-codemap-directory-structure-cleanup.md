# Codemap Directory Structure Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize Codemap so route files, feature implementation, backend integrations, domain logic, and static data have clear homes while preserving current behavior and public URLs.

**Architecture:** Keep `src/app` as thin Next.js routing glue. Move LeetCode, auth, shell, and coming-soon implementation into `src/features`. Keep server-only integrations in `src/backend`, pure logic in `src/domain`, static datasets in `src/data`, and shared test setup in `src/test`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Firebase, Vitest, Playwright, pnpm.

---

### Task 1: Baseline And Route Group Rename

**Files:**
- Move: `src/app/(dashboard)` -> `src/app/(app)`
- Modify imports that reference moved route-local files.

- [ ] **Step 1: Confirm baseline tree**

Run:

```bash
git status --short
rg --files src/app | sort
```

Expected: clean status before moves and route files under `src/app/(dashboard)`.

- [ ] **Step 2: Rename route group**

Run:

```bash
mkdir -p 'src/app/(app)'
mv 'src/app/(dashboard)'/* 'src/app/(app)'/
rmdir 'src/app/(dashboard)'
```

Expected: public URLs do not change because route groups are source-only.

- [ ] **Step 3: Run route-focused tests**

Run:

```bash
corepack pnpm exec vitest run 'src/app/(app)/coming-soon-pages.test.tsx' 'src/app/(app)/leetcode/leetcode-loading.test.tsx'
```

Expected: tests either pass or fail only because imports still point at old locations, which later tasks address.

### Task 2: Move Shared App Feature Code

**Files:**
- Create: `src/features/auth/`
- Create: `src/features/shell/`
- Create: `src/features/coming-soon/`
- Move: `src/ui/auth-provider.tsx`
- Move: `src/ui/login-form.tsx`
- Move: `src/ui/login-form.test.tsx`
- Move: `src/ui/app-shell.tsx`
- Move: `src/ui/app-shell.test.tsx`
- Move: `src/ui/use-outside-click.ts`
- Move: `src/ui/coming-soon-page.tsx`

- [ ] **Step 1: Move files into feature-owned folders**

Run:

```bash
mkdir -p src/features/auth src/features/shell src/features/coming-soon
mv src/ui/auth-provider.tsx src/features/auth/auth-provider.tsx
mv src/ui/login-form.tsx src/features/auth/login-form.tsx
mv src/ui/login-form.test.tsx src/features/auth/login-form.test.tsx
mv src/ui/app-shell.tsx src/features/shell/app-shell.tsx
mv src/ui/app-shell.test.tsx src/features/shell/app-shell.test.tsx
mv src/ui/use-outside-click.ts src/features/shell/use-outside-click.ts
mv src/ui/coming-soon-page.tsx src/features/coming-soon/coming-soon-page.tsx
```

- [ ] **Step 2: Update imports**

Replace old imports:

```ts
import { AuthProvider } from "@/ui/auth-provider";
import { LoginForm } from "@/ui/login-form";
import { AppShell } from "@/ui/app-shell";
import { ComingSoonPage } from "@/ui/coming-soon-page";
import { useOutsideClick } from "@/ui/use-outside-click";
```

with:

```ts
import { AuthProvider } from "@/features/auth/auth-provider";
import { LoginForm } from "@/features/auth/login-form";
import { AppShell } from "@/features/shell/app-shell";
import { ComingSoonPage } from "@/features/coming-soon/coming-soon-page";
import { useOutsideClick } from "@/features/shell/use-outside-click";
```

- [ ] **Step 3: Run shared feature tests**

Run:

```bash
corepack pnpm exec vitest run src/features/auth/login-form.test.tsx src/features/shell/app-shell.test.tsx
```

Expected: tests pass after import updates.

### Task 3: Move LeetCode Feature Code

**Files:**
- Create: `src/features/leetcode/actions/`
- Create: `src/features/leetcode/components/`
- Create: `src/features/leetcode/data/`
- Create: `src/features/leetcode/stats/`
- Create: `src/features/leetcode/storage/`
- Move route-adjacent LeetCode implementation files out of `src/app/(app)/leetcode`.

- [ ] **Step 1: Move LeetCode implementation files**

Run:

```bash
mkdir -p src/features/leetcode/actions src/features/leetcode/components src/features/leetcode/data src/features/leetcode/stats src/features/leetcode/storage
mv 'src/app/(app)/leetcode/actions.ts' src/features/leetcode/actions/actions.ts
mv 'src/app/(app)/leetcode/leetcode-attempt-overlay.tsx' src/features/leetcode/components/leetcode-attempt-overlay.tsx
mv 'src/app/(app)/leetcode/leetcode-loading-ui.tsx' src/features/leetcode/components/leetcode-loading-ui.tsx
mv 'src/app/(app)/leetcode/leetcode-pattern-overview.tsx' src/features/leetcode/components/leetcode-pattern-overview.tsx
mv 'src/app/(app)/leetcode/leetcode-practice-dashboard.tsx' src/features/leetcode/components/leetcode-practice-dashboard.tsx
mv 'src/app/(app)/leetcode/leetcode-practice-summary.tsx' src/features/leetcode/components/leetcode-practice-summary.tsx
mv 'src/app/(app)/leetcode/leetcode-problem-table.tsx' src/features/leetcode/components/leetcode-problem-table.tsx
mv 'src/app/(app)/leetcode/leetcode-ui.tsx' src/features/leetcode/components/leetcode-ui.tsx
mv 'src/app/(app)/leetcode/dashboard/leetcode-dashboard-client.tsx' src/features/leetcode/components/leetcode-dashboard-client.tsx
mv 'src/app/(app)/leetcode/leetcode-formatters.ts' src/features/leetcode/data/leetcode-formatters.ts
mv 'src/app/(app)/leetcode/leetcode-page-data.ts' src/features/leetcode/data/leetcode-page-data.ts
mv 'src/app/(app)/leetcode/leetcode-db-client.ts' src/features/leetcode/data/leetcode-db-client.ts
mv 'src/app/(app)/leetcode/leetcode-db-server.ts' src/features/leetcode/data/leetcode-db-server.ts
mv 'src/app/(app)/leetcode/leetcode-stats.ts' src/features/leetcode/stats/leetcode-stats.ts
mv 'src/app/(app)/leetcode/local-attempt-storage.ts' src/features/leetcode/storage/local-attempt-storage.ts
mv 'src/app/(app)/leetcode/leetcode-types.ts' src/features/leetcode/types.ts
```

- [ ] **Step 2: Move LeetCode tests with their owned units**

Run:

```bash
mv 'src/app/(app)/leetcode/leetcode-practice-dashboard.test.tsx' src/features/leetcode/components/leetcode-practice-dashboard.test.tsx
mv 'src/app/(app)/leetcode/leetcode-problem-table.test.tsx' src/features/leetcode/components/leetcode-problem-table.test.tsx
mv 'src/app/(app)/leetcode/dashboard/leetcode-dashboard-client.test.tsx' src/features/leetcode/components/leetcode-dashboard-client.test.tsx
mv 'src/app/(app)/leetcode/leetcode-stats.test.ts' src/features/leetcode/stats/leetcode-stats.test.ts
```

- [ ] **Step 3: Update LeetCode imports**

Use feature imports from route files:

```ts
import { saveLeetCodeAttempt } from "@/features/leetcode/actions/actions";
import { getLeetcodePageData } from "@/features/leetcode/data/leetcode-page-data";
import { LeetcodePracticeDashboard } from "@/features/leetcode/components/leetcode-practice-dashboard";
import { LeetcodeDashboardClient } from "@/features/leetcode/components/leetcode-dashboard-client";
import { LeetcodeRouteSkeleton } from "@/features/leetcode/components/leetcode-loading-ui";
```

Inside feature files, prefer local relative imports such as `../types`, `../data/leetcode-formatters`, and `./leetcode-ui`.

- [ ] **Step 4: Run LeetCode focused tests**

Run:

```bash
corepack pnpm exec vitest run 'src/features/leetcode/**/*.test.ts*' 'src/app/(app)/leetcode/leetcode-loading.test.tsx'
```

Expected: LeetCode feature tests and route loading tests pass.

### Task 4: Remove Generic `src/lib`

**Files:**
- Move: `src/lib/leetcode-patterns.ts` -> `src/features/leetcode/data/leetcode-patterns.ts`
- Move: `src/lib/leetcode-patterns.test.ts` -> `src/features/leetcode/data/leetcode-patterns.test.ts`
- Delete directory: `src/lib` if empty.

- [ ] **Step 1: Move pattern loader**

Run:

```bash
mv src/lib/leetcode-patterns.ts src/features/leetcode/data/leetcode-patterns.ts
mv src/lib/leetcode-patterns.test.ts src/features/leetcode/data/leetcode-patterns.test.ts
rmdir src/lib
```

- [ ] **Step 2: Update imports**

Replace:

```ts
import { getLeetcodePatternTree } from "@/lib/leetcode-patterns";
```

with:

```ts
import { getLeetcodePatternTree } from "@/features/leetcode/data/leetcode-patterns";
```

- [ ] **Step 3: Run pattern loader test**

Run:

```bash
corepack pnpm exec vitest run src/features/leetcode/data/leetcode-patterns.test.ts
```

Expected: pattern normalization tests pass.

### Task 5: Full Import And Route Verification

**Files:**
- Modify any import path broken by Tasks 1-4.
- Keep public URLs stable.

- [ ] **Step 1: Find stale imports and old paths**

Run:

```bash
rg -n '@/ui/(auth-provider|login-form|app-shell|coming-soon-page|use-outside-click)|@/lib/leetcode-patterns|src/app/\(dashboard\)|from "\.\./leetcode-|from "\./leetcode-' src tests scripts
```

Expected: no stale imports from moved paths.

- [ ] **Step 2: Typecheck**

Run:

```bash
corepack pnpm exec tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 3: Full unit test run**

Run:

```bash
corepack pnpm test
```

Expected: exit code 0.

### Task 6: Final Quality Gates

**Files:**
- No new files unless verification reveals broken imports or route assumptions.

- [ ] **Step 1: Lint**

Run:

```bash
corepack pnpm lint
```

Expected: exit code 0.

- [ ] **Step 2: Build**

Run:

```bash
corepack pnpm build
```

Expected: exit code 0.

- [ ] **Step 3: E2E tests**

Run:

```bash
corepack pnpm test:e2e
```

Expected: exit code 0, or report any environmental blocker separately from code failures.

- [ ] **Step 4: Review final tree**

Run:

```bash
find src -maxdepth 3 -type d | sort
git status --short
```

Expected: `src/features` exists, `src/lib` does not exist, `src/app/(app)` replaced `src/app/(dashboard)`, and changes are limited to the cleanup scope.
