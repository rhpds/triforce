# Triforce llm-d — Distributed Inference

## What is llm-d?

llm-d is Red Hat's open source distributed LLM inference platform. It disaggregates inference into prefill and decode phases across multiple vLLM instances, with an Endpoint Picker (EPP) that routes requests to instances with warm KV caches.

Results: 90% KV cache hit rate, 63% faster P95 TTFT vs vanilla vLLM.

## Prerequisites

- Red Hat AI Inference Server (RHAIIS) — enterprise vLLM distribution
- KServe on the cluster
- Gateway API support (OCP 4.18+)

## Components

- **Inference Gateway (IGW)** — Envoy-based proxy with EPP sidecar
- **Endpoint Picker (EPP)** — monitors KV cache state per instance, selects optimal target
- **vLLM Pool** — multiple vLLM replicas serving granite-2b-cpu

## Deployment

```bash
# Via Helm (when cluster is ready)
helm install triforce infrastructure/helm/ \
  --set llmd.enabled=true \
  --set llmd.replicas=3 \
  --set litellm.apiKey=$KEY \
  --set postgres.password=$PW
```

## How It Works

```
Request → IGW (Envoy) → EPP selects warmest cache instance
              │
              ├── vLLM Instance 1: cache 90% warm → ROUTE HERE
              ├── vLLM Instance 2: cache 45% warm → skip
              └── vLLM Instance 3: cache 10% warm → skip
```

## Source

- [Introduction to distributed inference with llm-d](https://developers.redhat.com/articles/2025/11/21/introduction-distributed-inference-llm-d)
- [Accelerate multi-turn workloads with llm-d](https://developers.redhat.com/articles/2026/01/13/accelerate-multi-turn-workloads-llm-d)
- [Red Hat AI Inference](https://www.redhat.com/en/products/ai/inference)
