"""Speculative decoding benchmark endpoints.

Measures the normal target model against a LiteLLM alias backed by a vLLM
speculative-decoding worker. The application only sees OpenAI-compatible
chat completions; vLLM owns draft/target verification.
"""

import os
import time
from typing import Optional

import httpx

from benchmark import TASK_PROMPTS

DEFAULT_TARGET_MODEL = "granite-2b-cpu"
DEFAULT_DRAFT_MODEL = "granite-350m"
DEFAULT_SPECULATIVE_MODEL = "granite-2b-cpu-speculative"


def _target_model() -> str:
    return os.environ.get("SPECULATIVE_TARGET_MODEL", DEFAULT_TARGET_MODEL)


def _draft_model() -> str:
    return os.environ.get("SPECULATIVE_DRAFT_MODEL", DEFAULT_DRAFT_MODEL)


def _speculative_model() -> str:
    return os.environ.get("SPECULATIVE_MODEL", DEFAULT_SPECULATIVE_MODEL)


def _claim_threshold() -> float:
    return float(os.environ.get("SPECULATIVE_SPEEDUP_CLAIM_THRESHOLD", "1.5"))


def status() -> dict:
    enabled = "speculative" in {
        m.strip() for m in os.environ.get("MODULES_ENABLED", "").split(",") if m.strip()
    }
    return {
        "enabled": enabled,
        "target_model": _target_model(),
        "baseline_model": _target_model(),
        "draft_model": _draft_model(),
        "speculative_model": _speculative_model(),
        "api_base_configured": bool(os.environ.get("LITELLM_API_BASE", "")),
        "mode": "vllm-draft-model",
        "num_speculative_tokens": int(os.environ.get("SPECULATIVE_NUM_TOKENS", "5")),
        "claim_threshold": _claim_threshold(),
    }


async def _call_model(model: str, text: str, task: str, max_tokens: Optional[int]) -> dict:
    task_config = TASK_PROMPTS.get(task, TASK_PROMPTS["summarization"])
    api_base = os.environ.get("LITELLM_API_BASE", "")
    api_key = os.environ.get("LITELLM_API_KEY", "")
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": f"{task_config['system']}\n\n{text}"}
        ],
        "max_tokens": max_tokens or task_config["max_tokens"],
        "temperature": 0.1,
    }

    start = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{api_base}/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        return {
            "model": model,
            "task": task,
            "latency_ms": int((time.monotonic() - start) * 1000),
            "error": str(e),
        }

    choice = data["choices"][0]["message"]
    usage = data.get("usage", {})
    return {
        "model": model,
        "task": task,
        "latency_ms": int((time.monotonic() - start) * 1000),
        "output": choice.get("content") or "",
        "prompt_tokens": usage.get("prompt_tokens", 0),
        "output_tokens": usage.get("completion_tokens", 0),
    }


async def run(text: str, task: str = "summarization", max_tokens: Optional[int] = None) -> dict:
    baseline = await _call_model(_target_model(), text, task, max_tokens)
    speculative = await _call_model(_speculative_model(), text, task, max_tokens)

    speedup = None
    if "error" not in baseline and "error" not in speculative and speculative["latency_ms"] > 0:
        speedup = round(baseline["latency_ms"] / speculative["latency_ms"], 2)

    claim_threshold = _claim_threshold()
    if speedup is None:
        run_status = "error"
        message = "Speculative decoding could not be measured for this prompt."
    elif speedup >= claim_threshold:
        run_status = "complete"
        message = "Speculative decoding is configured and measured faster on this prompt."
    else:
        run_status = "complete"
        message = "Speculative decoding is configured and measured; this prompt did not meet the speedup claim threshold."

    return {
        "status": run_status,
        "task": task,
        "baseline": baseline,
        "speculative": speculative,
        "speedup": speedup,
        "claim_threshold": claim_threshold,
        "message": message,
    }
