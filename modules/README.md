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

| Module | Focus | Audience | Status |
|--------|-------|----------|--------|
| benchmarking | Model × Task × Hardware comparison | Performance Engineer | building |
| speculative-decoding | 2-3x speedup via draft model | ML Engineer | planned |
| heterogeneous-routing | CPU→GPU intelligent routing | Platform Architect | planned |
| multi-model-fusion | Panel+judge for critical decisions | Compliance, Clinical | planned |

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
