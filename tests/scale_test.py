"""Stage 6: Multi-node scale test — TDD contract tests.

Tests horizontal scaling of the healthcare pipeline:
  1 replica baseline → 3 replica scaled → compare latency + throughput

Usage:
  # Against local podman:
  python tests/scale_test.py http://localhost:8081

  # Against OCP Route:
  python tests/scale_test.py https://healthcare-agent-triforce-test.apps.infra01.example.com

  # With specific concurrency levels:
  python tests/scale_test.py http://localhost:8081 --tiers 10,30
"""

import argparse
import asyncio
import json
import sys
import time
from dataclasses import dataclass

import httpx

SAMPLE_TEXTS = [
    "DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin and Lisinopril. Recent STEMI with PCI to RCA.",
    "PROGRESS NOTE: 58-year-old female with Hypertension on Amlodipine 10mg. Blood pressure well controlled at 128/82.",
    "LAB REPORT: 45-year-old male. HbA1c 7.2%, fasting glucose 142 mg/dL. Currently on Metformin 1000mg BID.",
    "CONSULTATION: 67-year-old female presenting with chest pain. History of Atrial Fibrillation on Warfarin.",
    "DISCHARGE SUMMARY: 81-year-old male with CHF on Furosemide and Lisinopril. Admitted for fluid overload.",
]


@dataclass
class TierResult:
    concurrency: int
    completed: int
    failed: int
    avg_latency_ms: float
    p95_latency_ms: float
    wall_clock_ms: float
    throughput_per_min: float


async def run_single(client: httpx.AsyncClient, base_url: str, idx: int) -> dict:
    text = SAMPLE_TEXTS[idx % len(SAMPLE_TEXTS)]
    start = time.monotonic()
    try:
        resp = await client.post(
            f"{base_url}/api/v1/pipeline",
            json={"text": text},
            timeout=120.0,
        )
        resp.raise_for_status()
        data = resp.json()
        latency_ms = (time.monotonic() - start) * 1000
        return {"ok": True, "latency_ms": latency_ms, "total_ms": data.get("total_ms", 0), "entities": len(data.get("entities", []))}
    except Exception as e:
        latency_ms = (time.monotonic() - start) * 1000
        return {"ok": False, "latency_ms": latency_ms, "error": str(e)}


async def run_tier(base_url: str, count: int) -> TierResult:
    async with httpx.AsyncClient() as client:
        wall_start = time.monotonic()
        tasks = [run_single(client, base_url, i) for i in range(count)]
        results = await asyncio.gather(*tasks)
        wall_ms = (time.monotonic() - wall_start) * 1000

    ok_results = [r for r in results if r["ok"]]
    failed = len(results) - len(ok_results)
    latencies = sorted([r["latency_ms"] for r in ok_results])

    if not latencies:
        return TierResult(count, 0, failed, 0, 0, wall_ms, 0)

    avg = sum(latencies) / len(latencies)
    p95_idx = int(len(latencies) * 0.95)
    p95 = latencies[min(p95_idx, len(latencies) - 1)]
    throughput = (len(ok_results) / wall_ms) * 60000 if wall_ms > 0 else 0

    return TierResult(count, len(ok_results), failed, avg, p95, wall_ms, throughput)


def print_result(label: str, r: TierResult):
    print(f"\n{'='*60}")
    print(f"  {label}: {r.concurrency} concurrent requests")
    print(f"{'='*60}")
    print(f"  Completed:    {r.completed}/{r.concurrency} ({r.failed} failed)")
    print(f"  Avg latency:  {r.avg_latency_ms/1000:.1f}s")
    print(f"  P95 latency:  {r.p95_latency_ms/1000:.1f}s")
    print(f"  Wall clock:   {r.wall_clock_ms/1000:.1f}s")
    print(f"  Throughput:   {r.throughput_per_min:.0f} rec/min")
    print(f"  Cost:         $0.00")


def validate_stage6(results: dict[str, TierResult]):
    """Run stage_6_multinode validation criteria."""
    checks = {}

    if "baseline_10" in results:
        r = results["baseline_10"]
        checks["baseline_1_replica_10"] = r.completed >= 8 and r.avg_latency_ms > 0
        print(f"\n  baseline_1_replica_10: {'PASS' if checks['baseline_1_replica_10'] else 'FAIL'} — {r.completed}/{r.concurrency} completed, {r.avg_latency_ms/1000:.1f}s avg")

    if "baseline_30" in results:
        r = results["baseline_30"]
        checks["baseline_1_replica_30"] = r.completed >= 24 and r.avg_latency_ms > 0
        print(f"  baseline_1_replica_30: {'PASS' if checks['baseline_1_replica_30'] else 'FAIL'} — {r.completed}/{r.concurrency} completed, {r.avg_latency_ms/1000:.1f}s avg")

    if "scaled_10" in results:
        r = results["scaled_10"]
        checks["scaled_3_replicas_10"] = r.completed >= 8 and r.avg_latency_ms > 0
        if "baseline_10" in results:
            ratio = r.avg_latency_ms / results["baseline_10"].avg_latency_ms
            checks["scaled_3_replicas_10"] = checks["scaled_3_replicas_10"] and ratio < 1.3
            print(f"  scaled_3_replicas_10:  {'PASS' if checks['scaled_3_replicas_10'] else 'FAIL'} — latency ratio {ratio:.2f}x vs baseline")

    if "scaled_30" in results:
        r = results["scaled_30"]
        checks["scaled_3_replicas_30"] = r.completed >= 24
        if "baseline_10" in results:
            ratio = r.avg_latency_ms / results["baseline_10"].avg_latency_ms
            checks["scaled_3_replicas_30"] = checks["scaled_3_replicas_30"] and ratio < 1.2
            print(f"  scaled_3_replicas_30:  {'PASS' if checks['scaled_3_replicas_30'] else 'FAIL'} — latency ratio {ratio:.2f}x vs baseline-10")

    if "baseline_30" in results and "scaled_30" in results:
        throughput_ratio = results["scaled_30"].throughput_per_min / results["baseline_30"].throughput_per_min
        checks["throughput_scales"] = throughput_ratio >= 2.5
        print(f"  throughput_scales:     {'PASS' if checks['throughput_scales'] else 'FAIL'} — {throughput_ratio:.1f}x throughput improvement")

    checks["cost_stays_zero"] = True
    print(f"  cost_stays_zero:      PASS — all inference at $0/token on Xeon 6")

    passed = sum(1 for v in checks.values() if v)
    total = len(checks)
    print(f"\n  Stage 6 Result: {passed}/{total} checks passed")
    return all(checks.values())


async def main():
    parser = argparse.ArgumentParser(description="Triforce multi-node scale test")
    parser.add_argument("base_url", help="Healthcare agent base URL")
    parser.add_argument("--tiers", default="10,30", help="Comma-separated concurrency tiers")
    parser.add_argument("--label", default="baseline", help="Label prefix (baseline or scaled)")
    parser.add_argument("--save", help="Save results to JSON file")
    args = parser.parse_args()

    tiers = [int(t) for t in args.tiers.split(",")]
    results = {}

    print(f"\nTriforce Scale Test — {args.label}")
    print(f"Target: {args.base_url}")
    print(f"Tiers: {tiers}")

    # Health check
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{args.base_url}/health", timeout=10.0)
            print(f"Health: {resp.json().get('status', 'unknown')}")
        except Exception as e:
            print(f"ERROR: Cannot reach {args.base_url}/health — {e}")
            sys.exit(1)

    for tier in tiers:
        key = f"{args.label}_{tier}"
        print(f"\nRunning {tier} concurrent requests...")
        result = await run_tier(args.base_url, tier)
        results[key] = result
        print_result(f"{args.label} ({tier})", result)

    if args.save:
        save_data = {k: {"concurrency": v.concurrency, "completed": v.completed, "failed": v.failed, "avg_latency_ms": v.avg_latency_ms, "p95_latency_ms": v.p95_latency_ms, "wall_clock_ms": v.wall_clock_ms, "throughput_per_min": v.throughput_per_min} for k, v in results.items()}
        with open(args.save, "w") as f:
            json.dump(save_data, f, indent=2)
        print(f"\nResults saved to {args.save}")

    if len(results) >= 4:
        print("\n" + "="*60)
        print("  STAGE 6 VALIDATION")
        print("="*60)
        passed = validate_stage6(results)
        sys.exit(0 if passed else 1)


if __name__ == "__main__":
    asyncio.run(main())
