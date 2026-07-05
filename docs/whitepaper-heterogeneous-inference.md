# Heterogeneous AI Inference at Enterprise Scale

**Red Hat + Intel + IBM Technical White Paper**
**Technical Draft - July 2026**

## Evidence Model

This paper uses the same evidence model as `tests/benchmark_rubric.yaml`:

| Label | Meaning |
|-------|---------|
| Measured | Produced by a live endpoint or benchmark command in the named environment |
| Reported | Provided by another team and not independently re-measured here |
| Estimated | Calculated from assumptions or extrapolated from measurements |
| Roadmap | Designed or documented, but not live evidence |

Oberon/OpenShift validation is the authority for current Triforce live claims.
Historical MAAS CPU/Gaudi data remains useful comparison material, but a MAAS
number does not automatically verify an Oberon module claim.

## Executive Summary

Triforce demonstrates a benchmark-driven pattern for enterprise AI inference:

- route each prompt to the right model or tier,
- keep simple work on owned CPU infrastructure when it meets quality and latency
  requirements,
- escalate complex work to a configured complex tier,
- validate every optimization module with tests and live endpoints,
- publish only claims that are measured in the target environment.

The project now contains 15 pluggable modules. Fourteen are live. `llmd-inference`
remains roadmap.

## Architecture

```text
Clients and UI
    |
    +--> Semantic Router
    |       /route and /classify
    |       simple -> CPU model
    |       medium -> CPU model
    |       complex -> configured complex tier
    |
    +--> Healthcare Agent
    |       /api/v1/pipeline
    |       /api/v1/benchmark/run
    |       /api/v1/fusion
    |       /api/v1/speculative/status
    |       /api/v1/speculative/run
    |
    +--> FinServ Agent
    |       fraud scoring
    |       compliance reasoning
    |       risk assessment
    |
    +--> Orchestrator
    |       A2A discovery
    |       workflow coordination
    |
    +--> MCP Gateway
            FHIR, risk, and platform tools

LiteLLM presents model aliases through one OpenAI-compatible API.
Oberon backs those aliases with local OVMS and vLLM services.
```

## Current Oberon Model Roster

| Alias | Role |
|-------|------|
| `granite-350m` | fast classification and speculative draft |
| `granite-4-0-h-tiny-cpu` | small CPU model compatibility alias |
| `granite-2b-cpu` | NER, fraud scoring, speculative baseline target |
| `granite-2b-cpu-speculative` | LiteLLM alias for vLLM speculative worker |
| `granite-2b-int8` | AMX/INT8 optimization path |
| `qwen25-3b-cpu` | classification and summarization |
| `granite-4.1-3b` | next-gen classification and tool reasoning |
| `phi3-mini-cpu` | reasoning tier |
| `granite-3-2-8b-instruct-cpu` | fusion judge and complex reasoning |
| `granite-4.1-8b` | Oberon simulated complex tier |

The speculative service is separate from the OVMS roster because it is a vLLM
serving behavior, not just a model alias. LiteLLM exposes it as
`granite-2b-cpu-speculative`.

## Benchmark Authority

`tests/benchmark_rubric.yaml` is the project benchmark authority. It covers:

- local static checks,
- full local checks with Java 21, Maven, and Helm,
- historical live MAAS checks,
- Oberon live acceptance checks,
- all 15 module manifests and their benchmark keys,
- model aliases and acceptance placeholders,
- claim thresholds for speculative decoding, INT8, adaptive cache, and edge
  latency references.

The file intentionally separates measured baselines from placeholders. A null
Oberon baseline means the feature is configured but still needs a fresh target
measurement before public claims can be marked verified.

## Historical CPU/Gaudi Measurements

The following data is retained as historical measured comparison data. It should
be used to explain routing economics and workload placement, not as proof of
current Oberon module performance.

| Task | CPU Model | CPU Latency | Accelerator Model | Accelerator Latency | Observation |
|------|-----------|-------------|-------------------|---------------------|-------------|
| Classification | `qwen25-3b-cpu` | 779ms | `granite-3-2-8b-instruct` | 500ms | Both acceptable for document type |
| NER | `granite-2b-cpu` | 6248ms | `microsoft-phi-4` | 3809ms | Accelerator captured more detail |
| Summarization | `granite-2b-cpu` | 5208ms | `gpt-oss-20b` | 1572ms | Accelerator output was more detailed |
| Compliance reasoning | `granite-2b-cpu` | 3537ms | `microsoft-phi-4` | 1692ms | Accelerator cited AML details |
| Differential diagnosis | `granite-3-2-8b-instruct-cpu` | 14817ms | `gpt-oss-120b` | 1465ms | Accelerator output had stronger reasoning |

Throughput comparison:

| Metric | CPU | Accelerator |
|--------|-----|-------------|
| Requests per second | 0.23 | 0.87 |
| Mean latency | 4.33s | 1.15s |
| Time to first token | 4204ms | 401ms |

## Live Module Validation

| Module | Evidence Gate |
|--------|---------------|
| Semantic routing | `/route` returns route, model, confidence, hardware, latency |
| Conditional pipeline | Pipeline inference log shows skipped or executed interaction node |
| MCP tools | Gateway and fallback tools return structured responses |
| Model optimization | Model ladder and INT8 comparison measured in target environment |
| Batch processing | Kafka/Redpanda topics carry healthcare and FinServ flows |
| Replica scaling | Replica counts and concurrent request behavior validated |
| Adaptive classification | Warm cache returns below threshold after repeated calls |
| Benchmarking | Model listing and benchmark run endpoints return measured metrics |
| Speculative decoding | Status and run endpoints compare baseline vs speculative alias |
| Edge inference | `bitnet-server` service alias and inference endpoint respond |
| Heterogeneous routing | Complex prompts route to configured complex tier |
| Multi-model fusion | Panel and judge complete with structured judge fields |
| Cost analysis | Estimates clearly labeled and tied to routing mix |
| Scale testing | Concurrent workload tests complete within configured timeouts |
| llm-d inference | Roadmap only; no live badge until endpoint validation exists |

## Speculative Decoding Design

The plan is implemented through a dedicated vLLM worker:

```text
Service: vllm-granite-2b-speculative
LiteLLM alias: granite-2b-cpu-speculative
Target model: granite-2b-cpu
Draft model: granite-350m
Method: draft_model
Speculative tokens: 5
```

Healthcare exposes:

```text
GET  /api/v1/speculative/status
POST /api/v1/speculative/run
```

The run endpoint returns:

- baseline model name,
- speculative model name,
- measured latency for both paths,
- output tokens for both paths,
- output text for both paths,
- computed speedup,
- claim threshold,
- user-facing message.

The threshold defaults to `1.5x`. If a run does not meet the threshold, the
feature remains live, but the claim becomes `configured and measured`.

## Fusion Design

Fusion is live only when the panel and judge return real model responses. The
judge now returns stable fields:

```text
consensus
contradictions
blind_spots
synthesis
```

That structure allows tests, frontend components, and review workflows to check
whether the judge actually performed the expected comparison.

## Heterogeneous Routing Design

The router keeps `/classify` for existing callers and exposes `/route` as the
compatible endpoint used by deployment validation. Its complex-tier model is
configured through Helm. Oberon defaults to `granite-4.1-8b` as a simulated
complex tier unless a real accelerator endpoint is configured.

This lets the demo prove routing behavior independently from accelerator
availability.

## Edge Inference Design

The edge module now uses consistent service naming:

- deployment: `edge-agent`
- compatibility service: `edge-agent`
- canonical service alias: `bitnet-server`
- model alias: `bitnet-2b4t`

Validation calls `bitnet-server:8080`. Public latency and energy numbers remain
paper references until measured on Oberon and marked verified in the claim
registry.

## Compliance Language

Secure and confidential-computing content must use precise compliance language.
TDX and attestation can support or contribute to frameworks such as HIPAA,
PHMSA, SOX, NIST 800-171, and FedRAMP. They do not satisfy those frameworks by
themselves. Full compliance requires operational controls, audit evidence,
access management, policies, and process.

## Reproducibility

Local static validation:

```bash
python -m pytest tests/contracts/
python -m pytest services/healthcare-agent/tests/
python -m pytest services/semantic-router/tests/
go test ./...
npm run build
npx vitest run
python -m pytest tests/test_claim_accuracy.py::TestClaimRegistry
```

Full local validation adds:

```bash
python -m pytest tests/test_stage_8_modules.py
```

Helm-dependent tests skip locally when `helm` is not installed. In CI or a
deployment workstation, Helm should be installed and those cases should pass.

Oberon validation:

```bash
helm template infrastructure/helm \
  --values infrastructure/oberon/values-oberon.yaml

python -m pytest tests/test_deployment.py
python -m pytest tests/test_virt_edge.py
python -m pytest tests/test_claim_accuracy.py
```

## Conclusion

Triforce now tells a stronger story because the benchmark file, white paper,
frontend, labs, Helm, and validation tests agree:

- 15 modules are tracked.
- every non-roadmap module is live.
- `llmd-inference` remains roadmap.
- speculative decoding is implemented and measured through endpoints.
- fusion returns structured judge evidence.
- heterogeneous routing uses configured module values.
- edge naming is consistent.
- public claims depend on target-environment measurement.

The result is a demo and lab that can be defended technically: every important
claim has a place to be measured, verified, or downgraded to configured,
estimated, reported, or roadmap.
