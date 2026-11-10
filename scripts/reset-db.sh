#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Script: reset-db.sh
# Purpose: Reset database using Supabase CLI or direct postgres fallback
# ==============================================================================

echo "==> Resetting database..."

if command -v supabase >/dev/null 2>&1; then
  echo "Using Supabase CLI to reset and rerun migrations..."
  supabase db reset
else
  echo "Supabase CLI not found. Falling back to psql via docker-compose..."
  DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgrespassword@127.0.0.1:54322/postgres}"
  
  for file in supabase/migrations/*.sql; do
    echo "Applying migration: $file"
    psql "$DATABASE_URL" -f "$file"
  done
  
  if [ -f supabase/seed/seed.sql ]; then
    echo "Applying seed data: supabase/seed/seed.sql"
    psql "$DATABASE_URL" -f "supabase/seed/seed.sql"
  fi
fi

echo "==> Database reset complete."

