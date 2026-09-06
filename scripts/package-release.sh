#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo "Expense Super - Release Packaging & Verification"
echo "=========================================================="

RELEASE_DIR="dist-release"
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR/web"
mkdir -p "$RELEASE_DIR/desktop-frontend"
mkdir -p "$RELEASE_DIR/models"

echo "1. Ensuring full clean build..."
bash scripts/build-all.sh

echo "2. Copying Web production distribution..."
cp -r apps/web/dist/* "$RELEASE_DIR/web/"

echo "3. Copying Desktop frontend distribution..."
cp -r apps/desktop/dist/* "$RELEASE_DIR/desktop-frontend/"

echo "4. Copying ONNX runtime model assets & manifests..."
cp ml/models/*.onnx "$RELEASE_DIR/models/"
cp ml/models/*.json "$RELEASE_DIR/models/"

echo "5. Generating Release Manifest..."
cat <<EOF > "$RELEASE_DIR/release-manifest.json"
{
  "name": "Expense Super",
  "version": "1.0.0",
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "targets": {
    "web": "dist-release/web",
    "desktop": "dist-release/desktop-frontend",
    "models": "dist-release/models"
  },
  "privacy": "Local-First / Zero External Raw Financial Data Transmission",
  "license": "Proprietary"
}
EOF

echo "=========================================================="
echo "Release packaging complete! Staged in: $RELEASE_DIR"
echo "=========================================================="
