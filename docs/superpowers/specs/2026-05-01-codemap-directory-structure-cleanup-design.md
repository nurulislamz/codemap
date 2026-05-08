# Codemap Directory Structure Cleanup Design

## Goal

Make the repository easier to navigate without changing current product behavior. The cleanup should clarify which files are Next.js routes, which files are feature implementation, which files are backend integrations, and which files are reusable domain logic.

## Scope

This is a behavior-preserving refactor. Existing app behavior should remain the same unless a route-group rename improves source clarity without changing the public URL. Public paths such as `/leetcode`, `/leetcode/dashboard`, `/leetcode/stats`, `/login`, and API routes should continue to work.

The cleanup should preserve current uncommitted UI, auth, LeetCode, and test work. It must not revert deleted timer route files or restore older behavior unless current imports require an explicit compatibility shim.

## Current Problems

- `src/app/(dashboard)/leetcode` mixes route files, components, persistence helpers, client storage, formatting helpers, stats logic, and tests.
- The route group name `(dashboard)` is misleading because it wraps the whole authenticated app shell, not only a dashboard page.
- `src/ui` mixes global shell/auth components with reusable primitives and feature-specific widgets.
- `src/lib/leetcode-patterns.ts` is an unclear layer because the app already has `src/backend`, `src/domain`, and `src/data`.
- Generated scrape outputs and test artifacts can be mistaken for source if they appear in the repository tree.
- Tests are colocated inconsistently across route, UI, backend, domain, script, and e2e areas.

## Target Structure

```text
src/app/
  (app)/
    layout.tsx
    dashboard/page.tsx
    leetcode/
      page.tsx
      loading.tsx
      dashboard/page.tsx
      dashboard/loading.tsx
      stats/page.tsx
      stats/loading.tsx
    roadmap/page.tsx
    system-design/page.tsx
  api/
  login/
  layout.tsx
  page.tsx

src/features/
  auth/
    auth-provider.tsx
    login-form.tsx
  coming-soon/
    coming-soon-page.tsx
  leetcode/
    actions/
    components/
    data/
    stats/
    storage/
    types.ts
  shell/
    app-shell.tsx
    use-outside-click.ts

src/backend/
  ai/
  cron/
  data/
  db/
  email/
  firebase/
  ids/
  env.ts

src/domain/
  leetcode/
  planning/

src/data/
  leetcode/
  roadmap/

src/test/
```

## Architecture Rules

- `src/app` should contain routing glue: layouts, pages, loading states, and API routes.
- `src/features` should contain UI and feature orchestration that belongs to a product area.
- `src/backend` should contain server-only integrations, persistence, cron support, email, Firebase admin access, and environment handling.
- `src/domain` should contain pure business logic that can be tested without React, Next.js, Firebase, or browser APIs.
- `src/data` should contain checked-in static datasets.
- `src/test` should contain shared test setup and test-only shims.

Dependencies should generally flow in this direction:

```text
src/app -> src/features -> src/backend/domain/data
src/backend -> src/domain/data
src/features -> src/domain/data
src/domain -> no app/backend/feature imports
```

Do not create a generic `src/lib` bucket during this cleanup. Existing code in `src/lib` should move to the most specific layer that matches its responsibility.

## LeetCode Feature Split

Move LeetCode implementation out of the route folder into `src/features/leetcode`.

Proposed mapping:

- Route pages and loading files stay under `src/app/(app)/leetcode`.
- Table, dashboard, summary, overview, overlay, skeleton, and visual components move to `src/features/leetcode/components`.
- Server actions move to `src/features/leetcode/actions`.
- Page-data shaping and pattern access move to `src/features/leetcode/data`.
- Attempt persistence wrappers may move to `src/features/leetcode/data` while lower-level Firebase schemas stay in `src/backend/firebase`.
- Stats calculations move to `src/features/leetcode/stats`.
- Local attempt storage moves to `src/features/leetcode/storage`.
- Shared row/input types move to `src/features/leetcode/types.ts`.

The current Firestore behavior should be preserved. This design does not remodel attempt documents, user IDs, or collection paths.

## Shared UI Split

Move current `src/ui` files based on ownership:

- App shell and outside-click hook move to `src/features/shell`.
- Auth provider and login form move to `src/features/auth`.
- Coming-soon page moves to `src/features/coming-soon`.
- Generic primitives such as skeleton, task card, status select, and timer panel can remain in `src/ui` if they are still used across multiple features.

This keeps `src/ui` small and truly reusable instead of making it a catch-all folder.

## Routes

Rename the route group from `src/app/(dashboard)` to `src/app/(app)`. This is a source-only change; route groups do not affect public URLs.

Keep public URLs stable:

- `/leetcode`
- `/leetcode/dashboard`
- `/leetcode/stats`
- `/dashboard`
- `/roadmap`
- `/system-design`
- `/login`

Do not move pages to new public URL roots unless a build or import constraint proves the current routes are blocking the cleanup.

## Scripts And Generated Files

Keep executable scripts under `scripts`.

Generated scrape outputs should remain ignored. If generated files are currently tracked unintentionally, handle them in a separate explicit cleanup step only after confirming they are not needed as source fixtures.

Script tests can stay near scripts for now because they exercise script-only parsing behavior and are excluded from production builds.

## Testing

Use focused verification after each phase:

- LeetCode unit/component tests after LeetCode moves.
- Shell/auth tests after shared UI moves.
- Script tests after any script import changes.
- Full Vitest after all moves.
- Typecheck after import rewrites.
- Lint and Next build before calling the cleanup complete.
- Playwright only after build/typecheck pass, because route/file moves can create runtime issues that unit tests miss.

## Non-Goals

- No UI redesign.
- No Firebase schema or collection-path redesign.
- No attempt outcome model rewrite.
- No migration from Firebase to another persistence layer.
- No dependency cleanup unless a dependency becomes unused directly because of this refactor.
- No large test strategy rewrite.

## Success Criteria

- The source tree makes route files, feature implementation, backend integration, domain logic, and static data easy to distinguish.
- Public app behavior and current URLs still work.
- Current uncommitted work is preserved.
- Imports use clear layer paths instead of route-folder-relative feature imports.
- `src/lib` is removed or left empty only if no code still depends on it.
- Verification commands pass, or any pre-existing failures are clearly identified with evidence.
