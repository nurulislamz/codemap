#!/usr/bin/env bash
# Provision the dev container after creation. Idempotent — safe to re-run.
set -euo pipefail

echo "==> Installing dependencies with pnpm"
pnpm install --frozen-lockfile

echo "==> Installing Playwright Chromium + system deps"
pnpm exec playwright install --with-deps chromium

echo "==> Verifying toolchain"
node --version
pnpm --version
java -version
python3 --version

echo "==> Dev container ready."
echo "    pnpm dev            # Next.js only"
echo "    pnpm dev:local      # Next.js + Firebase emulators (auth, firestore)"
echo "    pnpm test           # unit tests (vitest)"
echo "    pnpm test:e2e       # Playwright e2e"
