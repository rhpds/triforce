.PHONY: help up down test-contracts test-infra test-unit test-contracts-compliance test-integration test-scale test-all clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

# --- Infrastructure ---

up: ## Start all services (podman-compose)
	podman-compose -f infrastructure/podman-compose.yaml up --build -d

down: ## Stop all services
	podman-compose -f infrastructure/podman-compose.yaml down

logs: ## Tail all service logs
	podman-compose -f infrastructure/podman-compose.yaml logs -f

# --- Test Stages (TDD/EDD Red-Green Matrix) ---

test-contracts: ## Stage 0: Validate all API contracts (OpenAPI, AsyncAPI, MCP, A2A)
	python3 -m pytest tests/contracts/ -v --tb=short

test-infra: ## Stage 1: Verify containers build and services start with health checks
	python3 -m pytest tests/ -v --tb=short -k "stage_1"

test-unit: ## Stage 2: Per-service unit tests
	cd services/healthcare-agent && python3 -m pytest tests/ -v --tb=short
	cd services/finserv-agent && ./mvnw test -q 2>/dev/null || mvn test -q
	cd services/orchestrator && go test ./... -v

test-contracts-compliance: ## Stage 3: Verify responses match contract schemas
	python3 -m pytest tests/ -v --tb=short -k "stage_3"

test-integration: ## Stage 4: Cross-service workflow tests (requires podman-compose up)
	python3 -m pytest tests/e2e/ -v --tb=short

test-scale: ## Stage 5: Synthetic load and throughput tests
	python3 -m pytest tests/ -v --tb=short -k "stage_5"

test-all: ## Run all test stages sequentially (Stage 0 → 5)
	@echo "=== Stage 0: Contract Validation ==="
	$(MAKE) test-contracts
	@echo "\n=== Stage 1: Infrastructure ==="
	$(MAKE) test-infra
	@echo "\n=== Stage 2: Unit Tests ==="
	$(MAKE) test-unit
	@echo "\n=== Stage 3: Contract Compliance ==="
	$(MAKE) test-contracts-compliance
	@echo "\n=== Stage 4: Integration ==="
	$(MAKE) test-integration
	@echo "\n=== Stage 5: Scale ==="
	$(MAKE) test-scale

# --- Build ---

build-healthcare: ## Build healthcare agent container
	podman build --platform linux/amd64 -t triforce/healthcare-agent:latest -f services/healthcare-agent/Containerfile services/healthcare-agent/

build-finserv: ## Build finserv agent container
	podman build --platform linux/amd64 -t triforce/finserv-agent:latest -f services/finserv-agent/Containerfile services/finserv-agent/

build-orchestrator: ## Build orchestrator container
	podman build --platform linux/amd64 -t triforce/orchestrator:latest -f services/orchestrator/Containerfile services/orchestrator/

build-all: build-healthcare build-finserv build-orchestrator ## Build all containers

clean: ## Remove build artifacts and containers
	podman-compose -f infrastructure/podman-compose.yaml down -v --remove-orphans 2>/dev/null || true
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	cd services/finserv-agent && ./mvnw clean -q 2>/dev/null || mvn clean -q 2>/dev/null || true
