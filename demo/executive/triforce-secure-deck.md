---
marp: true
theme: uncover
paginate: true
backgroundColor: #0A1628
color: #E8F0FE
---

<!-- _class: lead -->

# TRIFORCE SECURE

### ▲ Confidential AI on Intel Xeon 6

Hardware-encrypted inference · Attestation-gated secrets · Zero code changes

---

# The Problem

AI inference processes sensitive data in memory — **visible to cluster admins**.

Healthcare: PHI (Protected Health Information)
Financial Services: PII (Personally Identifiable Information)

> If the cluster is compromised, the data is exposed.

---

# The Solution: Intel TDX

Intel Trust Domain Extensions (TDX) encrypts all memory inside a Trust Domain.

- CPU encrypts data **in hardware** — no software can read it
- Not even the hypervisor or cluster admin
- AMX acceleration **still works** inside TDX

---

# One Line Changes Everything

```yaml
# Standard deployment
spec:
  containers:
    - name: agent
      image: triforce/healthcare-agent:latest

# Confidential deployment
spec:
  runtimeClassName: kata-cc    # ← This is the only change
  containers:
    - name: agent
      image: triforce/healthcare-agent:latest
```

Same image. Same code. Same model. Now **hardware-encrypted**.

---

# Attestation-Gated Secrets

The API key is only released to pods running inside verified TDX:

```
Pod starts → Trustee: "Give me the key"
           → TDX attestation → Hardware verified
           → Secret released → Inference works
```

Without TDX? **No key. No inference.**

---

# Performance Impact: Zero

| Metric | Standard | Confidential |
|--------|----------|-------------|
| Classification | ~839ms | ~839ms |
| Throughput | 29 tok/s | 29 tok/s |
| Model | granite-2b-cpu | granite-2b-cpu |
| Accelerator | Xeon 6 (AMX) | Xeon 6 (AMX + TDX) |

AMX acceleration works inside TDX Trust Domains.

---

# The Triforce Secure Stack

| Layer | Technology |
|-------|-----------|
| Memory encryption | Intel TDX (Xeon 6) |
| Runtime isolation | Red Hat Sandboxed Containers 1.12 |
| Attestation | Red Hat build of Trustee 1.1 |
| AI agents | IBM Granite on LangGraph |
| Platform | Red Hat OpenShift |

---

<!-- _class: lead -->

# TRIFORCE SECURE

### ▲ Power · Wisdom · Courage

Your AI inference is now hardware-encrypted. Zero code changes.

---
