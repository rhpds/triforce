.PHONY: help up down test-contracts test-infra test-unit test-contracts-compliance test-integration test-scale test-frontend test-multinode test-modules test-benchmarks test-workflows test-all test-platform test-deployment clean

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

test-frontend: ## Stage 6: Verify all displayed numbers come from live API calls
	python3 -m pytest tests/ -v --tb=short -k "stage_6"

test-multinode: ## Stage 7: Horizontal scaling proves throughput without latency regression
	python3 -m pytest tests/ -v --tb=short -k "stage_7"

test-modules: ## Stage 8: Validate module manifests, Helm flags, and composition
	python3 -m pytest tests/ -v --tb=short -k "stage_8"
	helm template infrastructure/helm --set modules.benchmarking.enabled=true --set modules.speculative.enabled=true --set modules.heterogeneous.enabled=true --set modules.fusion.enabled=true > /dev/null

test-benchmarks: ## Stage 9: Model benchmarks produce valid metrics across tasks/hardware
	python3 -m pytest tests/ -v --tb=short -k "stage_9"

test-workflows: ## Stage 10: End-to-end workflows across all active modules
	python3 -m pytest tests/ -v --tb=short -k "stage_10"

test-all: ## Run core stages sequentially (Stage 0 → 5)
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

test-platform: ## Run ALL stages including modules + benchmarks + workflows (full green light)
	@echo "=========================================="
	@echo "  TRIFORCE PLATFORM VALIDATION"
	@echo "  Stages 0-10 · 90% threshold per stage"
	@echo "=========================================="
	$(MAKE) test-all
	@echo "\n=== Stage 6: Frontend Accuracy ==="
	$(MAKE) test-frontend
	@echo "\n=== Stage 7: Multinode ==="
	$(MAKE) test-multinode
	@echo "\n=== Stage 8: Modules ==="
	$(MAKE) test-modules
	@echo "\n=== Stage 9: Benchmarks ==="
	$(MAKE) test-benchmarks
	@echo "\n=== Stage 10: Workflows ==="
	$(MAKE) test-workflows
	@echo "\n=========================================="
	@echo "  PLATFORM GREEN LIGHT: ALL STAGES PASSED"
	@echo "=========================================="

# --- Deployment Validation (Oberon — Intel Lab) ---

test-deployment: ## Stages D0-D7: Deployment validation for Intel lab cluster (oberon)
	@echo "=========================================="
	@echo "  OBERON DEPLOYMENT VALIDATION"
	@echo "  Stages D0-D7 · CDD → TDD → EDD"
	@echo "=========================================="
	@echo "\n=== Stage D0: Model Contracts ==="
	python3 -m pytest tests/test_deployment.py -v --tb=short -k "TestD0"
	@echo "\n=== Stage D1: Model Infrastructure ==="
	python3 -m pytest tests/test_deployment.py -v --tb=short -k "TestD1"
	@echo "\n=== Stage D2: Model Validation ==="
	python3 -m pytest tests/test_deployment.py -v --tb=short -k "TestD2"
	@echo "\n=== Stage D3: LiteLLM Proxy ==="
	python3 -m pytest tests/test_deployment.py -v --tb=short -k "TestD3"
	@echo "\n=== Stage D4: App Services ==="
	python3 -m pytest tests/test_deployment.py -v --tb=short -k "TestD4"
	@echo "\n=== Stage D5: Integration ==="
	python3 -m pytest tests/test_deployment.py -v --tb=short -k "TestD5"
	@echo "\n=== Stage D6: Benchmarks ==="
	python3 -m pytest tests/test_deployment.py -v --tb=short -k "TestD6"
	@echo "\n=== Stage D7: All 14 Modules ==="
	python3 -m pytest tests/test_deployment.py -v --tb=short -k "TestD7"
	@echo "\n=== Stage D8: Secure (TDX) ==="
	python3 -m pytest tests/test_deployment.py -v --tb=short -k "TestD8"
	@echo "\n=== Stage D9: Virt (KubeVirt) ==="
	python3 -m pytest tests/test_deployment.py -v --tb=short -k "TestD9"
	@echo "\n=== Stage D10: Govern (Kagenti) ==="
	python3 -m pytest tests/test_deployment.py -v --tb=short -k "TestD10"
	@echo "\n=========================================="
	@echo "  OBERON DEPLOYMENT: ALL STAGES PASSED"
	@echo "=========================================="

test-deployment-d0: ## Stage D0 only: Model contracts
	python3 -m pytest tests/test_deployment.py -v --tb=short -k "TestD0"

test-deployment-d1: ## Stage D1 only: Model infrastructure
	python3 -m pytest tests/test_deployment.py -v --tb=short -k "TestD1"

test-deployment-d2: ## Stage D2 only: Model validation
	python3 -m pytest tests/test_deployment.py -v --tb=short -k "TestD2"

test-deployment-d3: ## Stage D3 only: LiteLLM proxy
	python3 -m pytest tests/test_deployment.py -v --tb=short -k "TestD3"

test-deployment-d4: ## Stage D4 only: App services
	python3 -m pytest tests/test_deployment.py -v --tb=short -k "TestD4"

test-deployment-d5: ## Stage D5 only: Integration
	python3 -m pytest tests/test_deployment.py -v --tb=short -k "TestD5"

test-deployment-d6: ## Stage D6 only: Benchmarks
	python3 -m pytest tests/test_deployment.py -v --tb=short -k "TestD6"

test-deployment-d7: ## Stage D7 only: All 14 modules
	python3 -m pytest tests/test_deployment.py -v --tb=short -k "TestD7"

test-deployment-d8: ## Stage D8 only: Secure variant (TDX Confidential Containers)
	python3 -m pytest tests/test_deployment.py -v --tb=short -k "TestD8"

test-deployment-d9: ## Stage D9 only: Virt variant (OpenShift Virtualization)
	python3 -m pytest tests/test_deployment.py -v --tb=short -k "TestD9"

test-deployment-d10: ## Stage D10 only: Govern variant (Kagenti)
	python3 -m pytest tests/test_deployment.py -v --tb=short -k "TestD10"

test-virt-edge: ## Edge + Virt demo validation (V0-V4)
	python3 -m pytest tests/test_virt_edge.py -v --tb=short

# --- Deploy ---

generate-nav: ## Generate showroom nav from enabled modules
	@if [ -n "$(MODULES_ENABLED)" ]; then \
		MODULES_ENABLED="$(MODULES_ENABLED)" python3 scripts/generate-nav.py; \
	else \
		python3 scripts/generate-nav.py; \
	fi

deploy: generate-nav ## Generate nav + helm deploy (NAMESPACE, MODULES_ENABLED, EXTRA_HELM_ARGS)
	cd infrastructure/helm && helm upgrade --install triforce . \
		--namespace $${NAMESPACE:-triforce} \
		$(EXTRA_HELM_ARGS)

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
