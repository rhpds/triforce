# Heterogeneous AI Inference at Enterprise Scale on Intel Hardware

**Red Hat + Intel + IBM Technical White Paper**
**June 2026**

*Data classification: ✓ Measured, ⓘ Reported (infra team), ⊕ Estimated, ◇ Projected. See companion benchmark data for full provenance.*

## Executive Summary

Enterprise AI inference doesn't need a single compute tier. This paper presents benchmark data from the Triforce platform demonstrating that intelligent workload routing across heterogeneous Intel hardware — Xeon 6 CPU ($0 incremental per token) and Intel Gaudi 3 accelerator — reduces inference costs by 80% while maintaining quality for the 20% of workloads that benefit from acceleration.

The entire stack is Intel-native. No third-party accelerator dependency.

Key findings:
- **80% of enterprise AI tasks** (classification, NER, fraud scoring) run at equivalent quality on Intel Xeon 6 CPU at $0 incremental cost per token
- **20% of tasks** (summarization, complex reasoning, differential diagnosis) benefit from Intel Gaudi 3 — 2-10x faster with higher quality output
- **Semantic routing** classifies task complexity in 5ms (ONNX qint8 AVX512) and routes to optimal Intel hardware automatically
- **Adaptive caching** reduces LLM calls by 80%+ over time, compounding savings
- **Full Intel stack**: Xeon 6 CPU + Intel Gaudi 3 + AMX instructions + OpenVINO + ONNX Runtime

## 1. The Problem

| Approach | Cost | Quality | Scale | Vendor Lock-in |
|----------|------|---------|-------|----------------|
| All accelerator | $120K per server | Highest | Limited by budget | NVIDIA dependency |
| Cloud API | $0.15-$0.60/M tokens | Varies | Unlimited but expensive | Cloud vendor |
| All CPU | $0 incremental | Good for 80% of tasks | Limited for complex reasoning | None |
| **Heterogeneous Intel** | **$0 for 80% + accel for 20%** | **Optimal per task** | **Scales both tiers** | **Intel-native** |

## 2. Architecture

```
Request → Semantic Router (5ms, ONNX qint8 AVX512 on Xeon 6)
              │
    ┌─────────┼─────────┐
    │         │         │
  SIMPLE    MEDIUM    COMPLEX
    │         │         │
  CPU Pool  CPU Pool  Gaudi Pool
  Xeon 6    Xeon 6    Intel Gaudi 3
  granite-2b  qwen25-3b  phi-4 / gpt-oss-120b
  $0/token   $0/token   $/token
```

### Technology Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Routing | ONNX Runtime (qint8 AVX512) | Classify complexity, route to hardware |
| Agents | Python/LangGraph + Java/Quarkus + Go | Polyglot AI agents via A2A protocol |
| Tools | MCP Gateway (8 tools, JSON-RPC 2.0) | Database lookups instead of LLM calls |
| Streaming | AMQ Streams | Batch processing at volume |
| CPU Serving | OpenVINO (OptimumIntel) + vLLM CPU | Intel-optimized CPU inference |
| Gaudi Serving | vLLM Gaudi runtime | Accelerated inference on Intel Gaudi 3 |
| Proxy | LiteLLM | Unified OpenAI-compatible API |
| Platform | Red Hat OpenShift | Container orchestration + KServe |
| Governance | IBM Kagenti | Agent discovery, identity, tool control, audit trails |
| Hardware | **Intel Xeon 6 + Intel Gaudi 3** | Full Intel heterogeneous compute |

### Infrastructure

| Tier | Compute | Serving |
|------|---------|---------|
| CPU | Intel Xeon 6 (1,536 total cores) | OpenVINO + vLLM CPU |
| Gaudi | Intel Gaudi 3 (24 total cards) | vLLM Gaudi |

## 3. Benchmark Methodology

All measurements taken on production infrastructure (June 2026):
- **CPU**: Intel Xeon 6, OpenVINO + vLLM CPU serving
- **Gaudi**: Intel Gaudi 3, vLLM Gaudi serving
- **Protocol**: OpenAI-compatible chat completions API via LiteLLM proxy
- **Measurement**: Client-side wall-clock latency (includes network overhead)
- **Workloads**: Clinical NLP (healthcare) and transaction scoring (financial services)
- **Tool**: guidellm for throughput sweeps, custom benchmark endpoints for task-level comparison

## 4. Results

### 4.1 CPU vs Gaudi — Reproducible Medians (3 samples per measurement) ✓

| Task | Best CPU | CPU Median | Best Gaudi | Gaudi Median | Speedup | Quality |
|------|----------|------------|------------|--------------|---------|---------|
| Classification | phi3-mini (3.8B) | 372ms | llama-scout (17B) | **188ms** | 2.0x | Both correct |
| NER | granite-2b (2B) | 4,833ms | llama-scout (17B) | **2,031ms** | 2.4x | Both extract entities |
| Summarization | phi3-mini (3.8B) | 3,489ms | llama-scout (17B) | **1,549ms** | 2.3x | Gaudi more detailed |
| Compliance | phi3-mini (3.8B) | 1,932ms | llama-scout (17B) | **1,306ms** | 1.5x | Both identify structuring |
| Diagnosis† | granite-8b (8B) | 14,817ms | gpt-oss-120b (120B) | **1,465ms** | 10.1x | Gaudi cites pathogen |

*† Single-sample. All other rows are medians from 3 independent runs.*

**Key Insight**: llama-scout-17b is the most consistent Gaudi model — fastest median on all 4 standard tasks. The 2.0-2.4x speedup is the honest, reproducible number.

### 4.2 Throughput Under Concurrent Load ✓

| Metric | CPU (Xeon 6) | Gaudi 3 | Speedup |
|--------|-------------|---------|---------|
| Requests/sec | 0.23 | 0.87 | **3.8x** |
| Mean latency | 4.33s | 1.15s | **3.8x** |
| Time to first token | 4,204ms | 401ms | **10.5x** |
| Concurrent scaling | Flat | Linear | Gaudi wins at concurrency |

### 4.3 Optimization Stack (12 Modules)

| Optimization | Impact | Status |
|-------------|--------|--------|
| Semantic routing (ONNX qint8 AVX512) | 3,200ms → 5ms (**640x**) | ✓ Live |
| Conditional pipeline | 25% fewer LLM calls | ✓ Live |
| MCP tools vs LLM | 16ms vs 3,000ms (**187x**) | ✓ Live |
| Model selection (right model per task) | 10.2s → 7.8s pipeline (24%) | ✓ Live |
| Adaptive classification cache | 80%+ hit rate after warmup | ✓ Live |
| Multi-model fusion (3+judge) | Higher confidence for critical decisions | ✓ Live |
| Heterogeneous routing (CPU→Gaudi) | **80% cost savings** vs all-Gaudi | ✓ Live |
| Batch streaming (AMQ Streams) | N records parallel | ✓ Live |
| Replica scaling | 20-30% latency improvement | ✓ Tested |
| INT8 quantization (OpenVINO) | ◇ Projected 2-3x | Pending |
| Speculative decoding | ◇ Projected 2-3x | Pending |
| llm-d disaggregated inference | ◇ Projected 5.6x | Roadmap |

### 4.4 Cost at Scale ⊕

| Routing Strategy (1M records/month) | Monthly Incremental Cost | Savings |
|--------------------------------------|------------------------|---------|
| 100% Gaudi | ⊕ ~$11,250 | — |
| 100% CPU | $0 | ~$11,250 (100%) |
| **80% CPU / 20% Gaudi** | **⊕ ~$2,250** | **⊕ ~$9,000 (80%)** |

*Cost estimated using equivalent cloud API pricing for comparative analysis.*

## 5. Why Intel-Native Heterogeneous Compute

The entire stack runs on Intel hardware:
- **Xeon 6 CPU**: AMX instructions for INT8/BF16 acceleration
- **Intel Gaudi 3**: Purpose-built AI accelerator with high-bandwidth memory
- **ONNX Runtime**: Quantized INT8 models with AVX512 for sub-5ms routing
- **OpenVINO**: Intel-optimized inference engine for CPU model serving

No NVIDIA dependency. No cloud vendor lock-in. Single-vendor procurement.

### When to Use Each Tier

| Workload | Best Tier | Why |
|----------|-----------|-----|
| Classification | CPU | Identical quality, $0 incremental |
| NER (batch) | CPU | Adequate quality for batch processing |
| NER (real-time) | Gaudi | 4.6x faster, includes dosage extraction |
| Fraud scoring | CPU | Rules + LLM combination, CPU handles well |
| Summarization | Gaudi | 3x more detailed output, 2x faster |
| Compliance reasoning | Either | CPU is 1.2x slower but correct |
| Differential diagnosis | Gaudi | 10.1x faster, clinically superior |
| Frontier reasoning (120B) | Gaudi | Models too large for CPU |

## 6. Future Work

- **INT8 quantization** (pending): OpenVINO INT8 models on Xeon 6 with AMX. ◇ Projected 2-3x additional CPU speedup.
- **Speculative decoding** (pending): Draft model (1B) proposes tokens for target model (2B) verification. ◇ Projected 2-3x speedup, lossless quality.
- **CPU serving evaluation** (in progress): Evaluating OpenVINO vs vLLM CPU for optimal single-request vs concurrent performance tradeoff.
- **llm-d disaggregated inference** (roadmap): Separate prefill and decode across specialized CPU/Gaudi pools with SLO-based routing.

## 7. Conclusion

Heterogeneous AI inference on Intel hardware is not a compromise — it's an optimization:

- **80% of enterprise AI workloads** run at equivalent quality on Intel Xeon 6 CPU at $0 incremental cost
- **20% of workloads** benefit from Intel Gaudi 3 — 2.0-2.4x faster (reproducible medians) with higher quality on complex tasks
- **The semantic router** makes the CPU vs Gaudi decision in 5ms, automatically
- **⊕ Cost savings**: ~$9,000/month at 1M records vs all-Gaudi
- **Full Intel stack**: No third-party accelerator dependency

The question for enterprises isn't "CPU or accelerator?" It's: which tasks need which Intel hardware? The semantic router answers that in 5ms.

---

**Authors**: Jonathan Kershaw (Red Hat), with contributions from Intel and IBM teams.
**Platform**: Triforce
**Contact**: jkershaw@redhat.com
