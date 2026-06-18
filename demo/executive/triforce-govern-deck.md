---
marp: true
theme: uncover
paginate: true
backgroundColor: #0A1628
color: #E8F0FE
---

<!-- _class: lead -->

# TRIFORCE GOVERN

### ▲ AI Agent Governance with IBM Kagenti

A2A Lifecycle · SPIFFE Identity · MCP Tools · Audit Trail

---

# The Problem

You have multiple AI agents.

- Who controls them?
- Which agent can call which tool?
- How do you audit every decision?
- How do you update agents without downtime?

---

# Kagenti: Kubernetes-Native Agent Governance

| Capability | What It Does |
|-----------|-------------|
| **AgentRuntime CRDs** | Manage agents like Deployments — scale, update, rollback |
| **A2A Protocol** | Agents discover each other automatically |
| **SPIFFE Identity** | Crypto workload identity — no static credentials |
| **MCP Gateway** | Tool federation with access policies |
| **Audit Trail** | Every inference, every tool call, logged |

---

# Agent Identity: SPIFFE

Every agent pod gets a cryptographic identity:

```
spiffe://triforce/ns/triforce/sa/healthcare-agent
spiffe://triforce/ns/triforce/sa/finserv-agent
```

- mTLS between all agents — automatic
- No API keys between services
- Identity rotates automatically via SPIRE

---

# MCP Tool Governance

| Tool | Server | Policy |
|------|--------|--------|
| fhir_patient_lookup | Healthcare | Allow all |
| drug_interaction_check | Healthcare | Allow all |
| risk_profile_lookup | FinServ | FinServ only |
| sanction_list_search | FinServ | Restricted |

The MCP Gateway enforces: which agents can call which tools.

---

# Complete Audit

Every action logged to PostgreSQL:

- **Inference:** model, latency, accelerator, tokens
- **Tool calls:** which tool, which arguments, who called it
- **Workflows:** which agents, what steps, what decisions

Queryable via SQL. Export to SIEM. Compliance-ready.

---

<!-- _class: lead -->

# TRIFORCE GOVERN

### ▲ Power · Wisdom · Courage

IBM Kagenti. Intel Xeon 6. Red Hat OpenShift.

Who controls your AI agents? Now you know.

---
