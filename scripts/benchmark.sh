#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo "Expense Super - Performance Profiling & Latency Benchmarks"
echo "=========================================================="

echo "Running automated latency and throughput test suite..."
pnpm vitest run tests/performance-benchmarks.test.ts

echo "=========================================================="
echo "All performance latency targets (< 10ms analytics, < 25ms ML) PASSED!"
echo "=========================================================="
