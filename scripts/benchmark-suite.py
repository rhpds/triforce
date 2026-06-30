#!/usr/bin/env python3
"""Triforce Reproducible Benchmark Suite

Runs all models × all tasks × N samples. Saves raw results as JSON.
Reports medians, p95, and quality assessments.

Usage:
  # Full suite (3 samples per model per task)
  python3 scripts/benchmark-suite.py

  # Quick check (1 sample)
  python3 scripts/benchmark-suite.py --samples 1

  # Specific models only
  python3 scripts/benchmark-suite.py --models granite-2b-cpu,phi3-mini-cpu

  # With Gaudi models (needs RAC key)
  python3 scripts/benchmark-suite.py --gaudi

  # Output to specific file
  python3 scripts/benchmark-suite.py --output results/benchmark-2026-06-30.json
"""

import argparse
import asyncio
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

try:
    import httpx
except ImportError:
    print("pip install httpx")
    sys.exit(1)

MAAS_URL = os.environ.get("LITELLM_API_BASE", "https://maas-rhdp.apps.maas.redhatworkshops.io")
CPU_KEY = os.environ.get("LITELLM_API_KEY", "")
GPU_KEY = os.environ.get("GPU_API_KEY", "")

CPU_MODELS = [
    "granite-2b-cpu",
    "qwen25-3b-cpu",
    "phi3-mini-cpu",
    "granite-3-2-8b-instruct-cpu",
]

GAUDI_MODELS = [
    "granite-3-2-8b-instruct",
    "microsoft-phi-4",
    "gpt-oss-20b",
    "llama-scout-17b",
]

TASKS = {
    "classification": {
        "prompt": "Classify this clinical document into exactly one category: discharge_summary, progress_note, lab_report, radiology_report. Respond with only the category name.\n\nDISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin 500mg and Lisinopril 10mg. Recent STEMI with PCI to RCA.",
        "max_tokens": 32,
        "expected_contains": "discharge_summary",
    },
    "ner": {
        "prompt": "Extract all medical entities from this text as a JSON array. Each entity: {text, type (medication/condition/procedure)}. Respond with ONLY the JSON array.\n\n72-year-old male with Type 2 Diabetes on Metformin 500mg and Lisinopril 10mg. Recent STEMI with PCI to RCA. Aspirin 81mg and Clopidogrel 75mg.",
        "max_tokens": 512,
        "expected_contains": "Metformin",
    },
    "summarization": {
        "prompt": "Summarize this clinical record in 2-3 sentences for a physician handoff. Be concise and include key findings.\n\n72-year-old male admitted with acute chest pain. History of Type 2 Diabetes, hypertension, CKD stage 3. ECG showed ST elevation. Troponin I elevated at 8.2. Emergent catheterization revealed 95% occlusion of RCA. Successful PCI with drug-eluting stent.",
        "max_tokens": 256,
        "expected_contains": None,
    },
    "compliance": {
        "prompt": "A customer in Germany transfers $9,500 to a business account in the Cayman Islands. They have made 3 similar transfers in the past month, each just under $10,000. Does this pattern indicate potential structuring under AML regulations? Answer yes or no and explain in 2 sentences.",
        "max_tokens": 200,
        "expected_contains": None,
    },
}


async def call_model(client, model, api_key, task_name, task_config):
    start = time.monotonic()
    try:
        resp = await client.post(
            f"{MAAS_URL}/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": model,
                "messages": [{"role": "user", "content": task_config["prompt"]}],
                "max_tokens": task_config["max_tokens"],
                "temperature": 0.1,
            },
        )
        latency_ms = int((time.monotonic() - start) * 1000)

        if resp.status_code != 200:
            return {
                "model": model, "task": task_name, "latency_ms": latency_ms,
                "error": f"HTTP {resp.status_code}: {resp.text[:100]}",
            }

        data = resp.json()
        if "error" in data:
            return {
                "model": model, "task": task_name, "latency_ms": latency_ms,
                "error": data["error"].get("message", str(data["error"]))[:100],
            }

        choice = data["choices"][0]["message"]
        content = choice.get("content") or ""
        usage = data.get("usage", {})

        quality = "unknown"
        expected = task_config.get("expected_contains")
        if expected:
            quality = "correct" if expected.lower() in content.lower() else "incorrect"

        return {
            "model": model,
            "task": task_name,
            "latency_ms": latency_ms,
            "output_tokens": usage.get("completion_tokens", 0),
            "prompt_tokens": usage.get("prompt_tokens", 0),
            "output_preview": content[:100],
            "quality": quality,
        }

    except Exception as e:
        return {
            "model": model, "task": task_name,
            "latency_ms": int((time.monotonic() - start) * 1000),
            "error": str(e)[:100],
        }


async def run_benchmark(models, tasks, api_key, samples, label):
    results = []
    async with httpx.AsyncClient(timeout=120) as client:
        total = len(models) * len(tasks) * samples
        done = 0

        for model in models:
            for task_name, task_config in tasks.items():
                for sample_num in range(samples):
                    result = await call_model(client, model, api_key, task_name, task_config)
                    result["sample"] = sample_num + 1
                    result["hardware"] = label
                    result["timestamp"] = datetime.now(timezone.utc).isoformat()
                    results.append(result)

                    done += 1
                    err = result.get("error", "")
                    latency = result.get("latency_ms", 0)
                    status = f"ERROR: {err[:40]}" if err else f"{latency}ms"
                    print(f"  [{done}/{total}] {model:35s} {task_name:15s} #{sample_num+1}  {status}")

    return results


def compute_stats(results):
    from collections import defaultdict

    grouped = defaultdict(list)
    for r in results:
        if "error" not in r:
            key = (r["model"], r["task"], r["hardware"])
            grouped[key].append(r)

    stats = []
    for (model, task, hw), samples in grouped.items():
        latencies = sorted([s["latency_ms"] for s in samples])
        tokens = [s.get("output_tokens", 0) for s in samples]
        qualities = [s.get("quality", "unknown") for s in samples]

        n = len(latencies)
        stats.append({
            "model": model,
            "task": task,
            "hardware": hw,
            "samples": n,
            "latency_median_ms": latencies[n // 2],
            "latency_min_ms": latencies[0],
            "latency_max_ms": latencies[-1],
            "latency_p95_ms": latencies[int(n * 0.95)] if n >= 3 else latencies[-1],
            "output_tokens_median": sorted(tokens)[n // 2] if tokens else 0,
            "quality": max(set(qualities), key=qualities.count),
        })

    return sorted(stats, key=lambda s: (s["task"], s["latency_median_ms"]))


def print_report(stats):
    current_task = None
    for s in stats:
        if s["task"] != current_task:
            current_task = s["task"]
            print(f"\n{'='*80}")
            print(f"  {current_task.upper()}")
            print(f"{'='*80}")
            print(f"  {'Model':35s} {'HW':6s} {'Median':>8s} {'Min':>8s} {'Max':>8s} {'p95':>8s} {'Tok':>5s} {'Quality':>10s} {'N':>3s}")
            print(f"  {'-'*35} {'-'*6} {'-'*8} {'-'*8} {'-'*8} {'-'*8} {'-'*5} {'-'*10} {'-'*3}")

        print(f"  {s['model']:35s} {s['hardware']:6s} {s['latency_median_ms']:>7d}ms {s['latency_min_ms']:>7d}ms {s['latency_max_ms']:>7d}ms {s['latency_p95_ms']:>7d}ms {s['output_tokens_median']:>5d} {s['quality']:>10s} {s['samples']:>3d}")


async def main():
    parser = argparse.ArgumentParser(description="Triforce Reproducible Benchmark Suite")
    parser.add_argument("--samples", type=int, default=3, help="Samples per model per task (default: 3)")
    parser.add_argument("--models", type=str, default=None, help="Comma-separated model list (default: all CPU)")
    parser.add_argument("--gaudi", action="store_true", help="Include Gaudi models")
    parser.add_argument("--output", type=str, default=None, help="Output JSON path")
    args = parser.parse_args()

    if not CPU_KEY:
        print("ERROR: Set LITELLM_API_KEY environment variable")
        sys.exit(1)

    models = args.models.split(",") if args.models else CPU_MODELS
    tasks = TASKS

    print(f"Triforce Benchmark Suite")
    print(f"  MAAS: {MAAS_URL}")
    print(f"  Models: {len(models)} CPU" + (f" + {len(GAUDI_MODELS)} Gaudi" if args.gaudi else ""))
    print(f"  Tasks: {len(tasks)}")
    print(f"  Samples: {args.samples} per model per task")
    print(f"  Total calls: {len(models) * len(tasks) * args.samples}" + (f" + {len(GAUDI_MODELS) * len(tasks) * args.samples}" if args.gaudi else ""))
    print(f"  Started: {datetime.now().isoformat()}")
    print()

    print("=== CPU Models (Intel Xeon 6) ===")
    cpu_results = await run_benchmark(models, tasks, CPU_KEY, args.samples, "cpu")

    gaudi_results = []
    if args.gaudi:
        if not GPU_KEY:
            print("\nWARNING: GPU_API_KEY not set — skipping Gaudi models")
        else:
            print("\n=== Gaudi Models (Intel Gaudi 3) ===")
            gaudi_results = await run_benchmark(GAUDI_MODELS, tasks, GPU_KEY, args.samples, "gaudi")

    all_results = cpu_results + gaudi_results
    stats = compute_stats(all_results)

    print("\n" + "=" * 80)
    print("  RESULTS (medians from {} samples per measurement)".format(args.samples))
    print_report(stats)

    errors = [r for r in all_results if "error" in r]
    if errors:
        print(f"\n  ERRORS: {len(errors)}")
        for e in errors:
            print(f"    {e['model']:35s} {e['task']:15s} #{e['sample']}  {e['error'][:60]}")

    output = {
        "metadata": {
            "maas_url": MAAS_URL,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "samples_per_measurement": args.samples,
            "cpu_models": models,
            "gaudi_models": GAUDI_MODELS if args.gaudi else [],
            "tasks": list(tasks.keys()),
            "total_calls": len(all_results),
            "errors": len(errors),
        },
        "raw_results": all_results,
        "stats": stats,
    }

    output_path = args.output or f"test-receipts/benchmark-suite-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    Path(output_path).write_text(json.dumps(output, indent=2))
    print(f"\n  Results saved to: {output_path}")
    print(f"  Completed: {datetime.now().isoformat()}")


if __name__ == "__main__":
    asyncio.run(main())
