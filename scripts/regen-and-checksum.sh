#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Script: regen-and-checksum.sh
# Purpose: Regenerate synthetic dataset and verify determinism with sha256
# ==============================================================================

SEED="${1:-20261022}"
SCALE="${2:-small}"

echo "==> Regenerating synthetic dataset with seed: $SEED, scale: $SCALE..."
python -m pipeline.datagen generate --scale "$SCALE" --seed "$SEED"
python -m pipeline.datagen validate
python -m pipeline.datagen reproduce
