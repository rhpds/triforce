# CLAUDE.md — Agent Instructions for Triforce

## What This Is

Polyglot multi-agent demo platform showcasing the Red Hat + IBM + Intel partnership:
- **Intel** (Power): Xeon 6 CPU + GPU inferencing via MAAS/LiteLLM — heterogeneous compute routing
- **IBM** (Wisdom): Kagenti agentic orchestration — A2A protocol, MCP tools, SPIFFE identity, K8s-native agent governance
- **Red Hat** (Courage): OpenShift + AMQ Streams + vLLM Semantic Router + llm-d — enterprise platform at scale

Two industry verticals: Healthcare (clinical NLP) and Financial Services (fraud/compliance).
Four demo variants: AI (base), Secure (TDX), Virt (KubeVirt), Govern (Kagenti).
14 pluggable optimization modules — cities/events select their subset.

## Architecture

```
vLLM Semantic Router (complexity → right hardware)
         │
    ┌────┼────┐
    │    │    │
Healthcare  FinServ  Orchestrator
(Python)    (Quarkus) (Go)
    │    │    │
    └────┼────┘
         │
     ┌───┼───┐
     │   │   │
  MCP  AMQ   PostgreSQL
  8 tools Streams  audit log
         │
    MAAS/LiteLLM
    CPU ($0) + GPU ($/token)
```

## Development

```bash
cp .env.example .env  # Add LITELLM_API_KEY
source .env && export LITELLM_API_BASE LITELLM_API_KEY
make up               # podman-compose (requires exported env vars)

# Tests by stage (11 stages total)
make test-contracts              # Stage 0: schema validation (120 tests)
make test-infra                  # Stage 1: containers + health
make test-unit                   # Stage 2: per-service logic (49+13+3+29 tests)
make test-contracts-compliance   # Stage 3: response schema compliance
make test-integration            # Stage 4: cross-service workflows
make test-scale                  # Stage 5: synthetic load
make test-frontend               # Stage 6: live numbers accuracy
make test-multinode              # Stage 7: horizontal scaling
make test-modules                # Stage 8: module manifest + Helm validation (11 tests)
make test-benchmarks             # Stage 9: benchmark rubric validation (20 tests)
make test-workflows              # Stage 10: end-to-end workflows (8 tests)
make test-platform               # ALL stages — platform green light

# Deploy with module selection
make deploy MODULES_ENABLED=benchmarking,fusion \
  EXTRA_HELM_ARGS="--set modules.benchmarking.enabled=true"
```

## Methodology

**CDD → TDD → EDD** (Contract-Driven → Test-Driven → Event-Driven)

1. Write contracts FIRST (OpenAPI, AsyncAPI, MCP schemas, A2A agent cards)
2. Write failing tests against contracts (RED)
3. Implement until tests pass (GREEN)
4. Validation matrix (`tests/validation_matrix.yaml`) gates each stage
5. Benchmark rubric (`tests/benchmark_rubric.yaml`) validates model performance per module

## Key Conventions

- **Contracts are source of truth** — code must match `contracts/` specs
- **Healthcare agent imports**: Standalone scripts — no relative imports, no packages
- **Quarkus finserv**: JVM mode for dev, native build for containers only
- **Go orchestrator**: Zero inference — coordination and monitoring only
- **Kafka**: Redpanda for local dev, AMQ Streams on OpenShift
- **MCP tools**: Built-in fallback data when MCP gateway is unreachable
- **MAAS endpoint**: `maas-rhdp.apps.maas.redhatworkshops.io` (CPU + Gaudi models)
- **Container builds**: Always `--platform linux/amd64` (OCP clusters are x86)
- **Modules**: Each optimization is a pluggable module in `modules/` with manifest, Helm flag, lab content
- **AgnosticV configs**: NEVER in public repos — private agnosticv repo only

## File Structure

```
contracts/           # CDD specs (OpenAPI, AsyncAPI, MCP, A2A)
services/
  healthcare-agent/  # Python/FastAPI — pipeline, adaptive cache, benchmark, fusion
  finserv-agent/     # Java/Quarkus — fraud scoring (LLM + rules), compliance
  orchestrator/      # Go — workflow coordination, event routing
  semantic-router/   # Python — embedding-based heterogeneous routing
  mcp-gateway/       # Python/FastAPI — 8 federated tools
modules/             # 14 pluggable optimization modules
  benchmarking/      # Model × Task × Hardware comparison
  adaptive-classification/  # Cache learns from LLM results
  multi-model-fusion/       # Panel + judge for critical decisions
  heterogeneous-routing/    # CPU→GPU intelligent routing
  speculative-decoding/     # Draft model 2-3x speedup
  ...                       # + 9 more (see modules/README.md)
infrastructure/
  podman-compose.yaml  # Local dev (8 services)
  helm/              # Helm chart with module flags
  kagenti/           # Kagenti CRDs
  llm-d/             # Disaggregated inference manifests
frontend/            # React 19, TypeScript, Motion, ModuleContext
content/             # Showroom lab (base variant)
content-secure/      # Showroom (TDX variant)
content-virt/        # Showroom (Virtualization variant)
content-govern/      # Showroom (Governance variant)
scripts/             # generate-nav.py — builds nav from module manifests
tests/               # Validation matrix (11 stages) + benchmark rubric
```

## Models Available (via MAAS/LiteLLM)

**CPU (Xeon 6, $0/token):**
| Model | Params | Use Case |
|-------|--------|----------|
| granite-4-0-h-tiny-cpu | ~1B | Ultra-fast classification, draft model |
| granite-2b-cpu | 2B | NER, fraud scoring |
| qwen25-3b-cpu | 3B | Classification, summarization |
| phi3-mini-cpu | 3.8B | Complex reasoning |
| granite-3-2-8b-instruct-cpu | 8B | Complex reasoning |

**Gaudi (Intel Gaudi, $/token):**
| Model | Params | Use Case |
|-------|--------|----------|
| granite-3-2-8b-instruct | 8B | Reasoning, NER |
| microsoft-phi-4 | 14B | General reasoning |
| qwen3-14b | 14B | Multilingual reasoning |
| gpt-oss-20b | 20B | Summarization |
| gpt-oss-120b | 120B | Frontier reasoning |

## API Endpoints (Healthcare Agent)

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| GET | /.well-known/agent-card.json | A2A agent card |
| POST | /api/v1/pipeline | Full 4-node clinical NLP pipeline |
| POST | /api/v1/pipeline/compare | FP32 vs INT8 comparison |
| POST | /api/v1/classify | Document classification |
| POST | /api/v1/extract-entities | Medical NER |
| POST | /api/v1/summarize | Clinical summarization |
| GET | /api/v1/stats | Inference statistics from PostgreSQL |
| GET | /api/v1/adaptive/stats | Classification cache metrics |
| GET | /api/v1/modules | Active modules list |
| GET | /api/v1/benchmark/models | Available models for benchmarking |
| POST | /api/v1/benchmark/run | Run model comparison benchmark |
| POST | /api/v1/fusion | Multi-model panel + judge synthesis |

## What NOT To Do

- Don't add inference logic to the Go orchestrator — it's coordination only
- Don't commit `.env` (has real API keys)
- Don't commit AgnosticV configs to this repo (public) — they go in the private agnosticv repo
- Don't build containers without `--platform linux/amd64`
- Don't modify contracts without updating tests first
- Don't mock Kafka in integration tests — use real Redpanda
- Don't use relative imports in the healthcare agent (standalone script pattern)
- Don't hardcode latency/model names in frontend — all numbers come from live API calls
