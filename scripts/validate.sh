#!/usr/bin/env bash
set -euo pipefail

echo "==========================================="
echo "Running Phase 0 Monorepo Validation"
echo "==========================================="

echo "1. Checking pnpm workspace..."
pnpm install --frozen-lockfile=false

echo "2. Running TypeScript typecheck across packages..."
pnpm run typecheck

echo "3. Running ESLint..."
pnpm run lint

echo "4. Running Prettier check..."
pnpm run format:check

echo "5. Running Vitest test suite..."
pnpm run test

echo "6. Running Python ML test suite..."
pnpm run ml:test

echo "==========================================="
echo "All validation checks PASSED!"
echo "==========================================="
