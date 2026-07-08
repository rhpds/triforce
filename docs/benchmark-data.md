# Triforce Benchmark Data — June–July 2026

## Data Provenance

All numbers are classified by how they were obtained:

- **✓ Measured** — independently verified by our team via live API calls to MAAS
- **ⓘ Reported** — provided by infrastructure team, not independently verified by us
- **⊕ Estimated** — calculated from assumptions or extrapolated from measured data
- **◇ Projected** — expected based on vendor data, not yet tested

## Measurement Environment

### RAC MAAS Cluster (Model Serving)
| Component | Detail |
|-----------|--------|
| **Platform** | Red Hat OpenShift 4.x on bare metal |
| **CPU Nodes** | 6× Intel Xeon 6 workers (256 cores, 503Gi each) = **1,536 CPU cores** |
| **Gaudi Nodes** | 3× Intel Gaudi 3 workers (Supermicro SYS-822GA-NGR3) |
| | worker07: 288 CPU, 2,267Gi RAM, 8× Gaudi 3 (driver v1.22.1, FW hl-gaudi3-1.22.0-fw-61.3.2) |
| | worker08: 288 CPU, 2,267Gi RAM, 8× Gaudi 3 |
| | worker09: 256 CPU, 2,015Gi RAM, 8× Gaudi 3 |
| **Total Gaudi** | 24× Intel Gaudi 3 cards |
| **Control Plane** | 3× 128-core nodes (528Gi each) |
| **Model Proxy** | LiteLLM v1.81.0 (5 replicas) → routes to CPU or Gaudi backends |

### CPU Model Serving Stack
| Model | Runtime | Backend | Notes |
|-------|---------|---------|-------|
| granite-2b-cpu | **OpenVINO** (OptimumIntel) | FastAPI | Intel-optimized inference engine |
| qwen25-3b-cpu | **OpenVINO** (OptimumIntel) | FastAPI | Intel-optimized inference engine |
| phi3-mini-cpu | **OpenVINO** (OptimumIntel) | FastAPI | Intel-optimized inference engine |
| granite-3.2-8b-instruct-cpu | **vLLM v0.23.0** | vLLM CPU | Migrated June 24 — continuous batching |
| granite-4-0-h-tiny-cpu | **HuggingFace Transformers** | FastAPI | BFloat16, classification only |

### Gaudi Model Serving Stack
| Model | Runtime | Gaudi Cards | Tensor Parallel |
|-------|---------|-------------|-----------------|
| qwen3-14b (×2 replicas) | vLLM Gaudi (Habana v1.23.0) | 4 per replica (8 total on worker07) | TP=4 |
| microsoft-phi-4 | vLLM Gaudi (RHOAI `odh-vllm-gaudi-rhel9`) | 2 (on worker08) | TP=2 |
| deepseek-r1-distill-qwen-14b | vLLM Gaudi (RHOAI `odh-vllm-gaudi-rhel9`) | 4 (on worker08) | TP=4 |
| granite-3-2-8b-instruct | vLLM Gaudi (RHOAI) | Shared (on Gaudi node) | — |
| llama-31-70b | llama.cpp | CPU (worker01, 64 CPU limit) | — |
| gpt-oss-20b | vLLM Gaudi | Shared | — |
| gpt-oss-120b | vLLM Gaudi | Multi-card | — |

### Gaudi Card Allocation
| Node | Cards Used | Cards Free | Models |
|------|-----------|------------|--------|
| worker07 | 8/8 (100%) | 0 | qwen3-14b ×2 replicas (4 cards each) |
| worker08 | 6/8 (75%) | 2 | deepseek-r1 (4 cards) + phi-4 (2 cards) |
| worker09 | 0/8 (0%) | 8 | Available for new deployments |

### infra01 Cluster (Demo Application)
| Component | Detail |
|-----------|--------|
| **Namespace** | triforce (10 pods) |
| **Quota** | 16 CPU limit, 32Gi memory |
| **Date** | June 23-26, 2026 |
| **Benchmark Tool** | guidellm v0.3.1 + custom benchmark endpoints |
| **Methodology** | Single-request latency unless noted. Client-side wall-clock (includes network). |

---

## CPU-Only Benchmarks (Intel Xeon 6 + OpenVINO)

*All CPU models served via OpenVINO (Intel's optimized inference engine) except granite-3.2-8b (vLLM CPU) and granite-4-0-h-tiny (raw HuggingFace).*

### All 5 CPU Models — Head-to-Head (Single-Sample, Mid-June)

> **Note**: These are early single-sample measurements from mid-June. The authoritative numbers are the **reproducible medians** (3 samples each) in the [CPU vs Gaudi Comparison](#cpu-vs-gaudi-comparison--reproducible-medians-) section below. A July 8 re-benchmark confirmed per-token throughput is identical (±5%) to June 30, validating throughput stability after RAC MAAS infrastructure changes.

**Classification** (single category output):
| Model | Params | Runtime | Latency | Correct |
|-------|--------|---------|---------|---------|
| qwen25-3b-cpu | 3B | OpenVINO | **438ms** | Misclassified as progress_note |
| phi3-mini-cpu | 3.8B | OpenVINO | 504ms | Correct |
| granite-2b-cpu | 2B | OpenVINO | 797ms | Correct |
| granite-3.2-8b-instruct-cpu | 8B | vLLM CPU | 904ms | Misclassified as progress_note |
| granite-4-0-h-tiny-cpu | ~1B | HF Transformers | 4,877ms | Correct (not CPU-optimized) |

**NER** (medical entity extraction):
| Model | Params | Runtime | Latency | Tokens | Quality |
|-------|--------|---------|---------|--------|---------|
| qwen25-3b-cpu | 3B | OpenVINO | **5,276ms** | 145 | Entities found, non-standard JSON format |
| granite-2b-cpu | 2B | OpenVINO | 6,850ms | 219 | Clean JSON array, correct entity types |
| phi3-mini-cpu | 3.8B | OpenVINO | 10,327ms | 338 | JSON in markdown code block, verbose |
| granite-3.2-8b-instruct-cpu | 8B | vLLM CPU | 18,314ms | 174 | Clean JSON, includes disease subtype |
| granite-4-0-h-tiny-cpu | ~1B | HF Transformers | **TIMEOUT** | — | Server disconnected |

**Summarization** (2-3 sentence clinical summary):
| Model | Params | Runtime | Latency | Tokens |
|-------|--------|---------|---------|--------|
| phi3-mini-cpu | 3.8B | OpenVINO | **2,712ms** | 84 |
| qwen25-3b-cpu | 3B | OpenVINO | 3,402ms | 95 |
| granite-2b-cpu | 2B | OpenVINO | 3,879ms | 122 |
| granite-3.2-8b-instruct-cpu | 8B | vLLM CPU | 13,017ms | 123 |
| granite-4-0-h-tiny-cpu | ~1B | HF Transformers | **TIMEOUT** | — |

**Compliance Reasoning** (AML structuring detection):
| Model | Params | Runtime | Latency | Correct | Quality |
|-------|--------|---------|---------|---------|---------|
| phi3-mini-cpu | 3.8B | OpenVINO | **1,613ms** | Yes | Concise, identifies structuring |
| granite-2b-cpu | 2B | OpenVINO | 4,498ms | Yes | Basic reasoning, correct conclusion |
| qwen25-3b-cpu | 3B | OpenVINO | 5,532ms | **No** | Incorrectly said "No" to structuring |
| granite-3.2-8b-instruct-cpu | 8B | vLLM CPU | 21,080ms | Yes | Detailed, references suspicious pattern |
| granite-4-0-h-tiny-cpu | ~1B | HF Transformers | **TIMEOUT** | — | Server disconnected |

### CPU Findings
- **Best overall CPU model**: phi3-mini-cpu (OpenVINO) — fastest on 3/4 tasks, always correct
- **Best NER format**: granite-2b-cpu (OpenVINO) — cleanest JSON output, reliable parsing
- **OpenVINO advantage**: The 3 OpenVINO models (2B, 3B, 3.8B) outperform the vLLM 8B model on latency despite being smaller — OpenVINO is highly optimized for Intel Xeon 6
- **granite-4-0-h-tiny-cpu**: Not production-ready — server disconnects on tasks requiring >32 output tokens. Only usable for classification.
- **granite-3.2-8b-instruct-cpu** (vLLM): Highest quality output but 3-10x slower than OpenVINO models. The vLLM migration improved concurrency but single-request latency is higher than OpenVINO.
- **qwen25-3b-cpu**: Classification misfire + wrong compliance answer — requires prompt engineering or fine-tuning for these specific tasks

---

## Gaudi-Only Benchmarks (Intel Gaudi 3)

*All Gaudi models served via vLLM Gaudi runtime on Intel Gaudi 3 accelerators.*

### All Gaudi Models — Head-to-Head

**Classification**:
| Model | Params | Gaudi Cards | Latency | Correct |
|-------|--------|-------------|---------|---------|
| llama-scout-17b | 17B | Shared | **241ms** | Correct |
| microsoft-phi-4 | 14B | 2 (TP=2) | 338ms | Correct |
| granite-3-2-8b-instruct | 8B | Shared | 466ms | Misclassified as progress_note |
| gpt-oss-20b | 20B | Shared | 580ms | Reasoning model — verbose chain-of-thought output |

**NER**:
| Model | Params | Latency | Tokens | Quality |
|-------|--------|---------|--------|---------|
| gpt-oss-20b | 20B | **1,494ms** | 296 | Extracts age, detailed entity types, most comprehensive |
| llama-scout-17b | 17B | 2,656ms | 178 | Clean JSON, disease subtypes |
| microsoft-phi-4 | 14B | 4,126ms | 198 | JSON in markdown block, includes dosages |
| granite-3-2-8b-instruct | 8B | 5,650ms | 220 | Clean JSON, includes disease classification |

**Summarization**:
| Model | Params | Latency | Tokens | Quality |
|-------|--------|---------|--------|---------|
| gpt-oss-20b | 20B | **1,326ms** | 256 | Most detailed — includes dosages, procedures, follow-up |
| llama-scout-17b | 17B | 1,755ms | 114 | Concise, clinically accurate |
| microsoft-phi-4 | 14B | 2,198ms | 93 | Structured, highlights key findings |
| granite-3-2-8b-instruct | 8B | 2,481ms | 94 | Adequate clinical summary |

**Compliance Reasoning**:
| Model | Params | Latency | Correct | Quality |
|-------|--------|---------|---------|---------|
| gpt-oss-20b | 20B | **1,396ms** | Yes (in reasoning) | Chain-of-thought analysis, cites $10K threshold |
| llama-scout-17b | 17B | 2,388ms | Yes | Explicitly identifies structuring pattern |
| microsoft-phi-4 | 14B | 4,137ms | Yes | References AML regulations, formatted with bold |
| granite-3-2-8b-instruct | 8B | 5,213ms | Yes | Numbered analysis, references suspicious pattern |

**Differential Diagnosis** (frontier clinical reasoning):
| Model | Params | Latency | Primary Diagnosis | Quality |
|-------|--------|---------|-------------------|---------|
| gpt-oss-120b | 120B | **1,465ms** | Bacterial meningitis (S. pneumoniae) | Cites specific pathogen, references CSF pleocytosis, provides ranked differential |
| microsoft-phi-4 | 14B | 4,746ms | Bacterial meningitis | Good clinical reasoning, appropriate differential |
| granite-3-2-8b-instruct | 8B | 7,310ms | Bacterial meningitis | Adequate differential, less specific |

### Gaudi Findings (reproducible medians, 3 samples)
- **Most consistent Gaudi model**: llama-scout-17b — fastest median on ALL 4 standard tasks (classification 188ms, NER 2,031ms, summarization 1,549ms, compliance 1,306ms) with low variance
- **gpt-oss-20b**: Fast in single samples but **unreliable** — NER variance of 2,407-5,525ms (129%). Not recommended for benchmark claims.
- **Frontier reasoning**: gpt-oss-120b at 1.5s for differential diagnosis (single-sample — pending reproducible verification)
- **Intel Gaudi 3 advantage**: Consistent sub-2s performance on 17B model across all tasks. CPU models range 372ms-4,833ms on same tasks.

---

## CPU vs Gaudi Comparison — Reproducible Medians ✓

*All numbers are medians from 3 independent samples per model per task. Raw data in `test-receipts/benchmark-suite-20260630-*.json`. Reproducible via `python3 scripts/benchmark-suite.py --samples 3 --gaudi`.*

| Task | Best CPU Model | Runtime | CPU Median | Best Gaudi Model | Gaudi Median | Speedup | Quality |
|------|---------------|---------|------------|------------------|--------------|---------|---------|
| Classification | phi3-mini (3.8B) | OpenVINO | 372ms | llama-scout (17B) | **188ms** | 2.0x | Both correct |
| NER | granite-2b (2B) | OpenVINO | 4,833ms | llama-scout (17B) | **2,031ms** | 2.4x | Both extract entities |
| Summarization | phi3-mini (3.8B) | OpenVINO | 3,489ms | llama-scout (17B) | **1,549ms** | 2.3x | Gaudi more detailed |
| Compliance | phi3-mini (3.8B) | OpenVINO | 1,932ms | llama-scout (17B) | **1,306ms** | 1.5x | Both identify structuring |
| Diagnosis† | granite-8b (8B) | vLLM CPU | 14,817ms | gpt-oss-120b (120B) | **1,465ms** | 10.1x | Gaudi cites pathogen |

*† Diagnosis is from single-sample measurement (June 23). Not yet re-run in reproducible suite because gpt-oss-120b was not included in the automated run. Will be added in next benchmark cycle.*

### Variance Assessment
| Model | Task | Min | Median | Max | Variance |
|-------|------|-----|--------|-----|----------|
| phi3-mini-cpu | Classification | 371ms | 372ms | 613ms | Low (cold start on #1) |
| granite-2b-cpu | NER | 4,736ms | 4,833ms | 5,096ms | Low (7.6%) |
| llama-scout-17b | Classification | 187ms | 188ms | 247ms | Low (32% but 60ms range) |
| gpt-oss-20b | NER | 2,407ms | 4,574ms | 5,525ms | **HIGH (129%)** — unreliable |

**Note on gpt-oss-20b**: This model showed extreme variance (984ms-5,525ms across tasks). Single-sample measurements made it appear fastest, but median measurements show llama-scout-17b is consistently faster across all tasks. The white paper now uses llama-scout-17b as the best Gaudi model.

### When CPU (Xeon 6 + OpenVINO) is Sufficient
- **Classification**: CPU at 372ms vs Gaudi at 188ms — 2x faster on Gaudi but CPU quality is identical. For batch document classification, CPU at $0 incremental cost is the right choice.
- **Compliance**: CPU at 1.9s vs Gaudi at 1.3s — 1.5x difference. Both produce correct answers. CPU is adequate for non-real-time compliance checks.

### When Gaudi 3 is the Right Choice
- **Differential diagnosis**: CPU at 14.8s vs Gaudi at 1.5s — **10.1x faster** AND clinically superior output (single-sample, pending reproducible verification).
- **NER at scale**: CPU at 4.8s vs Gaudi at 2.0s — 2.4x faster. At high volume, the cumulative time savings are significant.
- **Real-time summarization**: CPU at 3.5s vs Gaudi at 1.5s — 2.3x faster. For interactive applications, sub-2s response time matters.

---

## Throughput Benchmarks (guidellm v0.3.1)

*Synthetic text workload: 200 prompt tokens, 32 output tokens.*

### granite-2b-cpu (Intel Xeon 6, OpenVINO)
| Metric | Value |
|--------|-------|
| Requests/sec | 0.23 |
| Mean latency | 4.33s |
| TTFT (mean) | 4,204ms |
| ITL (mean) | 1.3ms |
| Concurrency scaling | Flat — 10 concurrent = 12.9s latency, same 0.23 req/s |

### granite-3-2-8b-instruct (Intel Gaudi 3)
| Metric | Value |
|--------|-------|
| Requests/sec | 0.87 |
| Mean latency | 1.15s |
| TTFT (mean) | 401ms |
| ITL (mean) | 24ms |

### CPU vs Gaudi Throughput Comparison
| Metric | CPU (Xeon 6 + OpenVINO) | Gaudi 3 | Speedup |
|--------|------------------------|---------|---------|
| Requests/sec | 0.23 | 0.87 | **3.8x** |
| Mean latency | 4.33s | 1.15s | **3.8x** |
| Time to first token | 4,204ms | 401ms | **10.5x** |
| Concurrent scaling | Flat (serialized by FastAPI) | Linear (vLLM batching) | Gaudi wins at concurrency |

*Note: CPU throughput is bottlenecked by the FastAPI serving layer (serialized requests via threading lock), not by OpenVINO inference speed. Migration to vLLM CPU would improve concurrency but may not improve single-request latency — see vLLM migration section below.*

---

## vLLM CPU Migration Results

*granite-3.2-8b-instruct migrated from custom FastAPI (with threading lock) to vLLM v0.23.0 CPU backend (June 24, 2026). This was the first of the 5 CPU models to migrate.*

| Metric | Before (FastAPI) | After (vLLM v0.23.0) | Change | Source |
|--------|-----------------|----------------------|--------|--------|
| Single request | 663ms | 1,134ms | +71% (scheduling overhead) | ⓘ Reported |
| 5 concurrent (worst case) | ~5,500ms | 3,397ms | **-38%** | ⓘ Reported |
| Max concurrency | 1 (serialized) | 64x | **64x improvement** | ⓘ Reported |
| Streaming | Fake word-split | Real token-by-token SSE | Genuine streaming | ⓘ Reported |
| Metrics | None | Prometheus /metrics | Production-grade | ⓘ Reported |

*Note: These numbers were reported by the MAAS infrastructure team (Ashok) during the migration. We have not independently re-measured them. Independent verification is planned.*

**Key takeaway**: Single-request latency increased due to vLLM's scheduling and batching overhead, but the serialization bottleneck was eliminated. The old FastAPI setup used a Python threading lock — under concurrent load, each user waited in a queue. vLLM's continuous batching processes multiple requests in a single forward pass.

**Open question**: Should the remaining 4 CPU models (currently on OpenVINO + FastAPI) migrate to vLLM? OpenVINO is Intel's own optimized inference engine and may already be optimal for 2B-3.8B models. Benchmarking OpenVINO vs vLLM at equal concurrency is needed before deciding.

---

## Optimization Module Results

### Semantic Router (ONNX qint8 AVX512)
*Embedding classification using all-MiniLM-L6-v2 (22M params) for request routing.*

| Backend | Latency per classification |
|---------|---------------------------|
| PyTorch (CPU, original) | 3,200ms |
| ONNX Runtime (default FP32 model) | 400-1,300ms |
| ONNX Runtime (qint8 AVX512 quantized) | **5-200ms** |
| **Improvement** | **640x** vs PyTorch |

*The quantized INT8 model with AVX512 instructions on Xeon 6 reduces routing overhead to sub-10ms — making the "<1ms routing overhead" claim credible for warm-cache queries.*

### Adaptive Classification Cache
| Metric | Value |
|--------|-------|
| Cold start (LLM classify) | ~800ms |
| Warm cache (SHA-256 hash lookup) | <1ms |
| Hit rate after 10 identical records | 80%+ |
| Projected hit rate at scale (1M+ records) | 95%+ ◇ |
| Storage | PostgreSQL (persistent) + in-memory dict (fast) |

### Multi-Model Fusion (Panel + Judge)
*3 models answer independently in parallel, judge synthesizes consensus/contradictions.*

| Component | Models | Latency |
|-----------|--------|---------|
| Panel (3 CPU models, parallel) | granite-2b + qwen25-3b + phi3-mini | 11,226ms wall clock |
| Judge synthesis (CPU) | granite-3.2-8b-instruct-cpu | 28,817ms |
| **Total (all CPU)** | **4 models** | **40,045ms** |
| Projected total (Gaudi judge) | 3 CPU panel + 1 Gaudi judge | ~15,000ms ◇ |

*Fusion on CPU-only is slow because the 8B judge model takes 29s on vLLM CPU. Routing the judge to Gaudi would reduce total fusion time to ~15s.*

### MCP Tools vs LLM Inference
*Drug interaction checking: database lookup vs language model.*

| Approach | Latency | Source |
|----------|---------|--------|
| MCP tool (FDA database via JSON-RPC) | **16ms** | Deterministic lookup |
| LLM call (same question to granite-2b) | 3,000-8,000ms | Probabilistic generation |
| **Improvement** | **187-500x** | — |

*Not every question needs an LLM. The MCP Gateway federates 8 tools that replace LLM calls with deterministic data lookups.*

---

## Cost Analysis

### Infrastructure Cost Model
| Component | Cost | Notes |
|-----------|------|-------|
| CPU inference (Xeon 6, RHDP MAAS) | **$0 incremental per token** | Hardware owned, included in RHDP infrastructure. Electricity + amortization are fixed costs. |
| Gaudi inference (Gaudi 3, RAC MAAS) | **$/token** | Shared RAC infrastructure. Per-token cost depends on RAC allocation model. |
| Cloud API comparison | $0.15-$0.60/M tokens | Reference: Claude Haiku, GPT-4o-mini pricing |

### Per-Demo Session Cost
| Component | Tokens | CPU Cost | Gaudi Cost |
|-----------|--------|----------|------------|
| Pipeline run (4 LLM calls) | ~6,000 | $0 | ~$0.001 |
| Fusion (3 panel + 1 judge) | ~8,000 | $0 | ~$0.001 |
| Benchmark comparison (3 models) | ~1,500 | $0 | ~$0.0005 |
| **Total per demo session** | **~20,000** | **$0** | **~$0.003** |

### Projected Cost at Scale (1M records/month, healthcare pipeline)
| Routing Strategy | Monthly Incremental Cost | Savings vs All-Gaudi |
|-----------------|------------------------|---------------------|
| 100% Gaudi | ~$11,250* | — |
| 100% CPU (Xeon 6) | $0 | ~$11,250 (100%) |
| **80% CPU / 20% Gaudi (heterogeneous)** | **~$2,250*** | **~$9,000 (80%)** |

*\* ⊕ Estimated: Gaudi cost calculated using equivalent cloud API pricing ($0.15/M input tokens, $0.60/M output tokens). Actual RAC MAAS cost depends on internal allocation model — these numbers are for comparative analysis only, not actual billing.*

---

## Hardware Summary

### Full Intel Stack — No Third-Party Accelerator Dependency

```
┌───────────────────────────────────────────────────────────────┐
│                      RAC MAAS Cluster                         │
│              Red Hat OpenShift on Bare Metal                  │
│                                                               │
│  ┌──────────────────────────┐  ┌────────────────────────────┐ │
│  │     CPU Pool             │  │     Gaudi Pool             │ │
│  │     Intel Xeon 6         │  │     Intel Gaudi 3          │ │
│  │                          │  │     Supermicro SYS-822GA   │ │
│  │  6× workers              │  │  3× workers                │ │
│  │  1,536 cores total       │  │  24 Gaudi 3 cards total    │ │
│  │  256 cores / node        │  │  8 cards / node            │ │
│  │  503Gi RAM / node        │  │  2,015-2,267Gi / node      │ │
│  │                          │  │                            │ │
│  │  OpenVINO (3 models)     │  │  vLLM Gaudi (5+ models)    │ │
│  │  vLLM CPU (1 model)      │  │  Tensor Parallel TP=2-4    │ │
│  │  HF Transformers (1)     │  │                            │ │
│  │                          │  │  Driver: v1.22.1           │ │
│  │  $0 incremental / token  │  │  FW: hl-gaudi3-1.22.0      │ │
│  └──────────────────────────┘  └────────────────────────────┘ │
│                                                               │
│  LiteLLM v1.81.0 (5 replicas)                                 │
│  Unified OpenAI-compatible API → routes to CPU or Gaudi       │
│  PostgreSQL + Redis for state and caching                     │
└───────────────────────────────────────────────────────────────┘
```
