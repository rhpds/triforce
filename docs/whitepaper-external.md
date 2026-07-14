# Triforce: Evidence-Backed Enterprise AI Inference on OpenShift and Intel Hardware

**Red Hat + Intel Technical White Paper**
**External-Safe Draft - July 2026**

## Executive Summary

Enterprise AI inference should be routed, measured, and governed instead of
treated as a single hardware decision. Triforce demonstrates that pattern with
polyglot agents, OpenAI-compatible model serving, semantic routing, live module
validation, and a benchmark rubric that separates measured facts from estimates
or roadmap work.

The core lesson is practical: simple and repeatable tasks can stay on CPU, while
complex or latency-sensitive tasks can be routed to a configured higher-capacity
tier. The platform does not ask users to trust presentation copy. It exposes
endpoints, test gates, and benchmark files that decide which claims are live.

Current implementation status:

| Area | Current State |
|------|---------------|
| Application services | Healthcare, FinServ, semantic router, orchestrator, MCP gateway, frontend |
| Model access | LiteLLM proxy with OpenAI-compatible API |
| Oberon local serving | OVMS/vLLM model aliases, including speculative vLLM worker |
| Modules | 15 total: 14 live, 1 roadmap (`llmd-inference`) |
| Claim authority | `tests/benchmark_rubric.yaml` and `tests/claim_registry.yaml` |
| Public benchmark rule | Verified means measured in the named target environment |

## What Triforce Proves

Triforce is not a slide-only demo. It is a testable platform with three layers
of evidence:

1. **Local correctness**: contracts, unit tests, router tests, Go tests,
   frontend build, and claim-copy hygiene.
2. **Deployment correctness**: Helm rendering, OpenShift manifests, model
   aliases, and service health checks.
3. **Live benchmark correctness**: target-environment measurements from
   healthcare, FinServ, semantic routing, fusion, speculative decoding, edge
   inference, and claim audit endpoints.

The project now treats Oberon/OpenShift validation as the authority for whether
a module can be called live. Historical MAAS CPU/Gaudi numbers remain useful
comparison data, but they do not automatically verify Oberon claims.

## Architecture

```text
User or workload
    |
    v
Frontend / API clients
    |
    +--> Semantic Router (/route)
    |       - simple / medium / complex classification
    |       - CPU by default
    |       - configured complex tier for harder prompts
    |
    +--> Healthcare Agent
    |       - clinical pipeline
    |       - benchmark endpoints
    |       - speculative measurement
    |       - multi-model fusion
    |
    +--> FinServ Agent
    |       - fraud scoring
    |       - compliance reasoning
    |       - risk assessment
    |
    +--> Orchestrator
    |       - A2A discovery
    |       - workflow coordination
    |
    +--> MCP Gateway
            - FHIR, risk, and platform tools

Model calls flow through LiteLLM to local OVMS/vLLM services or, when configured,
external accelerator-backed endpoints.
```

### Serving Model

| Layer | Role |
|-------|------|
| LiteLLM | One OpenAI-compatible API for model aliases |
| OVMS | Local CPU model serving on Oberon |
| vLLM | Local speculative worker and future serving targets |
| Semantic router | Routes prompt complexity before model invocation |
| OpenShift | Runtime, scaling, service discovery, and deployment controls |

Oberon currently defines 10 model aliases in the benchmark rubric:

- `granite-350m`
- `granite-4-0-h-tiny-cpu`
- `granite-2b-cpu`
- `granite-2b-cpu-speculative`
- `granite-2b-int8`
- `qwen25-3b-cpu`
- `granite-4.1-3b`
- `phi3-mini-cpu`
- `granite-3-2-8b-instruct-cpu`
- `granite-4.1-8b`

## Benchmark Methodology

Triforce uses explicit evidence labels:

| Label | Meaning |
|-------|---------|
| Measured | Collected by a live endpoint or benchmark command in the named environment |
| Reported | Provided by another team and not independently re-measured in this repo |
| Estimated | Calculated from assumptions or extrapolated from measured data |
| Roadmap | Designed or documented, but not a live feature claim |

The benchmark rubric defines four run modes:

| Run Mode | Purpose |
|----------|---------|
| `local_static` | Contracts, YAML, unit tests, frontend build, and claim-copy checks |
| `local_full` | Adds Java 21, Maven, and Helm-dependent local checks |
| `live_maas` | Historical CPU/Gaudi comparison data |
| `oberon_acceptance` | Authoritative live module and claim validation |

Public copy follows one rule: if the current target environment did not measure
the result, the claim must be labeled as configured, estimated, reported, or
roadmap.

## Current Benchmark Evidence

### Historical MAAS Comparison Data

The following comparison data remains in the rubric as historical measured data
from June 2026 MAAS runs. It is useful for explaining why routing matters, but it
does not replace Oberon acceptance.

| Task | CPU Model | CPU Latency | Accelerator Model | Accelerator Latency | Speedup | Notes |
|------|-----------|-------------|-------------------|---------------------|---------|-------|
| Classification | `granite-2b-cpu` | 389ms | `llama-scout-17b` | 188ms | 2.1x | Both correct |
| NER | `qwen25-3b-cpu` | 4,602ms | `llama-scout-17b` | 2,031ms | 2.3x | Both extract entities |
| Summarization | `phi3-mini-cpu` | 3,448ms | `llama-scout-17b` | 1,549ms | 2.2x | Gaudi more detailed |
| Compliance | `phi3-mini-cpu` | 1,901ms | `llama-scout-17b` | 1,306ms | 1.5x | Both identify structuring |
| Diagnosis | `granite-8b-cpu` | 14,817ms | `gpt-oss-120b` | 1,465ms | 10.1x | Gaudi cites pathogen |

*CPU: reproducible medians (3 samples each), July 8 2026. Gaudi: June 30 2026.*

Throughput comparison from the same historical data:

| Metric | CPU | Accelerator |
|--------|-----|-------------|
| Requests per second | 0.23 | 0.87 |
| Mean latency | 4.33s | 1.15s |
| Time to first token | 4204ms | 401ms |

### MAAS Throughput Stability (July 8)

A July 8 re-benchmark confirmed per-token generation speed is unchanged from
June 30 across all 4 CPU models (±5%). Infrastructure changes on RAC MAAS did
not affect inference throughput.

### Oberon Acceptance Data

Oberon is the current live validation target. The following measurements remain
pending until Oberon is deployed with all models:

- speculative decoding speedup (requires `granite-350m` draft model)
- INT8 speedup (requires `granite-2b-int8`)
- BitNet token latency (requires edge-agent pod)

Until those measurements are generated by the deployed endpoints, public copy
must avoid presenting those values as verified claims.

## Live Module Set

| Module | Status | Evidence Path |
|--------|--------|---------------|
| `semantic-routing` | Live | `/route` compatibility and router tests |
| `conditional-pipeline` | Live | Healthcare pipeline node logs |
| `mcp-tools` | Live | Gateway/tool responses and fallback data |
| `model-optimization` | Live | Model ladder and measured target-environment comparisons |
| `batch-processing` | Live | Redpanda/AMQ Streams event flow |
| `replica-scaling` | Live | Replica and concurrency tests |
| `adaptive-classification` | Live | Cold/warm cache benchmark |
| `benchmarking` | Live | `/api/v1/benchmark/models` and `/api/v1/benchmark/run` |
| `speculative-decoding` | Live | `/api/v1/speculative/status` and `/api/v1/speculative/run` |
| `edge-inference` | Live | `bitnet-server` service and BitNet inference checks |
| `heterogeneous-routing` | Live | Router complex-tier configuration |
| `multi-model-fusion` | Live | Panel plus structured judge fields |
| `cost-analysis` | Live | Estimate-labeled routing/cost model |
| `scale-testing` | Live | Concurrent request and throughput gates |
| `llmd-inference` | Roadmap | Manifests and prefix-caching direction only |

## Speculative Decoding

Speculative decoding is now an implemented feature path, not a planned label.
Oberon defines a vLLM service named `vllm-granite-2b-speculative`, exposed
through LiteLLM as `granite-2b-cpu-speculative`.

The worker uses:

- target model: `granite-2b-cpu`
- draft model: `granite-350m`
- method: `draft_model`
- speculative tokens: `5`

The healthcare agent exposes:

- `GET /api/v1/speculative/status`
- `POST /api/v1/speculative/run`

The run endpoint measures baseline `granite-2b-cpu` against
`granite-2b-cpu-speculative`, returns both outputs, records latency and token
counts, and calculates speedup. The public claim threshold defaults to `1.5x`.
If the measured result does not reach that threshold, the UI says
`configured and measured` rather than claiming a speedup.

## Multi-Model Fusion

Fusion is live when panel models and a judge model return real responses. The
judge output is structured, so downstream consumers can inspect:

- `consensus`
- `contradictions`
- `blind_spots`
- `synthesis`

This makes the module auditable. It no longer relies on a single free-form
judge paragraph as proof of behavior.

## Heterogeneous Routing

The semantic router exposes `/route` as the compatibility endpoint while keeping
`/classify` for existing callers. In Oberon mode, complex prompts route to the
Helm-configured complex tier. The default simulated complex tier is
`granite-4.1-8b` unless a real accelerator endpoint is configured.

This distinction matters: the platform can demonstrate routing behavior without
claiming accelerator performance where no accelerator endpoint is active.

## Edge Inference

The edge module now aligns naming across tests, services, and frontend proxying.
The Helm chart keeps the existing `edge-agent` service and adds `bitnet-server`
as the service alias expected by validation and lab copy.

BitNet latency and energy values from papers remain reference claims unless
they are measured on Oberon and marked verified in the claim registry.

## Secure Variant

The secure story uses support language. TDX, attestation, and confidential
containers can support or contribute to controls such as HIPAA, PHMSA, SOX,
NIST 800-171, and FedRAMP, but they do not satisfy those frameworks by
themselves. Full compliance still depends on operational controls, audit
processes, policy, access management, and organizational evidence.

## Reproducibility

Core local checks:

```bash
python -m pytest tests/contracts/
python -m pytest services/healthcare-agent/tests/
python -m pytest services/semantic-router/tests/
go test ./...
npm run build
npx vitest run
```

Full local checks also require Java 21, Maven, and Helm. The FinServ Quarkus
service expects system `mvn`; this repo intentionally does not vendor Maven
wrapper files.

Live benchmark checks:

```bash
python -m pytest tests/test_stage_9_benchmarks.py
python -m pytest tests/test_stage_9_module_benchmarks.py
```

Oberon acceptance:

```bash
helm template infrastructure/helm \
  --values infrastructure/oberon/values-oberon.yaml

python -m pytest tests/test_deployment.py
python -m pytest tests/test_virt_edge.py
python -m pytest tests/test_claim_accuracy.py
```

## Conclusion

Triforce is now structured around evidence rather than assertion. The benchmark
rubric covers the entire project, the white paper distinguishes historical data
from target-environment validation, and live module claims depend on endpoints
returning real measurements.

That is the enterprise pattern: route the work, measure the result, label the
claim, and let the platform decide what is live.
