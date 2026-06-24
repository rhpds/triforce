# Triforce

**Enterprise AI Inference — Heterogeneous Compute, Modular Optimization**

```
            ▲
           ╱ ╲
          ╱   ╲
         ╱ RED ╲
        ╱  HAT  ╲
       ╱ COURAGE ╲
      ╱───────────╲
     ╱ ╲         ╱ ╲
    ╱   ╲       ╱   ╲
   ╱     ╲     ╱     ╲
  ╱ INTEL ╲   ╱  IBM  ╲
 ╱  POWER  ╲ ╱ WISDOM  ╲
╱───────────╳───────────╲
```

Polyglot multi-agent AI platform for enterprise inference across Healthcare and Financial Services. Start on Intel Xeon 6 CPU at $0/token, scale to GPU where quality and speed justify the cost. The system routes for you.

| Pillar | Technology | Role |
|--------|-----------|------|
| **Power** (Intel) | Xeon 6 + AMX via MAAS/LiteLLM | CPU inference at $0/token — classification, NER, fraud scoring, summarization |
| **Wisdom** (IBM) | Kagenti + A2A + MCP + SPIFFE | Agent governance — discovery, identity, tool control, audit trails |
| **Courage** (Red Hat) | OpenShift + AMQ Streams + vLLM Semantic Router | Enterprise platform with intelligent routing and batch processing at scale |

## Architecture

```
vLLM Semantic Router (classify complexity → route to right hardware)
              │
    ┌─────────┼─────────┐
    │         │         │
Healthcare  FinServ   Orchestrator
(Python)    (Quarkus)  (Go)
LangGraph   Rules+LLM  A2A dispatch
    │         │         │
    └─────────┼─────────┘
              │
     ┌────────┼────────┐
     │        │        │
  MCP Gateway  AMQ Streams  PostgreSQL
  8 tools     streaming    audit + inference log
              │
     MAAS / LiteLLM
     CPU pool (Xeon 6, $0) + GPU pool (NVIDIA, $/token)
```

- **Healthcare Agent** — Python/FastAPI + LangGraph 4-node pipeline (classify → NER → drug interactions → summarize) with adaptive classification cache
- **FinServ Agent** — Java/Quarkus with real LLM fraud risk assessment + rule-based signal detection
- **Orchestrator** — Go, A2A workflow coordination, agent discovery (zero inference)
- **Semantic Router** — Embedding-based request routing (all-MiniLM-L6-v2), heterogeneous CPU→GPU
- **MCP Gateway** — 8 federated tools via JSON-RPC 2.0

## Models (via MAAS/LiteLLM)

**CPU models (Xeon 6, $0/token):**
| Model | Params | Use Case | Measured Latency |
|-------|--------|----------|-----------------|
| granite-4-0-h-tiny-cpu | ~1B | Ultra-fast classification | ~4.5s (not CPU-optimized yet) |
| granite-2b-cpu | 2B | NER, fraud scoring | 770ms (NER), 858ms (classify) |
| qwen25-3b-cpu | 3B | Classification, summarization | 779ms (classify), 5.2s (summarize) |
| phi3-mini-cpu | 3.8B | Complex reasoning | ~1.8s |
| granite-3-2-8b-instruct-cpu | 8B | Complex reasoning | ~1.1s (classify), 10s (summarize) |

**GPU models (NVIDIA, $/token):**
| Model | Params | Use Case | Measured Latency |
|-------|--------|----------|-----------------|
| granite-3-2-8b-instruct | 8B | Reasoning, NER | 500ms (classify) |
| microsoft-phi-4 | 14B | General reasoning | 622ms (classify), 1.7s (compliance) |
| gpt-oss-20b | 20B | Summarization | 1.6s (summarize) |
| gpt-oss-120b | 120B | Frontier reasoning | 1.5s (differential diagnosis) |

**CPU vs GPU speedup:** 3.8x throughput, 10.5x TTFT (time to first token). Classification doesn't need GPU. Summarization and reasoning benefit significantly.

## Pluggable Module Architecture

14 optimization modules — each city/event picks their set:

```
modules/
├── Per-Record Efficiency
│   ├── semantic-routing         LIVE     right model per request in <1ms
│   ├── conditional-pipeline     LIVE     skip unneeded inference steps
│   └── mcp-tools                LIVE     database lookup vs LLM call
├── Model Optimization
│   └── model-optimization       LIVE     INT8, AMX, optimized variants
├── Fleet-Scale Throughput
│   ├── batch-processing         LIVE     AMQ Streams parallel processing
│   ├── replica-scaling          LIVE     agent + model serving replicas
│   └── llmd-inference           ROADMAP  disaggregated prefill/decode
├── Compounding Over Time
│   └── adaptive-classification  LIVE     cache learns from LLM results
├── Heterogeneous Compute
│   ├── benchmarking             BUILDING model × task × hardware matrix
│   ├── heterogeneous-routing    BUILDING CPU→GPU intelligent routing
│   ├── multi-model-fusion       BUILDING panel + judge for critical decisions
│   └── speculative-decoding     PLANNED  draft model 2-3x speedup
└── Analysis
    ├── cost-analysis            LIVE     CPU vs GPU vs Cloud comparison
    └── scale-testing            LIVE     concurrent load, throughput ceiling
```

Select modules per deployment:
```bash
make deploy MODULES_ENABLED=benchmarking,fusion,cost-analysis \
  EXTRA_HELM_ARGS="--set litellm.apiKey=$KEY"
```

## Quick Start

```bash
cp .env.example .env              # Add LITELLM_API_KEY
source .env && export LITELLM_API_BASE LITELLM_API_KEY
make up                           # Start PostgreSQL + Redpanda + all agents

# Test endpoints
curl -s http://localhost:8081/health                    # Healthcare agent
curl -s http://localhost:8081/api/v1/benchmark/models   # Available models
curl -s http://localhost:8081/api/v1/modules            # Active modules
curl -s http://localhost:8081/api/v1/adaptive/stats     # Classification cache

# Run the pipeline
curl -s -X POST http://localhost:8081/api/v1/pipeline \
  -H "Content-Type: application/json" \
  -d '{"text": "DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin and Lisinopril."}' | jq .

# Run a benchmark comparison
curl -s -X POST http://localhost:8081/api/v1/benchmark/run \
  -H "Content-Type: application/json" \
  -d '{"task":"classification","text":"DISCHARGE SUMMARY: patient...","models":["granite-2b-cpu","qwen25-3b-cpu"]}' | jq .

# Run multi-model fusion
curl -s -X POST http://localhost:8081/api/v1/fusion \
  -H "Content-Type: application/json" \
  -d '{"task":"compliance","prompt":"Is this AML structuring?"}' | jq .
```

## Testing

**CDD → TDD → EDD** methodology. 11-stage validation matrix gates deployment.

```bash
make test-contracts              # Stage 0: 120 contract validation tests
make test-infra                  # Stage 1: containers + health checks
make test-unit                   # Stage 2: 49 healthcare + 13 finserv + 3 Go + 29 frontend
make test-contracts-compliance   # Stage 3: response schema compliance
make test-integration            # Stage 4: cross-service workflows
make test-scale                  # Stage 5: synthetic load
make test-frontend               # Stage 6: live numbers, no hardcoded values
make test-multinode              # Stage 7: horizontal scaling
make test-modules                # Stage 8: 11 module validation tests
make test-benchmarks             # Stage 9: model benchmark rubric validation
make test-workflows              # Stage 10: end-to-end workflow tests
make test-platform               # ALL stages — platform green light
```

## Deployment

```bash
# Local dev
make up                          # podman-compose with all services

# OpenShift (infra01)
make deploy EXTRA_HELM_ARGS="--set litellm.apiKey=$KEY --set postgres.password=$PW"

# City-specific with selected modules
make deploy MODULES_ENABLED=benchmarking,fusion \
  EXTRA_HELM_ARGS="--set modules.benchmarking.enabled=true --set modules.fusion.enabled=true"
```

## Demo Variants

| Variant | URL Param | Story |
|---------|-----------|-------|
| **Triforce AI** | (default) | Can I afford AI at scale? Start on CPU, scale to GPU. |
| **Triforce Secure** | `?demo=secure` | Can I trust it with my data? Intel TDX + Confidential Containers. |
| **Triforce Virt** | `?demo=virt` | Can I run AI alongside my VMs? OpenShift Virtualization. |
| **Triforce Govern** | `?demo=govern` | Can I govern agents at scale? IBM Kagenti. |

## Project Structure

```
contracts/           # CDD: OpenAPI, AsyncAPI, MCP, A2A schemas
services/
  healthcare-agent/  # Python/FastAPI + LangGraph + adaptive cache + benchmark + fusion
  finserv-agent/     # Java/Quarkus + LLM fraud scoring + Kafka
  orchestrator/      # Go + A2A client + workflow engine
  semantic-router/   # Python + sentence-transformers + heterogeneous routing
  mcp-gateway/       # Python/FastAPI + 8 JSON-RPC tools
modules/             # 14 pluggable optimization modules with manifests + lab content
infrastructure/
  podman-compose.yaml  # Local dev stack (8 services)
  helm/              # Helm chart for OpenShift with module flags
  kagenti/           # Kagenti CRDs + deploy script
  llm-d/             # Disaggregated inference manifests
frontend/            # React 19 + TypeScript + Motion + ModuleContext
content/             # Showroom lab guide (Antora) — base variant
content-secure/      # Showroom — TDX variant
content-virt/        # Showroom — Virtualization variant
content-govern/      # Showroom — Governance variant
scripts/             # generate-nav.py, utilities
synthetic/           # Data generators + cost model
tests/               # Validation matrix (11 stages) + benchmark rubric
```

## Container Images

```
quay.io/redhat-gpte/triforce-healthcare-agent:latest
quay.io/redhat-gpte/triforce-finserv-agent:latest
quay.io/redhat-gpte/triforce-orchestrator:latest
quay.io/redhat-gpte/triforce-mcp-gateway:latest
quay.io/redhat-gpte/triforce-semantic-router:latest
quay.io/redhat-gpte/triforce-frontend:v6
```

CI builds images on push to main via GitHub Actions (`.github/workflows/build-images.yaml`).

## License

Apache-2.0
