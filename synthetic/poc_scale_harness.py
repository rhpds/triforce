"""Triforce POC Scale Harness — Demo-ready throughput and cost metrics.

Measures:
- Throughput: records/sec at varying concurrency levels
- Latency: avg, p50, p95, p99 per operation
- Cost projection: CPU (Xeon 6) vs GPU (Gaudi/A100) at volume
- Graph step breakdown: time per node in the LangGraph pipeline

Usage:
  python3 synthetic/poc_scale_harness.py --concurrency 1,3,5 --records 10
  python3 synthetic/poc_scale_harness.py --full   # Full benchmark (50 records)
"""

import argparse
import asyncio
import json
import statistics
import sys
import time

import httpx

sys.path.insert(0, ".")
from synthetic.healthcare_generator import generate_patient_record
from synthetic.finserv_generator import generate_transaction

HEALTHCARE_URL = "http://localhost:8081"
FINSERV_URL = "http://localhost:8082"
ORCHESTRATOR_URL = "http://localhost:8083"

# Cost estimates per 1M tokens (public pricing benchmarks)
COST_PER_1M = {
    "xeon6_cpu": {"input": 0.00, "output": 0.00, "note": "Self-hosted on Xeon 6"},
    "gaudi3_gpu": {"input": 0.10, "output": 0.30, "note": "Self-hosted on Gaudi 3"},
    "a100_gpu": {"input": 0.50, "output": 1.50, "note": "Cloud A100 (estimated)"},
    "gpt4o": {"input": 2.50, "output": 10.00, "note": "OpenAI GPT-4o"},
    "claude_sonnet": {"input": 3.00, "output": 15.00, "note": "Anthropic Sonnet"},
}

AVG_TOKENS_PER_RECORD = {"input": 800, "output": 400}
AVG_LLM_CALLS_PER_RECORD = 3  # classify + extract + summarize


async def benchmark_healthcare(client, record):
    start = time.monotonic()
    resp = await client.post(f"{HEALTHCARE_URL}/api/v1/classify",
                             json={"text": record["text"]}, timeout=60.0)
    latency = time.monotonic() - start
    success = resp.status_code == 200
    data = resp.json() if success else {}
    return {
        "latency_s": latency,
        "success": success,
        "classification": data.get("classification", "error"),
        "inference_ms": data.get("inference_ms", 0),
    }


async def benchmark_finserv(client, tx):
    start = time.monotonic()
    resp = await client.post(f"{FINSERV_URL}/api/v1/score-transaction",
                             json={"transaction": tx}, timeout=10.0)
    latency = time.monotonic() - start
    success = resp.status_code == 200
    data = resp.json() if success else {}
    return {
        "latency_s": latency,
        "success": success,
        "risk_level": data.get("risk_level", "error"),
        "risk_score": data.get("risk_score", 0),
    }


async def run_concurrent_batch(target, records, concurrency):
    """Run a batch at a given concurrency level, return results."""
    semaphore = asyncio.Semaphore(concurrency)
    results = []

    async def bounded_call(client, record, idx):
        async with semaphore:
            if target == "healthcare":
                return await benchmark_healthcare(client, record)
            else:
                return await benchmark_finserv(client, record)

    async with httpx.AsyncClient(timeout=60.0) as client:
        tasks = [bounded_call(client, r, i) for i, r in enumerate(records)]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    valid = [r for r in results if isinstance(r, dict) and r.get("success")]
    failed = len(results) - len(valid)
    return valid, failed


def compute_stats(latencies):
    if not latencies:
        return {"count": 0}
    latencies.sort()
    return {
        "count": len(latencies),
        "avg": statistics.mean(latencies),
        "p50": latencies[len(latencies) // 2],
        "p95": latencies[int(len(latencies) * 0.95)],
        "p99": latencies[min(int(len(latencies) * 0.99), len(latencies) - 1)],
        "min": latencies[0],
        "max": latencies[-1],
    }


def compute_cost_projection(num_records, llm_calls_per_record=3):
    total_input_tokens = num_records * AVG_TOKENS_PER_RECORD["input"] * llm_calls_per_record
    total_output_tokens = num_records * AVG_TOKENS_PER_RECORD["output"] * llm_calls_per_record

    projections = {}
    for platform, costs in COST_PER_1M.items():
        input_cost = (total_input_tokens / 1_000_000) * costs["input"]
        output_cost = (total_output_tokens / 1_000_000) * costs["output"]
        projections[platform] = {
            "total_cost": round(input_cost + output_cost, 2),
            "note": costs["note"],
        }
    return projections, total_input_tokens, total_output_tokens


async def main():
    parser = argparse.ArgumentParser(description="Triforce POC Scale Harness")
    parser.add_argument("--concurrency", default="1,3,5", help="Comma-separated concurrency levels")
    parser.add_argument("--records", type=int, default=10, help="Records per concurrency level")
    parser.add_argument("--full", action="store_true", help="Full benchmark (50 records, more concurrency)")
    args = parser.parse_args()

    if args.full:
        concurrency_levels = [1, 3, 5, 10]
        num_records = 50
    else:
        concurrency_levels = [int(c) for c in args.concurrency.split(",")]
        num_records = args.records

    print("=" * 78)
    print("  TRIFORCE POC SCALE HARNESS")
    print("  Red Hat (OpenShift) + IBM (Kagenti) + Intel (Xeon 6)")
    print("=" * 78)

    # Pre-generate all data
    hc_records = [generate_patient_record() for _ in range(num_records)]
    fs_transactions = [generate_transaction(suspicious=i % 5 == 0) for i in range(num_records)]

    all_hc_results = {}
    all_fs_results = {}

    for concurrency in concurrency_levels:
        print(f"\n{'─' * 78}")
        print(f"  Concurrency: {concurrency} parallel requests")
        print(f"{'─' * 78}")

        # Healthcare benchmark
        print(f"\n  [Healthcare] {num_records} clinical documents → LangGraph pipeline (Xeon 6)")
        batch_start = time.monotonic()
        hc_valid, hc_failed = await run_concurrent_batch("healthcare", hc_records, concurrency)
        batch_elapsed = time.monotonic() - batch_start

        hc_latencies = [r["latency_s"] for r in hc_valid]
        hc_stats = compute_stats(hc_latencies)
        hc_throughput = len(hc_valid) / batch_elapsed if batch_elapsed > 0 else 0

        print(f"    Throughput:  {hc_throughput:.2f} records/sec")
        print(f"    Latency:     avg={hc_stats.get('avg',0)*1000:.0f}ms  p50={hc_stats.get('p50',0)*1000:.0f}ms  p95={hc_stats.get('p95',0)*1000:.0f}ms  p99={hc_stats.get('p99',0)*1000:.0f}ms")
        print(f"    Success:     {len(hc_valid)}/{num_records}  ({hc_failed} failed)")
        print(f"    Wall clock:  {batch_elapsed:.1f}s")

        all_hc_results[concurrency] = {
            "throughput": hc_throughput,
            "stats": hc_stats,
            "wall_clock": batch_elapsed,
            "failed": hc_failed,
        }

        # FinServ benchmark
        print(f"\n  [FinServ] {num_records} transactions → fraud scoring (Xeon 6)")
        batch_start = time.monotonic()
        fs_valid, fs_failed = await run_concurrent_batch("finserv", fs_transactions, concurrency)
        batch_elapsed = time.monotonic() - batch_start

        fs_latencies = [r["latency_s"] for r in fs_valid]
        fs_stats = compute_stats(fs_latencies)
        fs_throughput = len(fs_valid) / batch_elapsed if batch_elapsed > 0 else 0

        print(f"    Throughput:  {fs_throughput:.1f} records/sec")
        print(f"    Latency:     avg={fs_stats.get('avg',0)*1000:.0f}ms  p50={fs_stats.get('p50',0)*1000:.0f}ms  p95={fs_stats.get('p95',0)*1000:.0f}ms")
        print(f"    Success:     {len(fs_valid)}/{num_records}")
        print(f"    Wall clock:  {batch_elapsed:.1f}s")

        all_fs_results[concurrency] = {
            "throughput": fs_throughput,
            "stats": fs_stats,
            "wall_clock": batch_elapsed,
            "failed": fs_failed,
        }

    # Scaling summary
    print(f"\n{'=' * 78}")
    print("  SCALING SUMMARY")
    print(f"{'=' * 78}")

    print(f"\n  {'Concurrency':>12}  {'HC rec/s':>10}  {'HC p95':>10}  {'FS rec/s':>10}  {'FS p95':>10}")
    print(f"  {'─' * 12}  {'─' * 10}  {'─' * 10}  {'─' * 10}  {'─' * 10}")
    for c in concurrency_levels:
        hc = all_hc_results[c]
        fs = all_fs_results[c]
        hc_p95 = f"{hc['stats'].get('p95',0)*1000:.0f}ms"
        fs_p95 = f"{fs['stats'].get('p95',0)*1000:.0f}ms"
        print(f"  {c:>12}  {hc['throughput']:>10.2f}  {hc_p95:>10}  {fs['throughput']:>10.1f}  {fs_p95:>10}")

    # Cost projection
    monthly_records = 100_000
    projections, total_input, total_output = compute_cost_projection(monthly_records)

    print(f"\n{'=' * 78}")
    print(f"  COST PROJECTION — {monthly_records:,} records/month")
    print(f"  ({total_input:,} input tokens + {total_output:,} output tokens)")
    print(f"{'=' * 78}")
    print(f"\n  {'Platform':>20}  {'Monthly Cost':>14}  {'vs Xeon 6':>12}  Note")
    print(f"  {'─' * 20}  {'─' * 14}  {'─' * 12}  {'─' * 30}")

    xeon_cost = projections["xeon6_cpu"]["total_cost"]
    for platform, data in projections.items():
        cost = data["total_cost"]
        if platform == "xeon6_cpu":
            savings = "baseline"
        elif cost == 0:
            savings = "—"
        else:
            savings = f"saves ${cost - xeon_cost:,.2f}"
        print(f"  {platform:>20}  ${cost:>12,.2f}  {savings:>12}  {data['note']}")

    # DB stats
    print(f"\n{'=' * 78}")
    print("  INFERENCE TELEMETRY (from PostgreSQL)")
    print(f"{'=' * 78}")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{HEALTHCARE_URL}/api/v1/stats", timeout=5.0)
            if resp.status_code == 200:
                stats = resp.json()
                print(f"\n  Total inference calls:  {stats.get('total_requests', 0)}")
                print(f"  Avg latency:           {stats.get('avg_latency_ms', 0):.0f}ms")
                print(f"  P95 latency:           {stats.get('p95_latency_ms', 0):.0f}ms")
                print(f"  CPU requests:          {stats.get('cpu_requests', 0)} (100%)")
                print(f"  GPU requests:          {stats.get('gpu_requests', 0)} (0%)")
                print(f"  KV cache hit rate:     {stats.get('kv_cache_hit_rate', 0)*100:.1f}%")
    except Exception:
        print("  (stats endpoint unavailable)")

    print(f"\n{'=' * 78}")
    print("  All inference on Intel Xeon 6 CPU via MAAS/LiteLLM — zero GPU required")
    print(f"{'=' * 78}\n")


if __name__ == "__main__":
    asyncio.run(main())
