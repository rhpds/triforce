# Heterogeneous AI Inference at Enterprise Scale on Intel Hardware

**Red Hat + Intel + IBM Technical White Paper**
**Internal Draft — June 2026**

## Executive Summary

Enterprise AI inference doesn't need a single compute tier. This paper presents benchmark data from the Triforce platform demonstrating that intelligent workload routing across heterogeneous Intel hardware — Xeon 6 CPU ($0/token) and Intel Gaudi accelerator ($/token) — reduces inference costs by 80% while maintaining quality for the 20% of workloads that benefit from acceleration.

The entire stack is Intel-native. No third-party accelerator dependency.

Key findings:
- **80% of enterprise AI tasks** (classification, NER, fraud scoring) run at equivalent quality on Intel Xeon 6 CPU at $0/token
- **20% of tasks** (summarization, complex reasoning, differential diagnosis) benefit from Intel Gaudi — 2-10x faster with higher quality output
- **Semantic routing** classifies task complexity in 5ms (ONNX qint8 AVX512) and routes to optimal Intel hardware automatically
- **Adaptive caching** reduces LLM calls by 80%+ over time, compounding savings
- **vLLM continuous batching** on CPU handles 64x concurrent load vs serialized serving
- **Full Intel stack**: Xeon 6 CPU + Intel Gaudi accelerator + AMX instructions + ONNX/OpenVINO

## 1. The Problem

Enterprise AI inference faces a compute dilemma:

| Approach | Cost | Quality | Scale | Vendor Lock-in |
|----------|------|---------|-------|----------------|
| All accelerator | $120K per server | Highest | Limited by budget | NVIDIA dependency |
| Cloud API | $0.15-$0.60/M tokens | Varies | Unlimited but expensive | Cloud vendor |
| All CPU | $0/token (owned hardware) | Good for 80% of tasks | Limited for complex reasoning | None |
| **Heterogeneous Intel** | **$0 for 80% + $/token for 20%** | **Optimal per task** | **Scales both tiers** | **Intel-native** |

## 2. Architecture

```
Request → Semantic Router (5ms, ONNX qint8 AVX512 on Xeon 6)
              │
    ┌─────────┼─────────┐
    │         │         │
  SIMPLE    MEDIUM    COMPLEX
    │         │         │
  CPU Pool  CPU Pool  Gaudi Pool
  Xeon 6    Xeon 6    Intel Gaudi
  granite-2b  qwen25-3b  phi-4 / gpt-oss-120b
  $0/token   $0/token   $/token
```

The router uses a quantized BERT model (all-MiniLM-L6-v2, INT8, AVX512-optimized) to classify request complexity via embedding similarity. Routing decisions happen in 5ms with no LLM call.

### Technology Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Routing | ONNX Runtime (qint8 AVX512) | Classify complexity, route to hardware |
| Agents | Python/LangGraph + Java/Quarkus + Go | Polyglot AI agents via A2A protocol |
| Tools | MCP Gateway (8 tools, JSON-RPC 2.0) | Database lookups instead of LLM calls |
| Streaming | AMQ Streams (Kafka) | Batch processing at volume |
| CPU Serving | vLLM CPU runtime | 5 models on Intel Xeon 6 |
| Gaudi Serving | vLLM Gaudi runtime (RHOAI + Habana) | 8 models on Intel Gaudi |
| Proxy | LiteLLM (5 replicas) | Unified OpenAI-compatible API |
| Platform | Red Hat OpenShift | Container orchestration + KServe |
| Governance | IBM Kagenti | Agent discovery, identity, audit |
| Hardware | **Intel Xeon 6 + Intel Gaudi** | Full Intel heterogeneous compute |

### Infrastructure

| Tier | Nodes | Compute | Memory | Serving |
|------|-------|---------|--------|---------|
| CPU | 6× Xeon workers | 1,536 cores total (256/node) | 503Gi/node | vLLM CPU |
| Gaudi | 3× Gaudi workers | 24 Gaudi cards total (8/node) | 2,015-2,267Gi/node | vLLM Gaudi (RHOAI) |
| Control | 3× control plane | 384 cores total (128/node) | 528Gi/node | — |

## 3. Benchmark Methodology

All measurements taken on production MAAS infrastructure (June 23-26, 2026):
- **CPU**: Intel Xeon 6 (256 cores/node) via RHDP MAAS, vLLM CPU serving
- **Gaudi**: Intel Gaudi (8 cards/node) via RAC MAAS, vLLM Gaudi serving (`odh-vllm-gaudi-rhel9` + `habanalabs/vllm-installer-2.9.0`)
- **Protocol**: OpenAI-compatible chat completions API via LiteLLM proxy
- **Measurement**: Client-side wall-clock latency (includes network overhead)
- **Workloads**: Clinical NLP (healthcare) and transaction scoring (financial services)
- **Tool**: guidellm v0.3.1 for throughput sweeps, custom endpoints for task benchmarks

## 4. Results

### 4.1 CPU vs Gaudi — Best-in-Class per Task

| Task | Best CPU | CPU Latency | Best Gaudi | Gaudi Latency | Speedup | Quality Delta |
|------|----------|-------------|------------|---------------|---------|---------------|
| Classification | phi3-mini (3.8B) | 504ms | llama-scout (17B) | **241ms** | 2.1x | Both correct |
| NER | granite-2b (2B) | 6,850ms | gpt-oss-20b (20B) | **1,494ms** | 4.6x | Gaudi includes dosages |
| Summarization | phi3-mini (3.8B) | 2,712ms | gpt-oss-20b (20B) | **1,326ms** | 2.0x | Gaudi 3x more tokens |
| Compliance | phi3-mini (3.8B) | 1,613ms | gpt-oss-20b (20B) | **1,396ms** | 1.2x | Gaudi cites regulations |
| Diagnosis | granite-8b (8B) | 14,817ms | gpt-oss-120b (120B) | **1,465ms** | **10.1x** | Gaudi cites pathogen |

**Key Insight**: Classification and compliance show minimal Gaudi advantage — CPU is adequate at $0. Diagnosis shows 10.1x speedup on Gaudi AND clinically superior output. The routing decision should be automatic, not manual.

### 4.2 Throughput Under Concurrent Load

| Metric | CPU (Xeon 6) | Gaudi | Speedup |
|--------|-------------|-------|---------|
| Requests/sec | 0.23 | 0.87 | **3.8x** |
| Mean latency | 4.33s | 1.15s | **3.8x** |
| Time to first token | 4,204ms | 401ms | **10.5x** |
| Concurrent scaling | Flat (bottlenecked) | Linear | Gaudi wins at concurrency |

### 4.3 Optimization Stack (12 Modules)

| Optimization | Impact | Status |
|-------------|--------|--------|
| Semantic routing (ONNX qint8 AVX512) | 3,200ms → 5ms (**640x**) | Live |
| Conditional pipeline | 25% fewer LLM calls | Live |
| MCP tools vs LLM | 16ms vs 3,000ms (**187x**) | Live |
| Model selection (right model per task) | 10.2s → 7.8s pipeline (24%) | Live |
| Adaptive classification cache | 80%+ hit rate after warmup | Live |
| Multi-model fusion (3+judge) | Higher confidence for critical decisions | Live |
| Heterogeneous routing (CPU→Gaudi) | **80% cost savings** vs all-Gaudi | Live |
| AMQ Streams batch processing | N records parallel vs sequential | Live |
| Replica scaling | 20-30% latency improvement | Tested |
| INT8 quantization (OpenVINO) | Projected 2-3x | Pending |
| Speculative decoding | Projected 2-3x | Pending |
| llm-d disaggregated inference | Projected 5.6x | Roadmap |

### 4.4 Cost at Scale (1M records/month)

| Routing Strategy | Monthly Cost | Savings vs All-Gaudi |
|-----------------|-------------|---------------------|
| 100% Gaudi | $11,250 | — |
| 100% CPU | $0 | $11,250 (100%) |
| **80% CPU / 20% Gaudi** | **$2,250** | **$9,000 (80%)** |

## 5. Why Intel-Native Heterogeneous Compute

### The Intel Advantage

The entire Triforce stack runs on Intel hardware:
- **Xeon 6 CPU**: 128-core processors with AMX instructions for INT8/BF16 acceleration
- **Intel Gaudi**: Purpose-built AI accelerator with high-bandwidth memory
- **ONNX Runtime**: Quantized INT8 models with AVX512 for sub-5ms routing
- **OpenVINO**: Planned backend for INT8 quantized model serving on CPU

No NVIDIA dependency. No cloud vendor lock-in. Enterprises deploy on hardware they own or can procure from a single vendor.

### When to Use Each Tier

| Workload | Best Tier | Why |
|----------|-----------|-----|
| Classification (document type) | CPU | Identical quality, $0/token |
| NER (entity extraction) | CPU (batch) / Gaudi (real-time) | CPU adequate for batch; Gaudi adds dosage extraction |
| Fraud scoring | CPU | Rules + LLM combination, CPU handles well |
| Summarization | Gaudi | 3x more detailed output, 2x faster |
| Compliance reasoning | Either | CPU is 1.2x slower but correct — volume determines tier |
| Differential diagnosis | Gaudi | 10.1x faster, clinically superior output |
| Frontier reasoning (120B) | Gaudi | Models too large for CPU inference |

## 6. Reproducibility

```bash
# Deploy the platform
git clone https://github.com/rhpds/triforce.git
make deploy EXTRA_HELM_ARGS="--set litellm.apiKey=$KEY"

# Run CPU vs Gaudi benchmark
curl -X POST /api/v1/benchmark/run \
  -d '{"task":"classification","models":["granite-2b-cpu","granite-3-2-8b-instruct"]}'

# Run throughput sweep
guidellm benchmark run --target $MAAS_URL/v1 --model granite-2b-cpu \
  --rate-type concurrent --rate 1,2,4

# Run multi-model fusion
curl -X POST /api/v1/fusion \
  -d '{"task":"compliance","prompt":"Is this AML structuring?"}'
```

Validation matrix: `tests/validation_matrix.yaml` (11 stages)
Benchmark rubric: `tests/benchmark_rubric.yaml` (per-module pass criteria)

## 7. Future Work

- **INT8 quantization** (pending): OpenVINO INT8 models on Xeon 6 with AMX. Projected 2-3x additional CPU speedup.
- **Speculative decoding** (pending): Draft model (granite-4-0-h-tiny, 1B) proposes tokens for target model (granite-2b, 2B) verification. Projected 2-3x speedup, lossless quality.
- **vLLM CPU migration** (in progress): Remaining 4 CPU models migrating from FastAPI to vLLM. Expected 38% improvement at 5 concurrent requests.
- **llm-d disaggregated inference** (roadmap): Separate prefill and decode across specialized CPU/Gaudi pools with SLO-based routing.
- **vLLM semantic router** (evaluating): Replace Python embedding classifier with Go+Rust router from vllm-project/semantic-router.

## 8. Conclusion

Heterogeneous AI inference on Intel hardware is not a compromise — it's an optimization. The data shows:

- **80% of enterprise AI workloads** run at equivalent quality on Intel Xeon 6 CPU at $0/token
- **20% of workloads** benefit from Intel Gaudi — faster AND higher quality
- **The semantic router** makes the CPU vs Gaudi decision in 5ms, automatically, with no code changes
- **Cost savings**: $9,000/month at 1M records vs all-Gaudi
- **Full Intel stack**: No third-party accelerator dependency

The question for enterprises isn't "CPU or accelerator?" It's: which tasks need which Intel hardware? The semantic router answers that question in 5ms, every time, automatically.

---

**Authors**: Jonathan Kershaw (Red Hat), with contributions from Intel and IBM teams.
**Platform**: Triforce — github.com/rhpds/triforce
**Contact**: jkershaw@redhat.com
**Infrastructure**: RAC MAAS (Intel Xeon 6 + Intel Gaudi) on Red Hat OpenShift
