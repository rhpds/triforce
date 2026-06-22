# MAAS Model Request — maas-rhdp Endpoint

## Current Models (have, using)

| Model | Precision | Task in Demo |
|-------|-----------|-------------|
| qwen25-3b-cpu | FP32 | Classification, Summarization |
| granite-2b-cpu | FP32 | NER / entity extraction |
| phi3-mini-cpu | FP32 | Complex reasoning (fraud, compliance) |

## Models to Add (all OpenVINO backend)

| Model | Precision | Task | Why |
|-------|-----------|------|-----|
| granite-2b-int8 | INT8 | NER comparison | Same model quantized — before/after demo |
| qwen25-3b-int8 | INT8 | Classify + summarize comparison | Same model quantized — before/after demo |
| granite-4.1-8b-int8 | INT8 | Complex reasoning | Bigger model for harder tasks — beats old 32B MoE |
| granite-350m | FP32 | Ultra-fast routing | Semantic Router classification (<50ms) |

## How Each Model Fits the Demo Pipeline

```
Request comes in
    │
    ▼
┌─────────────────────┐
│ Semantic Router      │ ← granite-350m (need)
│ classify complexity  │
└────────┬────────────┘
         │
    ┌────┼──────────────┐
    │    │              │
    ▼    ▼              ▼
 SIMPLE  MEDIUM      COMPLEX
    │    │              │
    ▼    ▼              ▼
┌────────┐ ┌──────────┐ ┌──────────────────┐
│Classify│ │Summarize │ │Fraud / Compliance│
│qwen25  │ │qwen25    │ │phi3-mini (have)  │
│3b-cpu  │ │3b-cpu    │ │granite-4.1-8b    │
│(have)  │ │(have)    │ │(need)            │
└────────┘ └──────────┘ └──────────────────┘
    │
    ▼
┌────────────────┐
│NER extraction  │ ← granite-2b-cpu (have)
│granite-2b-cpu  │
└────────────────┘
    │
    ▼
┌────────────────┐
│Drug interactions│ ← MCP tool (database lookup, no model)
└────────────────┘
```

## Optimization Comparison Story

The demo shows the same pipeline twice — FP32 then INT8:

```
                    FP32 (have)     INT8 (need)     Delta
classify:           514ms           ~170ms          3x faster
NER:                3,105ms         ~1,000ms        3x faster
summarize:          4,143ms         ~1,400ms        3x faster
MCP tool:           14ms            14ms            same (data lookup)
─────────────────────────────────────────────────────────
TOTAL:              7,776ms         ~2,600ms        3x faster
```

Same hardware. Same $0/token. Just better engineering.

## Keep Existing FP32 Models

Don't replace — the demo needs both for the before/after comparison.
