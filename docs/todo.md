# CI/CD Setup TODO

## Repository: codemap

### Next
- [ ] Add GitHub Actions workflow directory structure (`.github/workflows`).
- [ ] Add lightweight CI pipeline for lint/test/build with `corepack pnpm`.
- [ ] Add deploy secrets in GitHub repo settings (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).
- [ ] Ensure env vars are not in package, are hidden and are not in repo.
- [ ] Enable `push` + `pull_request` triggers in CI for main and PR checks.
- [ ] Add optional production deploy gate to `main` once secrets are ready.
- [ ] Add branch protection requiring CI status before merge.

### Notes
- Keep CI on Ubuntu only, single job, and cancel outdated runs to stay within free usage.
- Add `workflow_dispatch` so deploy can be run manually when needed.
