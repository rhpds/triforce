"""Benchmark runner — compares models across tasks and hardware.

Used by the healthcare agent's /api/v1/benchmark/* endpoints.
Can also run standalone for pre-computed benchmark reports.
"""

import logging
import os
import time
from typing import Optional

logger = logging.getLogger("triforce.benchmark")

LITELLM_API_BASE = os.environ.get("LITELLM_API_BASE", "")
LITELLM_API_KEY = os.environ.get("LITELLM_API_KEY", "")
GPU_API_BASE = os.environ.get("GPU_API_BASE", "")
GPU_API_KEY = os.environ.get("GPU_API_KEY", "")

TASK_PROMPTS = {
    "classification": {
        "system": "Classify this clinical document into exactly one category: discharge_summary, progress_note, lab_report, radiology_report, pathology_report, surgical_note, consultation, prescription. Respond with only the category name.",
        "max_tokens": 32,
    },
    "ner": {
        "system": "Extract all medical entities from this text as a JSON array. Each entity: {text, type (medication/condition/procedure)}. Respond with ONLY the JSON array.",
        "max_tokens": 512,
    },
    "summarization": {
        "system": "Summarize this clinical record in 2-3 sentences for a physician handoff. Be concise and include key findings.",
        "max_tokens": 256,
    },
    "fraud_scoring": {
        "system": "Assess the fraud risk (0-100) for this transaction and explain your reasoning in one sentence.",
        "max_tokens": 128,
    },
    "compliance_reasoning": {
        "system": "Analyze this transaction for regulatory compliance. Answer with yes/no and explain in 2 sentences.",
        "max_tokens": 200,
    },
}

CPU_MODELS = [
    "granite-2b-cpu",
    "qwen25-3b-cpu",
    "phi3-mini-cpu",
    "granite-3-2-8b-instruct-cpu",
    "granite-4-0-h-tiny-cpu",
]

GPU_MODELS = [
    "granite-3-2-8b-instruct",
    "microsoft-phi-4",
    "gpt-oss-20b",
    "gpt-oss-120b",
    "llama-scout-17b",
]


async def run_single(model: str, task: str, text: str,
                     api_base: Optional[str] = None,
                     api_key: Optional[str] = None) -> dict:
    """Run a single model on a single task. Returns latency, output, tokens."""
    import httpx

    task_config = TASK_PROMPTS.get(task, TASK_PROMPTS["classification"])
    base = api_base or os.environ.get("LITELLM_API_BASE", "")
    key = api_key or os.environ.get("LITELLM_API_KEY", "")

    gpu_base = os.environ.get("GPU_API_BASE", "")
    gpu_key = os.environ.get("GPU_API_KEY", "")
    is_gpu = model in GPU_MODELS
    if is_gpu and gpu_base:
        base = gpu_base
        key = gpu_key or key

    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": f"{task_config['system']}\n\n{text}"}
        ],
        "max_tokens": task_config["max_tokens"],
        "temperature": 0.1,
    }

    start = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{base}/v1/chat/completions",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        return {
            "model": model,
            "hardware": "gpu" if is_gpu else "cpu",
            "task": task,
            "latency_ms": int((time.monotonic() - start) * 1000),
            "error": str(e),
        }

    latency_ms = int((time.monotonic() - start) * 1000)
    choice = data["choices"][0]["message"]
    usage = data.get("usage", {})

    return {
        "model": model,
        "hardware": "gpu" if is_gpu else "cpu",
        "task": task,
        "latency_ms": latency_ms,
        "output": (choice.get("content") or "")[:500],
        "prompt_tokens": usage.get("prompt_tokens", 0),
        "output_tokens": usage.get("completion_tokens", 0),
    }


async def run_comparison(task: str, text: str, models: list) -> dict:
    """Run multiple models on the same task. Returns sorted results."""
    import asyncio

    tasks = [run_single(m, task, text) for m in models]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    clean = []
    for r in results:
        if isinstance(r, Exception):
            clean.append({"error": str(r)})
        else:
            clean.append(r)

    clean.sort(key=lambda r: r.get("latency_ms", 999999))

    return {
        "task": task,
        "models_compared": len(models),
        "results": clean,
        "fastest": clean[0] if clean else None,
    }


def list_available_models() -> dict:
    """List all models available for benchmarking."""
    cpu = [{"model": m, "hardware": "cpu", "cost": "$0/token"} for m in CPU_MODELS]
    gpu = [{"model": m, "hardware": "gpu", "cost": "$/token"} for m in GPU_MODELS]
    return {
        "cpu_models": cpu,
        "gpu_models": gpu,
        "total": len(cpu) + len(gpu),
    }
