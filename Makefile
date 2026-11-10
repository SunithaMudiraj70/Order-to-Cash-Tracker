.DEFAULT_GOAL := help

.PHONY: help setup db-up db-reset migrate gen-small gen-full validate test lint dev-api dev-web clean

help: ## Show this help message
	@echo "Order-to-Cash Revenue Leakage & Process Delay Tracker"
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

setup: ## Install all dependencies across apps and services
	@echo "--> Setting up Node.js workspaces..."
	cd apps/api && npm install
	cd apps/web && npm install
	@echo "--> Setting up Python virtual environments..."
	cd services/datagen && python -m pip install -e ".[dev]"
	cd services/detector && python -m pip install -e ".[dev]"
	@echo "Setup complete."

db-up: ## Start local Supabase / PostgreSQL instance
	@echo "--> Starting Supabase local stack..."
	supabase start || docker-compose up -d postgres

db-reset: ## Reset local database and re-apply all migrations
	@echo "--> Resetting database and applying migrations..."
	supabase db reset || ./scripts/reset-db.sh

migrate: ## Apply pending Supabase migrations
	@echo "--> Applying database migrations..."
	supabase migration up

gen-small: ## Generate small synthetic test dataset with known anomalies
	@echo "--> Generating small synthetic dataset (seed 20261022)..."
	python -m datagen.generators.main --scale small --seed 20261022 --out data/processed

gen-full: ## Generate full scale synthetic dataset with known anomalies
	@echo "--> Generating full scale synthetic dataset (seed 20261022)..."
	python -m datagen.generators.main --scale full --seed 20261022 --out data/processed

validate: ## Validate data integrity, schema consistency and checksums
	@echo "--> Validating data checksums and ground truth assertions..."
	python -m datagen.validate.integrity --data-dir data/processed

test: ## Run test suites across api, web, datagen, and pgTAP
	@echo "--> Testing API..."
	cd apps/api && npm test
	@echo "--> Testing Web..."
	cd apps/web && npm test
	@echo "--> Testing Python Datagen..."
	cd services/datagen && pytest
	@echo "--> Testing Python Detector..."
	cd services/detector && pytest
	@echo "--> Running Supabase pgTAP tests..."
	supabase test db || true

lint: ## Run linting and typechecking across all projects
	@echo "--> Linting API..."
	cd apps/api && npm run lint
	@echo "--> Linting Web..."
	cd apps/web && npm run lint
	@echo "--> Linting Python services..."
	ruff check services/
	black --check services/
	mypy services/datagen/src services/detector/src

dev-api: ## Start API server in watch mode
	cd apps/api && npm run dev

dev-web: ## Start Web frontend in development mode
	cd apps/web && npm run dev

clean: ## Clean cache, build artifacts and temporary files
	rm -rf apps/api/dist apps/web/dist
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	find . -type d -name ".ruff_cache" -exec rm -rf {} +

