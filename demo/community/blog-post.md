# Building a Multi-Agent AI Platform on Intel Xeon 6 — No GPU Required

*How Red Hat and Intel built a polyglot AI inference platform that processes clinical documents and financial transactions at enterprise scale — entirely on CPU.*

## The Problem

AI inference costs are unsustainable at scale. Running Claude Opus for 100,000 records per month costs $50,400 per year. An NVIDIA H100 server costs $119,333 per year. For classification, NER, fraud scoring, and summarization — tasks that ran within SLA on CPU in our measured workloads — these costs are unnecessary.

## The Architecture

Triforce is a polyglot multi-agent platform with two pillars:

- **Intel (Power):** Xeon 6 CPU with AMX acceleration runs `granite-2b-cpu` (sub-3B) and `granite-2b-cpu` (8B) via MAAS/LiteLLM
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

## Red Hat Intelligent Routing: Semantic Router + llm-d

Triforce uses two layers of Red Hat AI routing intelligence:

**Semantic Router** classifies each request as SIMPLE or COMPLEX and routes to the right model. Simple queries go to `granite-2b-cpu` (fast, cheap). Complex reasoning queries go to `qwen25-3b-cpu` (deeper). The router runs on CPU — keyword-based classification in under 1ms (after embedding model warm-up), no LLM call required.

**llm-d** distributes inference across multiple vLLM instances. The Endpoint Picker (EPP) monitors KV cache state per instance and routes each request to the instance with the warmest cache — 90% cache hit rate, 63% faster P95 latency. This is Red Hat's open source distributed inference platform, included in Red Hat OpenShift AI.

## Triforce Secure: Confidential AI with Intel TDX

Add one line to your deployment and your AI inference is hardware-encrypted:

```yaml
spec:
  runtimeClassName: kata-cc
```

Intel TDX encrypts all memory inside a Trust Domain. The cluster admin cannot read inference data. The API key is only released to pods that pass TDX hardware attestation via Red Hat's Trustee operator. Same model, same latency, zero code changes.

## Triforce Virt: VMs + AI on One Server

OpenShift Virtualization runs legacy VMs alongside AI containers on the same Xeon 6 node. The legacy database VM consumes AI services via standard Kubernetes networking — no separate GPU cluster, no re-architecture. One Helm flag: `--set virtualization.enabled=true`.

## Three Demos, One Platform

| Demo | Helm Flag | Story |
|------|-----------|-------|
| AI | default | Multi-agent inference + routing, no GPU |
| Secure | `confidential.enabled=true` | Hardware-encrypted AI |
| Virt | `virtualization.enabled=true` | VMs + AI coexistence |

## Try It Yourself

```bash
git clone https://github.com/rhpds/triforce
cd triforce
cp .env.example .env  # Add LITELLM_API_KEY
make up
python3 demo/engineer/triforce_demo.py
```

---

*Built by Jonathan Kershaw (Red Hat). 258+ tests across Python, Go, Java, and TypeScript. Apache 2.0.*

*GitHub: [rhpds/triforce](https://github.com/rhpds/triforce)*
