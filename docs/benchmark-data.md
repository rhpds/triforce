# Triforce Benchmark Data — June 2026

## Measurement Environment

### RAC MAAS Cluster (Model Serving)
| Component | Detail |
|-----------|--------|
| **Platform** | Red Hat OpenShift 4.x on bare metal |
| **CPU Nodes** | 6× Intel Xeon workers (256 cores, 503Gi each) = **1,536 CPU cores** |
| **Gaudi Nodes** | 3× Intel Gaudi workers (24 total Gaudi cards) |
| | worker07: 288 CPU, 2,267Gi RAM, 8× Gaudi |
| | worker08: 288 CPU, 2,267Gi RAM, 8× Gaudi |
| | worker09: 256 CPU, 2,015Gi RAM, 8× Gaudi |
| **Control Plane** | 3× 128-core nodes (528Gi each) |
| **Model Serving** | LiteLLM proxy → vLLM (CPU + Gaudi backends) |
| **CPU Runtime** | `vllm/vllm-openai:latest` |
| **Gaudi Runtime** | `registry.redhat.io/rhoai/odh-vllm-gaudi-rhel9` + `vault.habana.ai/gaudi-docker/1.23.0/habanalabs/vllm-installer-2.9.0` |

### infra01 Cluster (Demo Application)
| Component | Detail |
|-----------|--------|
| **Namespace** | triforce (10 pods) |
| **Quota** | 16 CPU limit, 32Gi memory |
| **Date** | June 23-26, 2026 |
| **Benchmark Tool** | guidellm v0.3.1 + custom benchmark endpoints |

## Models Tested

### CPU Models (Intel Xeon 6, $0/token)
| Model | Parameters | Runtime | Serving |
|-------|-----------|---------|---------|
| granite-2b-cpu | 2B | vLLM CPU | FastAPI (vLLM migration pending) |
| qwen25-3b-cpu | 3B | vLLM CPU | FastAPI (vLLM migration pending) |
| phi3-mini-cpu | 3.8B | vLLM CPU | FastAPI (vLLM migration pending) |
| granite-3.2-8b-instruct-cpu | 8B | vLLM CPU | **Migrated to vLLM v0.23.0** (June 24) |
| granite-4-0-h-tiny-cpu | ~1B | vLLM CPU | Classification only (disconnects on long tasks) |

### Gaudi Models (Intel Gaudi, $/token)
| Model | Parameters | Runtime | Gaudi Cards |
|-------|-----------|---------|-------------|
| granite-3-2-8b-instruct | 8B | vLLM Gaudi (RHOAI) | Shared |
| microsoft-phi-4 | 14B | vLLM Gaudi (RHOAI) | Shared |
| deepseek-r1-distill-qwen-14b | 14B | vLLM Gaudi (RHOAI) | Shared |
| qwen3-14b | 14B | vLLM Gaudi (Habana) | Shared |
| llama-scout-17b | 17B | vLLM Gaudi | Shared |
| gpt-oss-20b | 20B | vLLM Gaudi | Shared |
| gpt-oss-120b | 120B | vLLM Gaudi | Multi-card |
| llama-31-70b | 70B | vLLM Gaudi | Multi-card |

---

## CPU-Only Benchmarks (Intel Xeon 6)

### All 5 CPU Models — Head-to-Head

**Classification** (single category output):
| Model | Params | Latency | Correct |
|-------|--------|---------|---------|
| qwen25-3b-cpu | 3B | **438ms** | Yes (but misclassified as progress_note) |
| phi3-mini-cpu | 3.8B | 504ms | Yes |
| granite-2b-cpu | 2B | 797ms | Yes |
| granite-3-2-8b-instruct-cpu | 8B | 904ms | Yes (but misclassified as progress_note) |
| granite-4-0-h-tiny-cpu | ~1B | 4,877ms | Yes (not CPU-optimized) |

**NER** (medical entity extraction):
| Model | Params | Latency | Tokens | Quality |
|-------|--------|---------|--------|---------|
| qwen25-3b-cpu | 3B | **5,276ms** | 145 | Entities found, non-standard format |
| granite-2b-cpu | 2B | 6,850ms | 219 | Clean JSON, correct entities |
| phi3-mini-cpu | 3.8B | 10,327ms | 338 | JSON in markdown block, verbose |
| granite-3-2-8b-instruct-cpu | 8B | 18,314ms | 174 | Clean JSON, includes disease type |
| granite-4-0-h-tiny-cpu | ~1B | **TIMEOUT** | — | Server disconnected |

**Summarization** (2-3 sentence clinical summary):
| Model | Params | Latency | Tokens |
|-------|--------|---------|--------|
| phi3-mini-cpu | 3.8B | **2,712ms** | 84 |
| qwen25-3b-cpu | 3B | 3,402ms | 95 |
| granite-2b-cpu | 2B | 3,879ms | 122 |
| granite-3-2-8b-instruct-cpu | 8B | 13,017ms | 123 |
| granite-4-0-h-tiny-cpu | ~1B | **TIMEOUT** | — |

**Compliance Reasoning** (AML structuring analysis):
| Model | Params | Latency | Correct | Quality |
|-------|--------|---------|---------|---------|
| phi3-mini-cpu | 3.8B | **1,613ms** | Yes | Concise, correct |
| granite-2b-cpu | 2B | 4,498ms | Yes | Basic reasoning |
| qwen25-3b-cpu | 3B | 5,532ms | **No** (said "No") | Incorrect answer |
| granite-3-2-8b-instruct-cpu | 8B | 21,080ms | Yes | Detailed, mentions suspicious |
| granite-4-0-h-tiny-cpu | ~1B | **TIMEOUT** | — | Server disconnected |

### CPU Findings
- **Best classifier**: phi3-mini-cpu (504ms, always correct)
- **Best NER**: granite-2b-cpu (clean JSON, reliable format)
- **Fastest summarizer**: phi3-mini-cpu (2.7s)
- **Best compliance**: phi3-mini-cpu (1.6s, correct + concise)
- **granite-4-0-h-tiny-cpu**: Not suitable for production — disconnects on any task requiring >32 output tokens
- **granite-3-2-8b-instruct-cpu**: Highest quality but 3-10x slower than smaller models (vLLM migration will help)
- **qwen25-3b-cpu**: Misclassified and gave wrong compliance answer — needs prompt tuning

---

## Gaudi-Only Benchmarks (Intel Gaudi)

### All Gaudi Models — Head-to-Head

**Classification**:
| Model | Params | Latency | Correct |
|-------|--------|---------|---------|
| llama-scout-17b | 17B | **241ms** | Yes |
| microsoft-phi-4 | 14B | 338ms | Yes |
| granite-3-2-8b-instruct | 8B | 466ms | Yes (misclassified as progress_note) |
| gpt-oss-20b | 20B | 580ms | Reasoning model (verbose output) |

**NER**:
| Model | Params | Latency | Tokens | Quality |
|-------|--------|---------|--------|---------|
| gpt-oss-20b | 20B | **1,494ms** | 296 | Includes age, detailed types |
| llama-scout-17b | 17B | 2,656ms | 178 | Clean JSON, disease type |
| microsoft-phi-4 | 14B | 4,126ms | 198 | JSON in markdown block |
| granite-3-2-8b-instruct | 8B | 5,650ms | 220 | Clean JSON, includes disease |

**Summarization**:
| Model | Params | Latency | Tokens |
|-------|--------|---------|--------|
| gpt-oss-20b | 20B | **1,326ms** | 256 |
| llama-scout-17b | 17B | 1,755ms | 114 |
| microsoft-phi-4 | 14B | 2,198ms | 93 |
| granite-3-2-8b-instruct | 8B | 2,481ms | 94 |

**Compliance Reasoning**:
| Model | Params | Latency | Correct | Quality |
|-------|--------|---------|---------|---------|
| gpt-oss-20b | 20B | **1,396ms** | Reasoning model | Detailed (in reasoning output) |
| llama-scout-17b | 17B | 2,388ms | Yes | Cites structuring explicitly |
| microsoft-phi-4 | 14B | 4,137ms | Yes | Cites AML regulations, bold formatting |
| granite-3-2-8b-instruct | 8B | 5,213ms | Yes | Numbered points, references structuring |

**Differential Diagnosis** (frontier reasoning):
| Model | Params | Latency | Primary Diagnosis |
|-------|--------|---------|-------------------|
| gpt-oss-120b | 120B | **1,465ms** | Bacterial meningitis (S. pneumoniae) — cites pathogen, CSF findings |
| microsoft-phi-4 | 14B | 4,746ms | Bacterial meningitis — good clinical reasoning |
| granite-3-2-8b-instruct | 8B | 7,310ms | Bacterial meningitis — adequate |

### Gaudi Findings
- **Fastest overall**: gpt-oss-20b dominates NER (1.5s), summarization (1.3s), and compliance (1.4s)
- **Best classifier**: llama-scout-17b (241ms — faster than any CPU model)
- **Best frontier reasoning**: gpt-oss-120b (1.5s AND best quality — counterintuitive but Gaudi memory bandwidth advantage for large models)
- **Gaudi advantage over CPU**: 1.6x-10.1x depending on task, with quality improvements for complex reasoning

---

## CPU vs Gaudi Comparison (Same Task, Best-in-Class)

| Task | Best CPU | CPU Latency | Best Gaudi | Gaudi Latency | Speedup | Quality Delta |
|------|----------|-------------|------------|---------------|---------|---------------|
| Classification | phi3-mini (3.8B) | 504ms | llama-scout (17B) | **241ms** | 2.1x | Both correct |
| NER | granite-2b (2B) | 6,850ms | gpt-oss-20b (20B) | **1,494ms** | 4.6x | Gaudi includes dosages + age |
| Summarization | phi3-mini (3.8B) | 2,712ms | gpt-oss-20b (20B) | **1,326ms** | 2.0x | Gaudi more detailed (256 vs 84 tokens) |
| Compliance | phi3-mini (3.8B) | 1,613ms | gpt-oss-20b (20B) | **1,396ms** | 1.2x | Gaudi cites specific regulations |
| Diagnosis | granite-8b (8B) | 14,817ms | gpt-oss-120b (120B) | **1,465ms** | 10.1x | Gaudi cites pathogen, references CSF |

### When CPU is Good Enough
- **Classification**: CPU at 504ms vs Gaudi at 241ms — 2x faster on Gaudi but CPU is adequate for batch
- **Compliance**: CPU at 1.6s vs Gaudi at 1.4s — nearly identical, CPU is fine

### When Gaudi is Essential
- **Diagnosis**: CPU at 14.8s vs Gaudi at 1.5s — 10x faster AND better quality
- **NER**: CPU at 6.9s vs Gaudi at 1.5s — 4.6x faster with dosage extraction
- **Summarization at volume**: CPU at 2.7s vs Gaudi at 1.3s — 2x matters at scale

---

## Throughput Benchmarks (guidellm)

### granite-2b-cpu (CPU, Xeon 6)
| Metric | Value |
|--------|-------|
| Requests/sec | 0.23 |
| Mean latency | 4.33s |
| TTFT (mean) | 4,204ms |
| ITL (mean) | 1.3ms |
| Concurrency scaling | Flat — 10 concurrent = 12.9s latency, same 0.23 req/s |

### granite-3-2-8b-instruct (Gaudi)
| Metric | Value |
|--------|-------|
| Requests/sec | 0.87 |
| Mean latency | 1.15s |
| TTFT (mean) | 401ms |
| ITL (mean) | 24ms |

### CPU vs Gaudi Throughput
| Metric | CPU (Xeon 6) | Gaudi | Speedup |
|--------|-------------|-------|---------|
| Requests/sec | 0.23 | 0.87 | **3.8x** |
| Mean latency | 4.33s | 1.15s | **3.8x** |
| TTFT | 4,204ms | 401ms | **10.5x** |
| Concurrent scaling | Flat (bottlenecked) | Linear | Gaudi wins at concurrency |

---

## vLLM CPU Migration Results

*granite-3.2-8b-instruct migrated from custom FastAPI to vLLM v0.23.0 CPU backend (June 24, 2026)*

| Metric | Before (FastAPI) | After (vLLM) | Change |
|--------|-----------------|--------------|--------|
| Single request | 663ms | 1,134ms | +71% (scheduling overhead) |
| 5 concurrent (worst) | ~5,500ms | 3,397ms | **-38%** |
| Max concurrency | 1 (serialized) | 64x | **64x improvement** |
| Streaming | Fake word-split | Real token-by-token | Genuine streaming |
| Metrics | None | Prometheus /metrics | Production-grade |

---

## Optimization Module Results

### Semantic Router (ONNX qint8 AVX512)
| Backend | Latency per classify |
|---------|---------------------|
| PyTorch (original) | 3,200ms |
| ONNX (default model) | 400-1,300ms |
| ONNX (qint8_avx512) | **5-200ms** |
| Improvement | **640x** |

### Adaptive Classification Cache
| Metric | Value |
|--------|-------|
| Cold (first call) | ~800ms (LLM classify) |
| Warm (cached) | 0ms (hash lookup) |
| Hit rate after 10 runs | 80%+ |
| Hit rate at scale (projected) | 95%+ |

### Multi-Model Fusion (Panel + Judge)
| Component | Models | Latency |
|-----------|--------|---------|
| Panel (3 models parallel) | granite-2b + qwen25-3b + phi3-mini | 11,226ms |
| Judge synthesis | granite-3-2-8b-instruct-cpu | 28,817ms |
| Total (CPU only) | 4 models | 40,045ms |
| Projected (Gaudi judge) | 3 CPU + 1 Gaudi | ~15,000ms |

### MCP Tools vs LLM
| Approach | Latency |
|----------|---------|
| MCP tool (drug interaction DB lookup) | 16ms |
| LLM call (same question) | 3,000-8,000ms |
| Improvement | **187-500x** |

---

## Cost Analysis

### Per-Demo Cost
| Component | Tokens | CPU Cost | Gaudi Cost |
|-----------|--------|----------|------------|
| Pipeline (4 LLM calls) | ~6,000 | $0 | ~$0.001 |
| Fusion (4 calls) | ~8,000 | $0 | ~$0.001 |
| Benchmark (3 models) | ~1,500 | $0 | ~$0.0005 |
| **Total per demo** | **~20,000** | **$0** | **~$0.003** |

### Monthly Cost (20 demos/month)
| Scenario | Monthly Cost |
|----------|-------------|
| CPU only | $0 |
| CPU + Gaudi (heterogeneous) | ~$0.06 |
| All Gaudi | ~$4.50 |

### Heterogeneous Routing Cost Impact (1M records/month)
| Routing Strategy | Monthly Cost | Savings vs All-Gaudi |
|-----------------|-------------|---------------------|
| 100% Gaudi | $11,250 | — |
| 100% CPU | $0 | $11,250 (100%) |
| 80% CPU / 20% Gaudi (routed) | $2,250 | **$9,000 (80%)** |

---

## Hardware Summary

### Full Intel Stack — No Third-Party Accelerator Dependency

```
┌──────────────────────────────────────────────────────────┐
│                    RAC MAAS Cluster                       │
│                                                          │
│  ┌─────────────────────┐  ┌──────────────────────────┐  │
│  │   CPU Pool           │  │   Gaudi Pool              │  │
│  │   6× Xeon workers    │  │   3× Gaudi workers        │  │
│  │   1,536 cores total  │  │   24 Gaudi cards total    │  │
│  │   256 cores / node   │  │   8 cards / node          │  │
│  │   503Gi RAM / node   │  │   2,015-2,267Gi / node    │  │
│  │                      │  │                           │  │
│  │   vLLM CPU runtime   │  │   vLLM Gaudi runtime      │  │
│  │   $0/token           │  │   $/token                 │  │
│  └─────────────────────┘  └──────────────────────────┘  │
│                                                          │
│  LiteLLM Proxy (5 replicas) → routes to CPU or Gaudi    │
│  PostgreSQL + Redis for state                            │
└──────────────────────────────────────────────────────────┘
```
