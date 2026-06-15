# Triforce

**Enterprise AI Inference at Scale — No GPU Required**

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

Polyglot multi-agent AI platform demonstrating enterprise inference across Healthcare and Financial Services on Intel Xeon 6 CPU.

| Pillar | Technology | What It Proves |
|--------|-----------|----------------|
| **Power** (Intel) | Xeon 6 + AMX via MAAS/LiteLLM | Classification, NER, summarization — no GPU needed for 80% of enterprise AI |
| **Wisdom** (IBM) | Kagenti + A2A + MCP + SPIFFE | Agents discover, communicate, scale with K8s-native governance |
| **Courage** (Red Hat) | OpenShift + Kafka + PostgreSQL | Polyglot agents at production scale with full observability |

## Architecture

```
KAGENTI (A2A + MCP + SPIFFE)
         │
    ┌────┼────┐
    │    │    │
Healthcare  FinServ  Orchestrator
(Python)    (Quarkus) (Go)
    │    │    │
    └────┼────┘
         │
PostgreSQL + Kafka + MAAS/LiteLLM (Xeon 6)
```

- **Healthcare Agent** — Python/FastAPI + LangGraph 4-node pipeline (classify → extract entities → check drug interactions → summarize)
- **FinServ Agent** — Java/Quarkus + LangGraph (analyze → risk profile → sanctions → compliance)
- **Orchestrator** — Go, A2A workflow coordination, Kafka event routing

## Quick Start

```bash
cp .env.example .env  # Add LITELLM_API_KEY
make up               # Start PostgreSQL + Redpanda + 3 agents

# Run the demo
python3 demo/engineer/triforce_demo.py

# Run the inference race
python3 demo/engineer/inference_race.py --scale 10

# Open the executive dashboard
open demo/executive/dashboard.html
```

## Key Numbers

| Metric | Value |
|--------|-------|
| Classification latency | ~600ms (granite-4-0-h-tiny, Xeon 6 CPU) |
| Fraud scoring latency | ~5ms (rule-based on CPU) |
| Full LangGraph pipeline | ~9.5s (4 nodes, 3 LLM calls) |
| Annual infrastructure cost | $15,000 (Xeon 6 self-hosted) |
| Savings vs Claude Opus | $489,000/year at 1M records/month |
| Test count | 246+ across Python, Go, Java, TypeScript |
| GPU required | Zero |

## Models (via MAAS/LiteLLM)

| Model | Parameters | Hardware | Use Case |
|-------|-----------|----------|----------|
| granite-4-0-h-tiny | sub-3B | Xeon 6 CPU | Classification, NER |
| granite-3-2-8b-instruct | 8B | Xeon 6 CPU | Summarization, reasoning |
| nomic-embed-text-v1-5 | 137M | Xeon 6 (OpenVINO) | Embeddings |

## Demo Assets

| Asset | Command | Audience |
|-------|---------|----------|
| Terminal demo | `python3 demo/engineer/triforce_demo.py` | Engineers |
| Inference race | `python3 demo/engineer/inference_race.py --scale 100` | Everyone |
| Executive dashboard | `open demo/executive/dashboard.html` | Executives |
| Jupyter notebook | `jupyter notebook demo/engineer/triforce_notebook.ipynb` | Technical community |
| Slide deck | `marp demo/executive/triforce-deck.md` | Presentations |
| Lab guide | Showroom/Antora in `content/` | Hands-on labs |

## Development

```bash
# Tests
make test-contracts              # 120 contract validation tests
cd services/healthcare-agent && python3 -m pytest tests/    # 49 tests
cd services/finserv-agent/langgraph && python3 -m pytest tests/  # 13 tests
cd services/orchestrator && go test ./...                   # 17 tests
cd services/finserv-agent && mvn test                       # 5 tests
cd frontend && npx vitest run                               # 42 tests

# Build containers
make build-all

# Deploy to OpenShift
helm install triforce infrastructure/helm/ \
  --namespace triforce \
  --set litellm.apiBase=https://maas-rhdp.apps.maas.redhatworkshops.io \
  --set litellm.apiKey=$KEY \
  --set postgres.password=$PW
```

## Project Structure

```
contracts/           # CDD: OpenAPI, AsyncAPI, MCP, A2A schemas
services/
  healthcare-agent/  # Python/FastAPI + LangGraph + MCP tools
  finserv-agent/     # Java/Quarkus + LangGraph + Kafka
  orchestrator/      # Go + A2A client + workflow engine
stubs/               # Kagenti API stubs (A2A, MCP, registry)
infrastructure/
  podman-compose.yaml  # Local dev stack
  helm/              # Helm chart for OpenShift
  kagenti/           # Kagenti CRDs + deploy script
frontend/            # React + PatternFly 6, 3 themes
demo/
  engineer/          # Terminal demo, race, notebook
  executive/         # Dashboard, slides, trailer script
  community/         # Blog post, YouTube script
content/             # Showroom lab guide (Antora)
synthetic/           # Data generators + cost model
tests/               # Contract tests + validation matrix
```

## Container Images

```
quay.io/rh-intel-ibm-demo/triforce-healthcare-agent:latest
quay.io/rh-intel-ibm-demo/triforce-finserv-agent:latest
quay.io/rh-intel-ibm-demo/triforce-orchestrator:latest
```

## License

Apache-2.0
