# Triforce Modules — Pluggable Optimization Library

Each module is an independent optimization technique that can be enabled per deployment.
Cities and events pick the modules that match their audience.

## Module Structure

```
modules/
  <module-name>/
    module.yaml          # Manifest: description, dependencies, helm values
    helm/                # Helm value overrides + optional templates
      values.yaml        # Default values when module is enabled
    content/             # Antora showroom content
      modules/ROOT/pages/
        explore-<name>.adoc   # Lab exercise
    scripts/             # Setup/benchmark/demo scripts
```

## Available Modules

### Per-Record Efficiency
| Module | Focus | Audience | Status |
|--------|-------|----------|--------|
| semantic-routing | Embedding-based routing to right-sized model | Platform Architect | live |
| conditional-pipeline | Skip inference steps not needed per record | ML Engineer | live |
| mcp-tools | Database lookup (16ms) instead of LLM call (3-8s) | ML Engineer | live |

### Model Optimization
| Module | Focus | Audience | Status |
|--------|-------|----------|--------|
| model-optimization | INT8 quantization, AMX, optimized variants | Performance Engineer | live |

### Fleet-Scale Throughput
| Module | Focus | Audience | Status |
|--------|-------|----------|--------|
| batch-processing | AMQ Streams async event streaming at volume | Data Engineer | live |
| replica-scaling | Agent + model serving replica scaling | SRE | live |
| llmd-inference | Disaggregated prefill/decode across nodes | Performance Engineer | roadmap |

### Compounding Over Time
| Module | Focus | Audience | Status |
|--------|-------|----------|--------|
| adaptive-classification | Cache learns from LLM results, compounds with volume | Data Engineer | live |

### Heterogeneous Compute (new)
| Module | Focus | Audience | Status |
|--------|-------|----------|--------|
| benchmarking | Model × Task × Hardware comparison matrix | Performance Engineer | building |
| heterogeneous-routing | CPU→GPU intelligent routing | Platform Architect | building |
| multi-model-fusion | Panel+judge for critical decisions | Compliance | building |
| speculative-decoding | 2-3x speedup via draft model | ML Engineer | planned |

### Analysis
| Module | Focus | Audience | Status |
|--------|-------|----------|--------|
| cost-analysis | CPU vs GPU vs Cloud API cost comparison | Decision Maker | live |
| scale-testing | Concurrent load testing, throughput ceiling | SRE | live |

## How Modules are Governed

1. **Helm flags** enable/disable each module: `--set modules.benchmarking.enabled=true`
2. **AgnosticV configs** per city/event select which modules to deploy
3. **Showroom content** per module is conditionally included based on enabled modules
4. **Frontend** reads enabled modules and shows only relevant efficiency mechanisms

## Composing for a City

```yaml
# agnosticv example: Summit Boston (performance-focused)
quickstart_deploy_via_make_params:
  EXTRA_HELM_ARGS: >-
    --set modules.benchmarking.enabled=true
    --set modules.speculative.enabled=true
    --set modules.heterogeneous.enabled=true
```
