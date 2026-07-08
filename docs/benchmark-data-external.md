# Triforce Benchmark Data Ledger

**External-Safe Companion to the Triforce White Paper**
**July 2026**

## Purpose

This file summarizes benchmark provenance for public-facing Triforce material.
The source of truth for pass/fail thresholds is `tests/benchmark_rubric.yaml`.
The source of truth for publishable claims is `tests/claim_registry.yaml`.

## Evidence Labels

| Label | Meaning |
|-------|---------|
| Measured | Produced by a live endpoint or benchmark command in the named environment |
| Reported | Provided by another team and not independently re-measured here |
| Estimated | Calculated from assumptions or extrapolated from measurements |
| Roadmap | Designed or documented, but not a live feature claim |

## Current Target Environments

| Environment | Role | Status |
|-------------|------|--------|
| Local static | Unit, contract, frontend, YAML, and copy-hygiene checks | Active |
| Local full | Adds Helm, Java 21, and Maven checks | Requires local tools |
| MAAS | Historical CPU/accelerator comparison data | Retained for context |
| Oberon | Current authoritative OpenShift validation target | Requires fresh deployment run |

## Oberon Model Alias Set

Oberon acceptance is built around 10 LiteLLM aliases:

| Alias | Role |
|-------|------|
| `granite-350m` | fast draft/classification model |
| `granite-4-0-h-tiny-cpu` | small CPU compatibility alias |
| `granite-2b-cpu` | baseline target for NER/fraud/speculative comparison |
| `granite-2b-cpu-speculative` | vLLM speculative decoding alias |
| `granite-2b-int8` | AMX/INT8 optimization path |
| `qwen25-3b-cpu` | classification and summarization |
| `granite-4.1-3b` | next-generation Granite CPU tier |
| `phi3-mini-cpu` | reasoning tier |
| `granite-3-2-8b-instruct-cpu` | fusion judge and complex reasoning |
| `granite-4.1-8b` | simulated complex tier for Oberon heterogeneous routing |

## Historical MAAS Measurements

The table below is retained as measured comparison context. These values do not
verify current Oberon claims by themselves.

| Task | CPU Model | CPU Latency | Accelerator Model | Accelerator Latency | Speedup | Observation |
|------|-----------|-------------|-------------------|---------------------|---------|-------------|
| Classification | `granite-2b-cpu` | 389ms | `llama-scout-17b` | 188ms | 2.1x | Both correct |
| NER | `qwen25-3b-cpu` | 4,602ms | `llama-scout-17b` | 2,031ms | 2.3x | Both extract entities |
| Summarization | `phi3-mini-cpu` | 3,448ms | `llama-scout-17b` | 1,549ms | 2.2x | Gaudi more detailed |
| Compliance | `phi3-mini-cpu` | 1,901ms | `llama-scout-17b` | 1,306ms | 1.5x | Both identify structuring |
| Diagnosis | `granite-8b-cpu` | 14,817ms | `gpt-oss-120b` | 1,465ms | 10.1x | Gaudi cites pathogen |

*CPU: reproducible medians (3 samples each), July 8 2026. Gaudi: June 30 2026.*

Historical throughput comparison:

| Metric | CPU | Accelerator |
|--------|-----|-------------|
| Requests per second | 0.23 | 0.87 |
| Mean latency | 4.33s | 1.15s |
| Time to first token | 4204ms | 401ms |

## MAAS Throughput Stability (July 8)

A July 8 re-benchmark against MAAS confirmed per-token generation speed is unchanged from June 30:

| Model | Jun 30 median | Jul 8 median | Change |
|-------|:-:|:-:|:-:|
| granite-2b-cpu | 412ms (classify) | 389ms | -5.6% |
| qwen25-3b-cpu | 4,916ms (NER) | 4,602ms | -6.4% |
| phi3-mini-cpu | 3,489ms (summarize) | 3,448ms | -1.2% |
| granite-8b-cpu | 17,821ms (NER) | 17,690ms | -0.7% |

All within measurement noise. Infrastructure changes on RAC MAAS did not affect inference throughput.

## Oberon Measurements To Regenerate

These values must be regenerated after deploying `infrastructure/oberon/values-oberon.yaml`:

| Measurement | Endpoint or Test |
|-------------|------------------|
| Classification latency ladder | `/api/v1/benchmark/run` |
| NER latency ladder | `/api/v1/benchmark/run` |
| Summarization latency ladder | `/api/v1/benchmark/run` |
| INT8 speedup | `granite-2b-cpu` vs `granite-2b-int8` |
| Speculative decoding speedup | `/api/v1/speculative/run` |
| Fusion structured judge output | `/api/v1/fusion` |
| Router complex-tier behavior | `/route` |
| BitNet latency | `bitnet-server:8080/v1/chat/completions` |
| Claim audit | `tests/test_claim_accuracy.py` |

## Live Module Benchmark Map

| Module | Benchmark Authority |
|--------|---------------------|
| `semantic-routing` | `/route`, router tests |
| `conditional-pipeline` | healthcare pipeline inference log |
| `mcp-tools` | MCP gateway and fallback tools |
| `model-optimization` | model ladder and INT8 comparison |
| `batch-processing` | Redpanda/AMQ Streams flow |
| `replica-scaling` | replica and concurrency tests |
| `adaptive-classification` | cold/warm cache benchmark |
| `benchmarking` | `/api/v1/benchmark/models`, `/api/v1/benchmark/run` |
| `speculative-decoding` | `/api/v1/speculative/status`, `/api/v1/speculative/run` |
| `edge-inference` | `bitnet-server` service and inference response |
| `heterogeneous-routing` | `/route` complex-tier output |
| `multi-model-fusion` | structured judge fields |
| `cost-analysis` | estimate-labeled routing/cost calculations |
| `scale-testing` | concurrent request and throughput gates |
| `llmd-inference` | roadmap only |

## Claim Rules

- Speculative decoding can be called live when the status and run endpoints
  return measurements. It can be called a speedup only when the measured result
  meets the current threshold.
- INT8 speedup must be measured on the target cluster before a multiplier is
  published.
- BitNet latency and energy values are paper references until measured on
  Oberon.
- Cost figures are estimates unless the claim registry marks current pricing as
  verified.
- Compliance wording must say supports or contributes to.

## Commands

Local static:

```bash
python -m pytest tests/contracts/
python -m pytest services/healthcare-agent/tests/
python -m pytest services/semantic-router/tests/
go test ./...
npm run build
npx vitest run
```

Oberon acceptance:

```bash
helm template infrastructure/helm \
  --values infrastructure/oberon/values-oberon.yaml

python -m pytest tests/test_deployment.py
python -m pytest tests/test_virt_edge.py
python -m pytest tests/test_claim_accuracy.py
python -m pytest tests/test_stage_9_module_benchmarks.py
```
