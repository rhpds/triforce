# CLAUDE.md — Agent Instructions for Triforce

## What This Is

Polyglot multi-agent demo platform showcasing the Red Hat + IBM + Intel partnership:
- **Intel** (Power): Xeon 6 CPU inferencing via MAAS/LiteLLM — embeddings, classification, NER, small generation without GPUs
- **IBM** (Wisdom): Kagenti agentic orchestration — A2A protocol, MCP tools, SPIFFE identity, K8s-native agent governance
- **Red Hat** (Courage): OpenShift + AMQ Streams + RHOAI — enterprise platform running polyglot agents at scale

Two industry verticals: Healthcare (clinical NLP) and Financial Services (fraud/compliance).

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
PostgreSQL + Kafka + MAAS/LiteLLM
```

## Development

```bash
cp .env.example .env  # Add LITELLM_API_KEY
podman-compose -f infrastructure/podman-compose.yaml up --build -d

# Tests by stage
make test-contracts        # Stage 0: schema validation
make test-infra            # Stage 1: containers + health
make test-unit             # Stage 2: per-service logic
make test-contracts-compliance  # Stage 3: response schema compliance
make test-integration      # Stage 4: cross-service workflows
make test-scale            # Stage 5: synthetic load
make test-all              # All stages sequentially
```

## Methodology

**CDD → TDD → EDD** (Contract-Driven → Test-Driven → Event-Driven)

1. Write contracts FIRST (OpenAPI, AsyncAPI, MCP schemas, A2A agent cards)
2. Write failing tests against contracts (RED)
3. Implement until tests pass (GREEN)
4. Validation matrix (`tests/validation_matrix.yaml`) gates each stage at 90% pass rate

## Key Conventions

- **Contracts are source of truth** — code must match `contracts/` specs, not the other way around
- **Healthcare agent imports**: Standalone FastAPI script (like the partner demo gateway pattern)
- **Quarkus finserv**: JVM mode for dev, native build for containers only
- **Go orchestrator**: Zero inference — coordination and monitoring only
- **Kafka**: Redpanda for local dev, AMQ Streams on OpenShift
- **MCP tools**: Built-in fallback data when MCP gateway is unreachable — no stub server needed
- **MAAS endpoint**: Reuses `maas-rhdp.apps.maas.redhatworkshops.io` from partner demo
- **Container builds**: Always `--platform linux/amd64` (OCP clusters are x86)

## File Structure

```
contracts/           # CDD specs (OpenAPI, AsyncAPI, MCP, A2A)
services/
  healthcare-agent/  # Python/FastAPI — clinical NLP, FHIR tools
  finserv-agent/     # Java/Quarkus — fraud scoring, compliance
  orchestrator/      # Go — workflow coordination, event routing
infrastructure/      # podman-compose, PostgreSQL, Kafka, Helm
synthetic/           # Data generators for scale testing
tests/               # Validation matrix + cross-service tests
```

## Models Used (via MAAS/LiteLLM)

| Model | Hardware | Use Case |
|-------|----------|----------|
| granite-4-0-h-tiny | Xeon 6 | Classification, NER, fraud scoring |
| granite-3-2-8b-instruct | Xeon 6 | Summarization, reasoning |

## What NOT To Do

- Don't add inference logic to the Go orchestrator — it's coordination only
- Don't commit `.env` (has real API keys)
- Don't build containers without `--platform linux/amd64`
- Don't modify contracts without updating tests first
- Don't mock Kafka in integration tests — use real Redpanda
- Don't use relative imports in the healthcare agent (standalone script pattern)
