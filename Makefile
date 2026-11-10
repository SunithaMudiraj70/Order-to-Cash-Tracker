export PYTHONPATH := backend/pipeline/src

.DEFAULT_GOAL := help

.PHONY: help setup migrate reset-db gen-small gen-full load detect validate test lint docs dev-api dev-web dev clean doctor smoke seed-sql

help: ## Show this help message
	@echo "Order-to-Cash Revenue Leakage & Process Delay Tracker"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

setup: ## Install all dependencies across backend, frontend, and pipeline
	@echo "--> Setting up Node.js workspaces..."
	cd backend/api && npm install
	cd frontend && npm install
	@echo "--> Setting up Python pipeline..."
	cd backend/pipeline && python -m pip install -e ".[dev]"

migrate: ## Run schema migrations via Python migrator
	python -m pipeline.db.migrate

reset-db: ## Reset database and reapply migrations
	python -m pipeline.db.migrate --reset --yes

gen-small: ## Generate small synthetic test dataset with known anomalies
	python -m pipeline.datagen generate --scale small

gen-full: ## Generate full scale synthetic dataset with known anomalies
	python -m pipeline.datagen generate --scale full

seed-sql: ## Generate on-demand database seed SQL script
	python -m pipeline.datagen seed-sql --scale full

load: ## Load generated datasets into database
	python -m pipeline.loader load --scale small

detect: ## Run anomaly detector rules against operational events
	python -m pipeline.detector run

validate: ## Validate data integrity, schema consistency and checksums
	python -m pipeline.datagen validate

test: ## Run test suites across api, frontend, and pipeline
	@echo "--> Testing Backend API..."
	cd backend/api && npm test
	@echo "--> Testing Frontend..."
	cd frontend && npm test
	@echo "--> Testing Python Pipeline..."
	cd backend/pipeline && pytest
	python -m pipeline.datagen reproduce

doctor: ## Run system diagnostic doctor check
	python scripts/doctor.py

smoke: ## Run endpoint connectivity smoke tests directly and via proxy
	python scripts/smoke_test.py

lint: ## Run linting and typechecking across all projects
	@echo "--> Linting Backend API..."
	cd backend/api && npm run lint && npx tsc --noEmit
	@echo "--> Linting Frontend..."
	cd frontend && npm run lint && npx tsc --noEmit
	@echo "--> Linting Python Pipeline..."
	ruff check backend/pipeline/
	ruff format --check backend/pipeline/
	mypy backend/pipeline/src

docs: ## Generate data dictionary markdown from Pydantic schema
	python scripts/gen_data_dictionary.py

dev-api: ## Start Backend API server in watch mode
	cd backend/api && npm run dev

dev-web: ## Start Frontend in development mode
	cd frontend && npm run dev

dev: ## Start API and Frontend concurrently
	npx concurrently "npm run dev --prefix backend/api" "npm run dev --prefix frontend"

clean: ## Clean cache, build artifacts and temporary files
	rm -rf backend/api/dist frontend/dist
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	find . -type d -name ".ruff_cache" -exec rm -rf {} +
