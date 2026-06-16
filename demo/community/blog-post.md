# Building a Multi-Agent AI Platform on Intel Xeon 6 — No GPU Required

*How Red Hat, IBM, and Intel built a polyglot AI inference platform that processes clinical documents and financial transactions at enterprise scale — entirely on CPU.*

## The Problem

AI inference costs are unsustainable at scale. Running Claude Opus for 100,000 records per month costs $50,400 per year. An NVIDIA H100 server costs $119,333 per year. For classification, NER, fraud scoring, and summarization — tasks that make up 80% of enterprise AI workloads — these costs are unnecessary.

## The Architecture

Triforce is a polyglot multi-agent platform with three pillars:

- **Intel (Power):** Xeon 6 CPU with AMX acceleration runs `granite-2b-cpu` (sub-3B) and `granite-2b-cpu` (8B) via MAAS/LiteLLM
- **IBM (Wisdom):** Kagenti provides A2A agent discovery, MCP tool federation, and SPIFFE zero-trust identity
- **Red Hat (Courage):** OpenShift runs three polyglot agents (Python, Java, Go) with Kafka event streaming and PostgreSQL telemetry

## The Healthcare Agent (Python/LangGraph)

The healthcare agent runs a 4-node LangGraph StateGraph:

```python
classify → extract_entities → check_interactions (conditional) → summarize
```

Each node calls `granite-2b-cpu` or `granite-2b-cpu` on Intel Xeon 6 via MAAS. Classification runs in ~600ms. The full pipeline: ~9.5 seconds for a complete clinical document analysis.

MCP tools provide FHIR patient lookup, drug interaction checking, and ICD-10 code search — all federated through the MCP gateway.

## The FinServ Agent (Java/Quarkus + Python/LangGraph)

The financial services agent scores transactions using rule-based signals combined with LLM reasoning:

```
analyze → lookup_risk_profile → check_sanctions (conditional) → compliance
```

Sub-5ms for rule-based scoring. LLM-enhanced reasoning on Xeon 6 for complex cases.

## The Orchestrator (Go)

A lightweight Go service that:
- Discovers agents via A2A `/.well-known/agent-card.json`
- Dispatches multi-agent workflows via A2A JSON-RPC `tasks/send`
- Routes Kafka events between services
- Generates synthetic workloads for scale testing

The orchestrator does zero inference — pure coordination.

## The Cost Story

| Platform | Annual Cost (100K records/month) |
|----------|-------------------------------|
| Intel Xeon 6 (self-hosted) | $15,000 |
| NVIDIA A100 server | $64,000 |
| AMD MI300X server | $83,333 |
| NVIDIA H100 server | $119,333 |
| Claude Opus API | $50,400 |

At enterprise volume (>150K records/month), Xeon 6 saves $85K–$489K/year versus cloud API models.

## Try It Yourself

```bash
git clone https://github.com/rhpds/triforce
cd triforce
cp .env.example .env  # Add LITELLM_API_KEY
make up
python3 demo/engineer/inference_race.py --scale 100
```

Or open the executive dashboard:
```bash
open demo/executive/dashboard.html
```

## What's Next

- Deploy to OpenShift via Helm: `helm install triforce infrastructure/helm/`
- Scale with Kagenti: `kubectl apply -f infrastructure/kagenti/`
- Run the full demo: `python3 demo/engineer/triforce_demo.py`

---

*Built by Jonathan Kershaw (Red Hat). 246 tests across Python, Go, Java, and TypeScript. Apache 2.0.*

*GitHub: [rhpds/triforce](https://github.com/rhpds/triforce)*
