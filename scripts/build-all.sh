#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo "Expense Super - Multi-Platform Production Build Pipeline"
echo "=========================================================="

echo "Step 1: Building shared core packages..."
pnpm run build

echo "Step 2: Building Web application bundle (apps/web)..."
pnpm run web:build

echo "Step 3: Building Desktop application frontend bundle (apps/desktop)..."
pnpm run desktop:build

echo "Step 4: Typechecking Mobile application (apps/mobile)..."
pnpm run mobile:typecheck

echo "Step 5: Verifying ONNX Model assets..."
if [ ! -f "ml/models/isolation_forest.onnx" ] || [ ! -f "ml/models/kmeans_clusterer.onnx" ]; then
  echo "Error: ONNX model artifacts missing in ml/models/ directory!"
  exit 1
fi

echo "=========================================================="
echo "All multi-platform build targets completed successfully!"
echo "=========================================================="
