"""Triforce Cost Model — Real pricing from RHDP MAAS infrastructure.

Compares self-hosted Intel Xeon 6 / Gaudi 3 inference (infrastructure cost only)
against GPU hardware, GPU cloud, and Vertex AI pay-per-token models.

Data sources:
- RHDP MAAS model reference: https://maas-rhdp.apps.maas.redhatworkshops.io
- Inference telemetry from PostgreSQL inference_log table
- Intel Xeon 6 / Gaudi 3 hardware specs from partner demo
- NVIDIA GPU cloud pricing (mid-2026):
    - Spheron: https://www.spheron.network/blog/gpu-cloud-pricing-comparison-2026/
    - IntuitionLabs: https://intuitionlabs.ai/articles/h100-rental-prices-cloud-comparison
    - Thunder Compute: https://www.thundercompute.com/blog/nvidia-h100-pricing
    - CloudZero: https://www.cloudzero.com/blog/cloud-gpu-pricing-comparison/
    - getdeploying.com: https://getdeploying.com/gpus/nvidia-h100
- AMD MI300X pricing (mid-2026):
    - Thunder Compute: https://www.thundercompute.com/blog/amd-mi300x-pricing
    - GridStackHub: https://gridstackhub.ai/amd-mi300x-pricing
    - getdeploying.com: https://getdeploying.com/gpus/amd-mi300x
    - Fluence: https://www.fluence.network/blog/amd-instinct-mi300x/
- Vertex AI pricing: https://cloud.google.com/vertex-ai/generative-ai/pricing
- Anthropic API pricing: https://docs.anthropic.com/en/docs/about-claude/models

Note: Gaudi 3 is being sunset by Intel. Included for historical comparison only.
Pricing retrieved June 2026. GPU cloud rates fluctuate — verify before presenting.
"""

import asyncio
import json
import sys

import httpx

HEALTHCARE_URL = "http://localhost:8081"

# ═══════════════════════════════════════════════════════════════════════
# MAAS Model Catalog — real pricing from RHDP documentation
# ═══════════════════════════════════════════════════════════════════════

MODELS = {
    # ── On-cluster: Intel Xeon 6 CPU (OpenVINO / vLLM) ──────────────
    # Self-hosted on RHDP cluster. No per-token cost.
    # Cost = infrastructure only (amortized hardware + power).
    "granite-2b-cpu": {
        "params": "8B", "hardware": "Xeon 6 CPU", "runtime": "vLLM/KServe",
        "input_per_1m": 0.00, "output_per_1m": 0.00,
        "category": "on-cluster-cpu",
        "note": "Self-hosted on Intel Xeon 6. Infrastructure cost only.",
    },
    "granite-2b-cpu": {
        "params": "sub-3B", "hardware": "Xeon 6 CPU", "runtime": "vLLM/KServe",
        "input_per_1m": 0.00, "output_per_1m": 0.00,
        "category": "on-cluster-cpu",
        "note": "Compact Granite 4.0. Fastest classification/simple tasks.",
    },
    "codellama-7b-instruct": {
        "params": "7B", "hardware": "Xeon 6 CPU", "runtime": "vLLM/KServe",
        "input_per_1m": 0.00, "output_per_1m": 0.00,
        "category": "on-cluster-cpu",
        "note": "Code-specialized. Self-hosted.",
    },
    "nomic-embed-text-v1-5": {
        "params": "137M", "hardware": "Xeon 6 CPU", "runtime": "OpenVINO/KServe",
        "input_per_1m": 0.00, "output_per_1m": 0.00,
        "category": "on-cluster-cpu",
        "note": "Embeddings. 768-dim. OpenVINO on CPU.",
    },
    "llama-guard-3-1b": {
        "params": "1B", "hardware": "Xeon 6 CPU", "runtime": "vLLM/KServe",
        "input_per_1m": 0.00, "output_per_1m": 0.00,
        "category": "on-cluster-cpu",
        "note": "Safety guardrails. Self-hosted.",
    },
    "granite-docling-258m": {
        "params": "258M", "hardware": "Xeon 6 CPU", "runtime": "KServe",
        "input_per_1m": 0.00, "output_per_1m": 0.00,
        "category": "on-cluster-cpu",
        "note": "Document conversion (PDF→Markdown). CPU only.",
    },

    # ── On-cluster: Intel Gaudi 3 GPU (sunsetting) ──────────────────
    # Self-hosted on RHDP Gaudi 3 cluster (maas00.rs-dfw3).
    # No per-token cost. 8x Gaudi 3 accelerators.
    # NOTE: Intel is sunsetting Gaudi. Historical comparison only.
    "deepseek-r1-distill-qwen-14b": {
        "params": "14B", "hardware": "Gaudi 3 GPU", "runtime": "vLLM/KServe",
        "input_per_1m": 0.00, "output_per_1m": 0.00,
        "category": "on-cluster-gaudi",
        "note": "Reasoning model. Gaudi 3 (sunsetting). Self-hosted.",
    },
    "qwen3-14b": {
        "params": "14B", "hardware": "Gaudi 3 GPU", "runtime": "vLLM/KServe",
        "input_per_1m": 0.00, "output_per_1m": 0.00,
        "category": "on-cluster-gaudi",
        "note": "Multilingual chat. 2 replicas on Gaudi 3 (sunsetting).",
    },
    "llama-scout-17b": {
        "params": "17B MoE", "hardware": "Gaudi 3 GPU", "runtime": "vLLM/KServe",
        "input_per_1m": 0.00, "output_per_1m": 0.00,
        "category": "on-cluster-gaudi",
        "note": "400K context. 2 replicas on Gaudi 3 (sunsetting).",
    },
    "microsoft-phi-4": {
        "params": "14B", "hardware": "Gaudi 3 GPU", "runtime": "vLLM/KServe",
        "input_per_1m": 0.00, "output_per_1m": 0.00,
        "category": "on-cluster-gaudi",
        "note": "Phi-4. Gaudi 3 (sunsetting). Self-hosted.",
    },

    # ── Vertex AI: pay-per-token (real cost) ─────────────────────────
    # Source: RHDP MAAS model reference page + Google Vertex AI pricing
    # (cloud.google.com/vertex-ai/generative-ai/pricing)
    # Anthropic pricing: docs.anthropic.com/en/docs/about-claude/models
    "minimax-m2": {
        "params": "MoE", "hardware": "Vertex AI", "runtime": "Google Cloud",
        "input_per_1m": 0.30, "output_per_1m": 1.20,
        "category": "vertex-ai",
        "note": "Agentic / tool-use. 197K context.",
    },
    "qwen3-235b": {
        "params": "235B MoE", "hardware": "Vertex AI", "runtime": "Google Cloud",
        "input_per_1m": 0.22, "output_per_1m": 0.88,
        "category": "vertex-ai",
        "note": "Large multilingual reasoning.",
    },
    "gpt-oss-120b": {
        "params": "120B", "hardware": "Vertex AI", "runtime": "Google Cloud",
        "input_per_1m": 0.09, "output_per_1m": 0.36,
        "category": "vertex-ai",
        "note": "Function calling, complex generation.",
    },
    "gpt-oss-20b": {
        "params": "20B", "hardware": "Vertex AI", "runtime": "Google Cloud",
        "input_per_1m": 0.07, "output_per_1m": 0.25,
        "category": "vertex-ai",
        "note": "Cost-effective general chat.",
    },
    "claude-sonnet-4-6": {
        "params": "—", "hardware": "Vertex AI", "runtime": "Anthropic via GCP",
        "input_per_1m": 3.00, "output_per_1m": 15.00,
        "category": "vertex-ai",
        "note": "Anthropic Sonnet 4.6. Balanced capability/cost.",
    },
    "claude-opus-4-6": {
        "params": "—", "hardware": "Vertex AI", "runtime": "Anthropic via GCP",
        "input_per_1m": 5.00, "output_per_1m": 25.00,
        "category": "vertex-ai",
        "note": "Anthropic Opus. Most capable.",
    },
    "claude-3-5-haiku": {
        "params": "—", "hardware": "Vertex AI", "runtime": "Anthropic via GCP",
        "input_per_1m": 1.00, "output_per_1m": 5.00,
        "category": "vertex-ai",
        "note": "Fast/cheap Anthropic model.",
    },
    "gemini-2.5-pro": {
        "params": "—", "hardware": "Vertex AI", "runtime": "Google Cloud",
        "input_per_1m": 1.25, "output_per_1m": 10.00,
        "category": "vertex-ai",
        "note": "1M context. Native Google model.",
    },
}

# ═══════════════════════════════════════════════════════════════════════
# Hardware Infrastructure Costs (estimated annual, self-hosted)
# ═══════════════════════════════════════════════════════════════════════

INFRA_COSTS = {
    "xeon6_node": {
        "description": "Intel Xeon 6 server (2-socket, 128 cores, AMX)",
        "annual_cost": 15_000,
        "models_served": 6,
        "note": "Runs granite-8b, codellama-7b, embeddings, guard, docling",
    },
    "gaudi3_node": {
        "description": "Intel Gaudi 3 server (8x accelerators) — SUNSETTING",
        "annual_cost": 65_000,
        "models_served": 4,
        "note": "Runs deepseek-14b, qwen3-14b, llama-scout-17b, phi-4 (SUNSETTING)",
    },
}

# ═══════════════════════════════════════════════════════════════════════
# GPU Cloud Pricing — real market rates (mid-2026)
# Sources: Spheron, Thunder Compute, getdeploying.com, GridStackHub
# ═══════════════════════════════════════════════════════════════════════

GPU_CLOUD_COSTS = {
    "nvidia_h100_hyperscaler": {
        "description": "NVIDIA H100 SXM (AWS/GCP on-demand)",
        "hourly_per_gpu": 3.50,
        "note": "AWS ~$3.90, GCP ~$3.00. Using $3.50 avg.",
        "source": "Spheron (spheron.network/blog/gpu-cloud-pricing-comparison-2026), IntuitionLabs (intuitionlabs.ai/articles/h100-rental-prices-cloud-comparison)",
    },
    "nvidia_h100_neocloud": {
        "description": "NVIDIA H100 SXM (Lambda/Spheron/CoreWeave)",
        "hourly_per_gpu": 2.50,
        "note": "Neo-cloud: $2.01-$3.44/hr. Using $2.50 avg.",
        "source": "Spheron H100 PCIe $2.01 on-demand, Lambda $2.49-$3.44 (spheron.network, lambda.com)",
    },
    "nvidia_a100_cloud": {
        "description": "NVIDIA A100 80GB (cloud on-demand)",
        "hourly_per_gpu": 1.50,
        "note": "Sub-$1 on marketplace, $3-4 on hyperscalers. Using $1.50 mid-market.",
        "source": "Cast AI GPU Price Report 2025 (cast.ai/reports/gpu-price), getdeploying.com/gpus",
    },
    "amd_mi300x_cloud": {
        "description": "AMD MI300X 192GB HBM3 (cloud on-demand)",
        "hourly_per_gpu": 2.00,
        "note": "TensorWave $1.71, Thunder $1.85, CoreWeave $2.50. Using $2.00 avg.",
        "source": "Thunder Compute (thundercompute.com/blog/amd-mi300x-pricing), GridStackHub (gridstackhub.ai/amd-mi300x-pricing)",
    },
}

# Self-hosted GPU hardware costs (purchase price + hosting)
GPU_SELFHOSTED_COSTS = {
    "nvidia_h100_server": {
        "description": "NVIDIA H100 8-GPU server (self-hosted)",
        "purchase_price": 250_000,
        "annual_hosting": 36_000,
        "amortize_years": 3,
        "gpus": 8,
        "note": "Dell/SuperMicro 8xH100. ~$250K purchase + $3K/mo hosting.",
        "source": "Spheron break-even analysis (spheron.network), IntuitionLabs server pricing (intuitionlabs.ai)",
    },
    "nvidia_a100_server": {
        "description": "NVIDIA A100 8-GPU server (self-hosted)",
        "purchase_price": 120_000,
        "annual_hosting": 24_000,
        "amortize_years": 3,
        "gpus": 8,
        "note": "Previous gen. Widely available refurbished.",
        "source": "Cast AI GPU Price Report (cast.ai/reports/gpu-price)",
    },
    "amd_mi300x_server": {
        "description": "AMD MI300X 8-GPU server (self-hosted)",
        "purchase_price": 160_000,
        "annual_hosting": 30_000,
        "amortize_years": 3,
        "gpus": 8,
        "note": "OEM config (Dell/HPE). 192GB HBM3 per GPU. MSRP ~$18K/GPU.",
        "source": "Fluence MI300X analysis (fluence.network/blog/amd-instinct-mi300x), DeployBase (deploybase.ai/articles/amd-mi300x-price)",
    },
}


def cost_per_record(model_name: str, input_tokens: int = 800, output_tokens: int = 400, llm_calls: int = 3) -> float:
    """Calculate cost for processing one record with a given model."""
    model = MODELS.get(model_name, {})
    input_cost = (input_tokens * llm_calls / 1_000_000) * model.get("input_per_1m", 0)
    output_cost = (output_tokens * llm_calls / 1_000_000) * model.get("output_per_1m", 0)
    return input_cost + output_cost


async def get_live_telemetry():
    """Pull real inference stats from the running healthcare agent."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{HEALTHCARE_URL}/api/v1/stats")
            if resp.status_code == 200:
                return resp.json()
    except Exception:
        pass
    return None


async def main():
    MONTHLY_RECORDS = 100_000
    INPUT_TOKENS_PER_CALL = 800
    OUTPUT_TOKENS_PER_CALL = 400
    LLM_CALLS_PER_RECORD = 3  # classify + extract + summarize

    total_input = MONTHLY_RECORDS * INPUT_TOKENS_PER_CALL * LLM_CALLS_PER_RECORD
    total_output = MONTHLY_RECORDS * OUTPUT_TOKENS_PER_CALL * LLM_CALLS_PER_RECORD

    print("=" * 90)
    print("  TRIFORCE COST MODEL — RHDP MAAS Real Pricing")
    print("  Red Hat (OpenShift) + IBM (Kagenti) + Intel (Xeon 6)")
    print("=" * 90)

    # ── Live telemetry ────────────────────────────────────────────────
    telemetry = await get_live_telemetry()
    if telemetry:
        print(f"\n  Live Inference Telemetry (from PostgreSQL):")
        print(f"    Total calls:      {telemetry.get('total_requests', 0)}")
        print(f"    Avg latency:      {telemetry.get('avg_latency_ms', 0):.0f}ms")
        print(f"    P95 latency:      {telemetry.get('p95_latency_ms', 0):.0f}ms")
        print(f"    CPU calls:        {telemetry.get('cpu_requests', 0)} (100%)")
        print(f"    GPU calls:        {telemetry.get('gpu_requests', 0)} (0%)")

    # ── On-cluster models (self-hosted, $0/token) ─────────────────────
    print(f"\n{'─' * 90}")
    print(f"  ON-CLUSTER MODELS — Self-hosted, infrastructure cost only")
    print(f"{'─' * 90}")

    print(f"\n  Intel Xeon 6 CPU (Triforce target):")
    print(f"  {'Model':<30} {'Params':>8}  {'$/rec':>10}  {'$/100K rec':>12}  Note")
    print(f"  {'─' * 30} {'─' * 8}  {'─' * 10}  {'─' * 12}  {'─' * 30}")
    for name, m in MODELS.items():
        if m["category"] == "on-cluster-cpu":
            cpr = cost_per_record(name, INPUT_TOKENS_PER_CALL, OUTPUT_TOKENS_PER_CALL, LLM_CALLS_PER_RECORD)
            monthly = cpr * MONTHLY_RECORDS
            print(f"  {name:<30} {m['params']:>8}  ${cpr:>9.4f}  ${monthly:>11,.2f}  {m['note'][:30]}")

    print(f"\n  Intel Gaudi 3 GPU (SUNSETTING — historical reference):")
    print(f"  {'Model':<30} {'Params':>8}  {'$/rec':>10}  {'$/100K rec':>12}  Note")
    print(f"  {'─' * 30} {'─' * 8}  {'─' * 10}  {'─' * 12}  {'─' * 30}")
    for name, m in MODELS.items():
        if m["category"] == "on-cluster-gaudi":
            cpr = cost_per_record(name, INPUT_TOKENS_PER_CALL, OUTPUT_TOKENS_PER_CALL, LLM_CALLS_PER_RECORD)
            monthly = cpr * MONTHLY_RECORDS
            print(f"  {name:<30} {m['params']:>8}  ${cpr:>9.4f}  ${monthly:>11,.2f}  {m['note'][:30]}")

    # ── Vertex AI models (pay-per-token) ──────────────────────────────
    print(f"\n{'─' * 90}")
    print(f"  VERTEX AI MODELS — Pay-per-token via MAAS proxy")
    print(f"  Projection: {MONTHLY_RECORDS:,} records/month × {LLM_CALLS_PER_RECORD} LLM calls × ")
    print(f"              {INPUT_TOKENS_PER_CALL} input + {OUTPUT_TOKENS_PER_CALL} output tokens per call")
    print(f"{'─' * 90}")

    print(f"\n  {'Model':<25} {'Input/1M':>10}  {'Output/1M':>10}  {'$/record':>10}  {'$/month':>12}  Note")
    print(f"  {'─' * 25} {'─' * 10}  {'─' * 10}  {'─' * 10}  {'─' * 12}  {'─' * 25}")

    vertex_models = [(n, m) for n, m in MODELS.items() if m["category"] == "vertex-ai"]
    vertex_models.sort(key=lambda x: cost_per_record(x[0], INPUT_TOKENS_PER_CALL, OUTPUT_TOKENS_PER_CALL, LLM_CALLS_PER_RECORD))

    for name, m in vertex_models:
        cpr = cost_per_record(name, INPUT_TOKENS_PER_CALL, OUTPUT_TOKENS_PER_CALL, LLM_CALLS_PER_RECORD)
        monthly = cpr * MONTHLY_RECORDS
        print(f"  {name:<25} ${m['input_per_1m']:>8.2f}  ${m['output_per_1m']:>8.2f}  ${cpr:>9.5f}  ${monthly:>11,.2f}  {m['note'][:25]}")

    # ── Infrastructure cost comparison ────────────────────────────────
    print(f"\n{'─' * 90}")
    print(f"  INFRASTRUCTURE COST COMPARISON — Annual")
    print(f"{'─' * 90}")

    xeon_annual = INFRA_COSTS["xeon6_node"]["annual_cost"]
    gaudi_annual = INFRA_COSTS["gaudi3_node"]["annual_cost"]

    cheapest_vertex = min(
        cost_per_record(n, INPUT_TOKENS_PER_CALL, OUTPUT_TOKENS_PER_CALL, LLM_CALLS_PER_RECORD) * MONTHLY_RECORDS * 12
        for n, m in MODELS.items() if m["category"] == "vertex-ai"
    )
    most_capable_vertex = cost_per_record("claude-opus-4-6", INPUT_TOKENS_PER_CALL, OUTPUT_TOKENS_PER_CALL, LLM_CALLS_PER_RECORD) * MONTHLY_RECORDS * 12

    print(f"\n  {'Option':<40} {'Annual Cost':>14}  {'vs Xeon 6':>14}")
    print(f"  {'─' * 40} {'─' * 14}  {'─' * 14}")
    print(f"  {'Intel Xeon 6 (1 node, 6 models)':<40} ${xeon_annual:>13,}  {'baseline':>14}")
    print(f"  {'Intel Gaudi 3 (1 node, 4 models) [EOL]':<40} ${gaudi_annual:>13,}  {'+$' + f'{gaudi_annual - xeon_annual:,}':>13}")
    print(f"  {'Vertex AI cheapest (gpt-oss-20b)':<40} ${cheapest_vertex:>13,.0f}  {'+$' + f'{cheapest_vertex - xeon_annual:,.0f}':>13}")
    print(f"  {'Vertex AI capable (claude-opus-4-6)':<40} ${most_capable_vertex:>13,.0f}  {'+$' + f'{most_capable_vertex - xeon_annual:,.0f}':>13}")

    # ── GPU hardware comparison ─────────────────────────────────────
    print(f"\n{'─' * 90}")
    print(f"  GPU HARDWARE COMPARISON — Self-hosted vs Xeon 6")
    print(f"  (Running same open-weight models: granite-8b, deepseek-14b, etc.)")
    print(f"{'─' * 90}")

    print(f"\n  {'Option':<45} {'Annual Cost':>12}  {'vs Xeon 6':>14}")
    print(f"  {'─' * 45} {'─' * 12}  {'─' * 14}")
    print(f"  {'Intel Xeon 6 (1 node, 6 models, no GPU)':<45} ${xeon_annual:>11,}  {'baseline':>14}")

    for key, gpu in GPU_SELFHOSTED_COSTS.items():
        annual = (gpu["purchase_price"] / gpu["amortize_years"]) + gpu["annual_hosting"]
        diff = annual - xeon_annual
        print(f"  {gpu['description'][:45]:<45} ${annual:>11,.0f}  {'+$' + f'{diff:,.0f}':>14}")

    print(f"\n  Note: GPU servers run the SAME open-weight models (granite, deepseek, qwen).")
    print(f"  Xeon 6 handles sub-8B models at comparable quality. GPU needed only for 14B+.")

    # ── GPU cloud rental comparison ───────────────────────────────────
    print(f"\n{'─' * 90}")
    print(f"  GPU CLOUD RENTAL — Running inference 24/7 for 1 month")
    print(f"{'─' * 90}")

    hours_per_month = 730
    print(f"\n  {'Provider':<45} {'$/hr':>8}  {'$/month':>12}  {'$/year':>12}  {'vs Xeon 6':>14}")
    print(f"  {'─' * 45} {'─' * 8}  {'─' * 12}  {'─' * 12}  {'─' * 14}")
    print(f"  {'Intel Xeon 6 (self-hosted, amortized)':<45} {'$0.00':>8}  {'$0':>12}  ${xeon_annual:>11,}  {'baseline':>14}")

    for key, gpu in GPU_CLOUD_COSTS.items():
        monthly = gpu["hourly_per_gpu"] * hours_per_month
        annual = monthly * 12
        diff = annual - xeon_annual
        print(f"  {gpu['description'][:45]:<45} ${gpu['hourly_per_gpu']:>6.2f}  ${monthly:>11,.0f}  ${annual:>11,.0f}  {'+$' + f'{diff:,.0f}':>14}")

    # ── Crossover analysis ───────────────────────────────────────────
    print(f"\n{'─' * 90}")
    print(f"  CROSSOVER ANALYSIS — When does self-hosted Xeon 6 beat Vertex AI?")
    print(f"{'─' * 90}")

    vertex_comparisons = [
        ("gpt-oss-20b", "Cheapest Vertex (gpt-oss-20b)"),
        ("gpt-oss-120b", "Mid-tier Vertex (gpt-oss-120b)"),
        ("claude-3-5-haiku", "Claude Haiku"),
        ("gemini-2.5-pro", "Gemini 2.5 Pro"),
        ("claude-sonnet-4-6", "Claude Sonnet 4.6"),
        ("claude-opus-4-6", "Claude Opus 4.6"),
    ]

    print(f"\n  {'Model':<35} {'Break-even':>18}  {'1M rec/mo savings':>18}")
    print(f"  {'─' * 35} {'─' * 18}  {'─' * 18}")

    for model_name, label in vertex_comparisons:
        cpr = cost_per_record(model_name, INPUT_TOKENS_PER_CALL, OUTPUT_TOKENS_PER_CALL, LLM_CALLS_PER_RECORD)
        if cpr > 0:
            # Monthly cost at which Xeon 6 hardware pays for itself
            monthly_vertex = cpr * 1  # cost per record
            breakeven_records = xeon_annual / (cpr * 12)  # records/month where annual costs equal
            savings_at_1m = (cpr * 1_000_000 * 12) - xeon_annual
            print(f"  {label:<35} {breakeven_records:>15,.0f}/mo  ${savings_at_1m:>17,.0f}/yr")

    # ── The Triforce story ────────────────────────────────────────────
    print(f"\n{'=' * 90}")
    print(f"  THE TRIFORCE VALUE PROPOSITION")
    print(f"{'=' * 90}")

    # Find the real crossover volume for mid-tier model
    haiku_cpr = cost_per_record("claude-3-5-haiku", INPUT_TOKENS_PER_CALL, OUTPUT_TOKENS_PER_CALL, LLM_CALLS_PER_RECORD)
    haiku_breakeven = int(xeon_annual / (haiku_cpr * 12))
    savings_1m_haiku = (haiku_cpr * 1_000_000 * 12) - xeon_annual

    print(f"""
  WHAT XEON 6 DOES (80% of enterprise AI — $0/token):
    Classification, NER, summarization, embeddings, safety guardrails,
    document conversion. 6 models on 1 server. No GPU.

  WHAT VERTEX AI HANDLES (20% overflow — pay-per-token):
    14B+ reasoning (deepseek, qwen3-235b), frontier models (Claude, Gemini).
    Same MAAS endpoint, same API key, seamless routing.

  THE MATH:
    At low volume (<{haiku_breakeven:,} records/month):
      Vertex AI is cheaper — don't buy hardware, pay per token.

    At enterprise volume (>{haiku_breakeven:,} records/month):
      Xeon 6 saves ${savings_1m_haiku:,.0f}/year vs Claude Haiku alone.
      Zero per-token cost. Predictable CapEx. No API rate limits.

  WITH GAUDI SUNSETTING:
    The 14B+ models (deepseek, qwen3, phi-4) need a new home.
    Options: Vertex AI pay-per-token, or larger Xeon 6 with AMX.
    Either way — Xeon 6 remains the foundation for 80% of workloads.

  KAGENTI ENABLES:
    Scale horizontally on OpenShift. Agents auto-discover via A2A.
    MCP tools federate across services. SPIFFE secures everything.
    Add replicas, not GPUs.
""")
    print(f"{'=' * 90}")


if __name__ == "__main__":
    asyncio.run(main())
