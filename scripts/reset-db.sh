#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Script: reset-db.sh
# Purpose: Reset database using Python migration runner
# ==============================================================================

echo "==> Resetting database via pipeline.db.migrate..."
python -m pipeline.db.migrate --reset --yes
echo "==> Database reset complete."
