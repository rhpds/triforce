# Triforce

**Enterprise AI Inference — Heterogeneous Compute, Modular Optimization**


Polyglot multi-agent AI platform for enterprise inference across Healthcare, Financial Services, Telecommunications, and Energy verticals. Routes each request to the right-sized model on the right hardware — CPU at $0/token for simple tasks, GPU/accelerator tier for complex reasoning. The system decides for you in <1ms.

| Pillar | Technology | Role |
|--------|-----------|------|
| **Power** (Intel) | Xeon 6 CPU + Gaudi GPU via MAAS/LiteLLM | Heterogeneous compute — $0 CPU + $/token GPU |
| **Courage** (Red Hat) | OpenShift + AMQ Streams + vLLM Semantic Router | Enterprise platform with intelligent routing and batch processing at scale |

## Key Results (Measured, Oberon Xeon 6767P)

| Metric | Result | How |
|--------|--------|-----|
| **Speculative decoding** | 6.52x speedup | Draft model (granite-350m) vs target (granite-2b-cpu) |
| **Heterogeneous routing** | <25ms decision | Semantic router → CPU or GPU tier |
| **MCP tools vs LLM** | 85x faster | Drug interaction lookup (44ms vs 3742ms) |
| **Semantic routing** | <1ms per decision | Embedding similarity, no LLM call |
| **Multi-model fusion** | Structured synthesis | 3-model panel + judge with consensus/contradictions/blind_spots |
| **BitNet edge** | 0.4GB, ~70ms/tok | 1.58-bit ternary weights, self-contained pod |

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  React 19 Frontend (Zustand + React Flow + Motion)       │
│  PipelineFlow · AgentTopology · RoutingFlow              │
└─────────────────────┬────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   Semantic      Healthcare     FinServ
   Router        Agent          Agent
   (<1ms)        (Python)       (Quarkus)
        │             │             │
        │        ┌────┼────┐        │
        │        │    │    │        │
        │     MCP  Kafka  PostgreSQL
        │   Gateway Streams  audit log
        │   (8 tools)        │
        │        │            │
        └────────┼────────────┘
                 │
          ┌──────┼──────┐
          │      │      │
        CPU    GPU    Edge
       OVMS   LiteLLM  BitNet
    (9 models) (tier)  (0.4GB)
```

- **Healthcare Agent** — Python/FastAPI + LangGraph 4-node pipeline with adaptive cache, heterogeneous routing, speculative decoding, multi-model fusion
- **FinServ Agent** — Java/Quarkus with LLM fraud scoring + rule-based signals
- **Orchestrator** — Go, A2A workflow coordination, agent discovery (zero inference)
- **Semantic Router** — Embedding-based complexity routing (<1ms), heterogeneous CPU→GPU
- **MCP Gateway** — 8 federated tools via JSON-RPC 2.0
- **Edge Agent** — BitNet b1.58 2B4T, self-contained pod (0.4GB, no MAAS dependency)

### Frontend Stack

- **Zustand** — 3 stores (demo, module, vertical) replacing React Context providers
- **React Flow** (@xyflow/react) — Interactive DAG visualizations:
  - PipelineFlow: 4-node clinical NLP pipeline with animated edges and hardware badges
  - AgentTopology: Agent/gateway/router/tool graph
  - RoutingFlow: CPU/GPU routing flow with active path highlighting
- **Motion** (v12) — 600+ animation instances for slide-deck transitions

## Models

**Oberon (Intel lab, 10 local models via OVMS + bitnet.cpp):**
| Model | Params | Role |
|-------|--------|------|
| granite-350m | 350M | Speculative draft, fast classification |
| granite-4-0-h-tiny-cpu | ~1B | Ultra-fast classification |
| granite-2b-cpu | 2B | NER, fraud scoring, speculative target |
| granite-2b-int8 | 2B | INT8 optimization comparison |
| qwen25-3b-cpu | 3B | Classification, summarization |
| granite-4.1-3b | 3B | Next-gen classification |
| phi3-mini-cpu | 3.8B | Complex reasoning |
| granite-3-2-8b-instruct-cpu | 8B | Fusion judge |
| granite-4.1-8b | 8B | Simulated GPU tier |
| bitnet-2b4t | 2B | Edge inference (1.58-bit ternary) |

**RHDP (5 MAAS models, $0/token):**
| Model | Role on RHDP |
|-------|-------------|
| granite-4-0-h-tiny-cpu | Speculative draft |
| granite-2b-cpu | NER, fraud scoring, speculative target |
| qwen25-3b-cpu | Classification, summarization |
| phi3-mini-cpu | Complex reasoning |
| granite-3-2-8b-instruct-cpu | Fusion judge + heterogeneous "GPU" tier |

## 15 Pluggable Modules

```
modules/
├── Per-Record Efficiency
│   ├── semantic-routing         LIVE     right model per request in <1ms
│   ├── conditional-pipeline     LIVE     skip unneeded inference steps
│   └── mcp-tools                LIVE     database lookup vs LLM call (85x faster)
├── Model Optimization
│   └── model-optimization       LIVE     INT8, AMX, optimized variants
├── Fleet-Scale Throughput
│   ├── batch-processing         LIVE     AMQ Streams parallel processing
│   ├── replica-scaling          LIVE     agent + model serving replicas
│   └── llmd-inference           ROADMAP  disaggregated prefill/decode
├── Compounding Over Time
│   └── adaptive-classification  LIVE     cache learns from LLM results
├── Heterogeneous Compute
│   ├── benchmarking             LIVE     model × task × hardware matrix
│   ├── heterogeneous-routing    LIVE     CPU→GPU intelligent routing (end-to-end)
│   ├── multi-model-fusion       LIVE     3-model panel + judge synthesis
│   ├── speculative-decoding     LIVE     6.52x draft/target speedup
│   └── edge-inference           LIVE     BitNet 0.4GB self-contained pod
└── Analysis
    ├── cost-analysis            LIVE     CPU vs GPU vs Cloud comparison
    └── scale-testing            LIVE     concurrent load, throughput ceiling
```

## Quick Start

```bash
cp .env.example .env              # Add LITELLM_API_KEY
source .env && export LITELLM_API_BASE LITELLM_API_KEY
make up                           # Start PostgreSQL + Redpanda + all agents

# Test endpoints
curl -s http://localhost:8081/health
curl -s http://localhost:8081/api/v1/modules
curl -s http://localhost:8081/api/v1/speculative/status

# Run the pipeline
curl -s -X POST http://localhost:8081/api/v1/pipeline \
  -H "Content-Type: application/json" \
  -d '{"text": "DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin and Lisinopril."}' | jq .

# Run multi-model fusion
curl -s -X POST http://localhost:8081/api/v1/fusion \
  -H "Content-Type: application/json" \
  -d '{"task":"compliance","prompt":"Is this AML structuring? Three deposits of $9,500 in 48 hours."}' | jq .

# Measure speculative decoding
curl -s -X POST http://localhost:8081/api/v1/speculative/run \
  -H "Content-Type: application/json" \
  -d '{"task":"summarization","text":"Patient admitted with chest pain.","max_tokens":64}' | jq .
```

## Testing

**CDD → TDD → EDD** methodology. 11-stage validation matrix + frontend smoke tests.

```bash
make test-contracts              # Stage 0: 122 contract tests
make test-unit                   # Stage 2: 54 healthcare + 14 router + 13 finserv + 3 Go + 29 frontend
make test-modules                # Stage 8: 13 module manifest + Helm tests
make test-smoke                  # 19 live endpoint tests (no NaN, no empty, no crash)
make test-platform               # ALL stages — platform green light
```

**Preflight (Oberon):** 330+ passed, DarkScope Grade B, Brand Audit Grade A, NovaScan Tier 1.

## Demo Variants

| Variant | Story | Technology |
|---------|-------|-----------|
| **Triforce AI** | Can I afford AI at scale? | CPU inference, heterogeneous routing, 15 modules |
| **Triforce Secure** | Can I trust it with my data? | Intel TDX, Confidential Containers, hardware attestation |
| **Triforce Virt** | Can I run AI alongside VMs? | OpenShift Virtualization, BitNet edge inference |

4 industry verticals per variant: Healthcare, Financial Services, Telecommunications, Energy.

## RHDP Marketplace Deployment

4 AgnosticV catalog items (PR: `rhpds/agnosticv#27038`):

| Item | Purpose |
|---|---|
| `ai-qs-triforce-cluster` | Base cluster infra (operators via GitOps) |
| `ai-qs-triforce-tenant` | Base AI — 5 modules enabled |
| `ai-qs-triforce-secure-tenant` | + Confidential Containers (TDX) |
| `ai-qs-triforce-virt-tenant` | + OpenShift Virtualization + BitNet |

All modules work on RHDP using existing MAAS models — no new model deployments needed.

## Project Structure

```
contracts/           # CDD: OpenAPI, AsyncAPI, MCP, A2A schemas
services/
  healthcare-agent/  # Python/FastAPI + LangGraph + speculative + fusion + routing
  finserv-agent/     # Java/Quarkus + LLM fraud scoring + Kafka
  orchestrator/      # Go + A2A client + workflow engine
  semantic-router/   # Python + sentence-transformers + heterogeneous routing
  mcp-gateway/       # Python/FastAPI + 8 JSON-RPC tools
  edge-agent/        # BitNet b1.58 2B4T (bitnet.cpp, self-contained)
modules/             # 15 pluggable optimization modules with manifests + lab content
infrastructure/
  podman-compose.yaml  # Local dev stack (8 services)
  helm/              # Helm chart for OpenShift with module flags
  oberon/            # Intel lab overrides (10 OVMS models + LiteLLM)
frontend/            # React 19 + Zustand + React Flow + Motion
content/             # Showroom lab guide (Antora) — base variant
content-secure/      # Showroom — TDX variant
content-virt/        # Showroom — Virtualization variant
tests/               # Validation matrix (11 stages) + benchmark rubric + smoke tests
docs/                # Whitepapers + benchmark data (external + internal)
```

## Container Images

```
quay.io/redhat-gpte/triforce-healthcare-agent:latest
quay.io/redhat-gpte/triforce-finserv-agent:latest
quay.io/redhat-gpte/triforce-orchestrator:latest
quay.io/redhat-gpte/triforce-mcp-gateway:latest
quay.io/redhat-gpte/triforce-semantic-router:latest
quay.io/redhat-gpte/triforce-frontend:latest
quay.io/redhat-gpte/triforce-edge-agent:latest
```

CI builds images on push to main via GitHub Actions.

## License

Apache-2.0
