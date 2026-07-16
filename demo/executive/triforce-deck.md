---
marp: true
theme: uncover
paginate: true
backgroundColor: #0A1628
color: #E8F0FE
---

<!-- _class: lead -->

# TRIFORCE

### ▲ Power · Courage

**Intel** · **Red Hat**

Enterprise AI Inference at Scale — No GPU Required

---

# The Problem

AI inference costs are **unsustainable** at scale.

<br>

| Workload | Claude Opus (API) | NVIDIA H100 | Intel Xeon 6 |
|----------|-------------------|-------------|--------------|
| 100K records/month | **$50,400/yr** | **$119,333/yr** | **$15,000/yr** |

<br>

> In our measured workloads, classification, NER, embeddings, and summarization all ran within SLA on CPU at $0/token.

---

# The Insight

![bg right:40% 80%](../assets/cost-comparison.png)

**Xeon 6 with AMX** handles the workloads that matter most:

- Document classification: **600ms**
- Medical NER: **5,000ms**
- Fraud scoring: **5ms**
- Summarization: **4,500ms**

All on CPU. Zero GPU.

---

# Architecture

```
          ┌──────────────┐
          │              │
     Healthcare FinServ Orchestrator
     (Python)  (Quarkus)   (Go)
          │      │      │
          └──────┼──────┘
                 │
        PostgreSQL + Kafka + MAAS/LiteLLM
```

Three languages. Two verticals. One platform.

---

# Healthcare Agent — LangGraph Pipeline

**4 nodes executing on Intel Xeon 6 CPU:**

| Step | Model | Latency | What It Does |
|------|-------|---------|-------------|
| Classify | granite-2b-cpu | ~600ms | Document type identification |
| Extract | granite-2b-cpu | ~5,000ms | Medical entity recognition |
| Interactions | MCP Tool | ~50ms | Drug-drug interaction check |
| Summarize | granite-2b-cpu | ~4,500ms | Clinical summary |

**Conditional routing:** Drug interaction check only runs when 2+ medications detected.

---

# Financial Services Agent

**Fraud scoring on Xeon 6 — sub-5ms for rule-based, LLM-enhanced for complex cases**

- Transaction risk scoring with 8 signal types
- Regulatory compliance checking (AML, KYC, OFAC)
- Customer risk assessment with blended scoring
- Sanctions screening via MCP tool federation

Built with **Java/Quarkus** — consuming from Kafka, producing to alert topics.

---

# Cross-Agent Workflows

**The Go orchestrator discovers agents via A2A and dispatches tasks:**

```
Orchestrator → A2A tasks/send → Healthcare Agent
             → A2A tasks/send → FinServ Agent
             → Combine results → Workflow complete
```

- Agent discovery: automatic via `/.well-known/agent-card.json`
- Task dispatch: JSON-RPC 2.0 over HTTP
- Workflow duration: ~8-10 seconds (2 agents, 5+ LLM calls)
- All inference on CPU

---

# The Cost Story (Honest)

| Platform | Annual Cost | vs Xeon 6 | Honest Take |
|----------|-----------|----------|-------------|
| gpt-oss-20b (Vertex) | **$562** | **Cheaper** | API wins at low volume |
| Claude Haiku (API) | **$10,080** | **Cheaper** | API wins below 149K rec/mo |
| **Intel Xeon 6** | **$15,000** | **baseline** | Wins at enterprise scale |
| Claude Opus (API) | $50,400 | +$35K | Only if you need Opus quality |
| NVIDIA A100 server | $64,000 | +$49K | GPU hardware + hosting |
| NVIDIA H100 server | $119,333 | +$104K | Top-tier GPU |

**Below 149K records/month → use the API. Above → self-host on Xeon 6.**

---

# Break-Even Analysis

| Compare Against | Break-Even Volume | Savings at 1M rec/mo |
|----------------|-------------------|---------------------|
| Claude Haiku | 149K records/month | **$85,800/year** |
| Gemini 2.5 Pro | 83K records/month | **$165,000/year** |
| Claude Sonnet | 50K records/month | **$287,400/year** |
| Claude Opus | 30K records/month | **$489,000/year** |

> Below 30K records/month? Use the API. Above? Self-host on Xeon 6.

**We're honest about where each option wins.**

---

# The Platform — Red Hat OpenShift

- **3 polyglot services** — Python, Java, Go on OpenShift
- **Kafka (AMQ Streams)** — Event-driven pipeline, 8 topics
- **PostgreSQL** — Inference logging, audit trail, telemetry
- **Helm chart** — `helm install` deploys everything
- **CI/CD** — GitHub Actions: 6 test jobs + 3 image builds
- **246+ tests** — Across 4 languages, pre-commit gated

---

# Live Demo

### Open the dashboard →

`demo/executive/dashboard.html`

Watch real inference happen on Xeon 6.
Watch the cost counter tick for alternatives.

---

<!-- _class: lead -->

# TRIFORCE

### ▲ Power · Courage

**$15,000/year.** 600ms classification. Zero GPU.

github.com/rhpds/triforce

---
