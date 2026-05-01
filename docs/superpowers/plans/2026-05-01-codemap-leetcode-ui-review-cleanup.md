# Codemap LeetCode UI Review Cleanup Plan

## Goals

- Keep the current LeetCode UI visually stable while making the implementation easier to maintain.
- Reuse LeetCode-local components and helpers instead of importing types from presentation components.
- Improve React/Next behavior around client boundaries, derived data, and dropdown accessibility.
- Add regression coverage for the current LeetCode menu and core LeetCode screens.

## Review Findings

1. `leetcode-problem-table.tsx` exports shared row types and owns too many unrelated helpers.
2. `/leetcode`, `/leetcode/dashboard`, and `/leetcode/stats` duplicate server-side row shaping and repeatedly filter attempts for every problem.
3. LeetCode pages duplicate duration/date/percentage helpers and badge tone mappings.
4. Dropdowns in `AppShell` and the problem table use always-mounted document listeners and minimal ARIA state.
5. Dashboard derived data recomputes avoidable arrays and filters on every render.
6. Existing UI changes need behavior and visual regression tests so the menu, search, filters, dashboard, and stats layout do not drift.

## Execution Steps

1. Extract LeetCode row types into `leetcode-types.ts`.
2. Extract shared formatters and percentage helpers into `leetcode-formatters.ts`.
3. Extract server-side LeetCode page data shaping into one server helper.
4. Add a reusable `useOutsideClick` hook with active-only `pointerdown` and Escape handling.
5. Update the app shell and LeetCode table menus to use the hook and expose ARIA state.
6. Clean low-risk duplicate UI logic in dashboard/stats/practice without changing the layout direction.
7. Add/repair Vitest regression tests for app shell, practice search/filter behavior, dashboard card layout, and coming-soon routes.
8. Add Playwright visual snapshots for `/leetcode`, `/leetcode/dashboard`, and `/leetcode/stats`.
9. Verify with focused tests, full Vitest, typecheck, lint, build, and Playwright.

## Verification

- `corepack pnpm exec vitest run src/ui/app-shell.test.tsx`
- `corepack pnpm exec vitest run 'src/app/(dashboard)/leetcode/**/*.test.tsx'`
- `corepack pnpm test`
- `corepack pnpm exec tsc --noEmit`
- `corepack pnpm lint`
- `corepack pnpm build`
- `corepack pnpm test:e2e`
