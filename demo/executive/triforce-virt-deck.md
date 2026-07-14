---
marp: true
theme: uncover
paginate: true
backgroundColor: #0A1628
color: #E8F0FE
---

<!-- _class: lead -->

# TRIFORCE VIRT

### ▲ VMs + AI on One Server

OpenShift Virtualization · Intel Xeon 6 · No separate infrastructure

---

# The Problem

Enterprises have hundreds of VMs.
They want to add AI.

> "Do we need to buy a separate GPU cluster?"

**No.** Intel Xeon 6 runs both.

---

# One Server, Two Workloads

| Workload | Type | CPU | Memory |
|----------|------|-----|--------|
| Legacy Database | VM (KubeVirt) | 4 cores | 8 Gi |
| Healthcare Agent | Container | 250m | 512 Mi |
| FinServ Agent | Container | 500m | 768 Mi |
| Orchestrator | Container | 100m | 128 Mi |

All on the same Xeon 6 node. Kubernetes scheduler manages both.

---

# VM Calls AI Agent

The legacy VM consumes AI services via standard Kubernetes networking:

```bash
# From inside the VM:
curl http://healthcare-agent:8081/api/v1/classify \
  -d '{"text": "Lab results: WBC 12.5"}'
```

No API gateway. No re-architecture. Standard service networking.

---

# The Deployment

```bash
helm install triforce infrastructure/helm/ \
  --set virtualization.enabled=true \
  --set litellm.apiKey=$KEY \
  --set postgres.password=$PW
```

One Helm chart. One flag. VMs and AI agents deploy together.

---

<!-- _class: lead -->

# TRIFORCE VIRT

### ▲ Power · Courage

One Xeon 6 server. VMs and AI. No GPU required.

---
