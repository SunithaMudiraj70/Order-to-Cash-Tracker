#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Script: bootstrap.sh
# Purpose: Initialize local development environment for the monorepo
# ==============================================================================

echo "==> Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "Error: node is required (v20+)"; exit 1; }
command -v python >/dev/null 2>&1 || { echo "Error: python is required (v3.11+)"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Error: docker is required"; exit 1; }

echo "==> Setting up environment file..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

echo "==> Creating local data directories..."
mkdir -p data/raw data/processed data/ground_truth data/manifests

echo "==> Installing Node.js dependencies..."
(cd apps/api && npm install)
(cd apps/web && npm install)

echo "==> Setting up Python virtual environments..."
(cd services/datagen && python -m pip install -e ".[dev]")
(cd services/detector && python -m pip install -e ".[dev]")

echo "==> Bootstrap completed successfully!"

