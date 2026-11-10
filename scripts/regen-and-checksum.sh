#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Script: regen-and-checksum.sh
# Purpose: Regenerate synthetic dataset and verify determinism with sha256
# ==============================================================================

SEED="${1:-20261022}"
SCALE="${2:-small}"
OUTPUT_DIR="data/processed"

echo "==> Regenerating synthetic dataset with seed: $SEED, scale: $SCALE..."
python -m datagen.generators.main --scale "$SCALE" --seed "$SEED" --out "$OUTPUT_DIR"

echo "==> Calculating SHA-256 checksums of generated CSV/JSON data files..."
mkdir -p data/manifests
MANIFEST_FILE="data/manifests/checksums_${SCALE}_${SEED}.txt"

if command -v sha256sum >/dev/null 2>&1; then
  find "$OUTPUT_DIR" -type f \( -name "*.csv" -o -name "*.json" \) -exec sha256sum {} + > "$MANIFEST_FILE"
else
  find "$OUTPUT_DIR" -type f \( -name "*.csv" -o -name "*.json" \) -exec shasum -a 256 {} + > "$MANIFEST_FILE"
fi

echo "==> Manifest recorded at: $MANIFEST_FILE"
cat "$MANIFEST_FILE"

