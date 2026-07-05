"""Multi-model fusion — panel of models + judge synthesis.

For critical decisions where accuracy matters more than speed.
3 models answer independently in parallel, then a judge model
compares responses and synthesizes consensus, contradictions,
and blind spots. Cost: ~4x single call. Value: higher confidence
for decisions with consequences.
"""

import asyncio
import json
import logging
import os
import re
import time
from typing import List, Optional

import httpx

logger = logging.getLogger("healthcare.fusion")

DEFAULT_PANEL = ["granite-2b-cpu", "qwen25-3b-cpu", "phi3-mini-cpu"]
DEFAULT_JUDGE = "granite-3-2-8b-instruct-cpu"


def _get_panel_models() -> List[str]:
    raw = os.environ.get("FUSION_PANEL_MODELS", "")
    if raw:
        return [m.strip() for m in raw.split(",") if m.strip()]
    return DEFAULT_PANEL


def _get_judge_model() -> str:
    return os.environ.get("FUSION_JUDGE_MODEL", DEFAULT_JUDGE)


def _parse_judge_response(text: str) -> dict:
    """Normalize judge output into stable fields for UI and validation."""
    empty = {
        "consensus": "",
        "contradictions": "",
        "blind_spots": "",
        "synthesis": text.strip(),
    }
    if not text.strip():
        return empty

    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return {
                "consensus": str(parsed.get("consensus", "")).strip(),
                "contradictions": str(parsed.get("contradictions", "")).strip(),
                "blind_spots": str(parsed.get("blind_spots", parsed.get("coverage_gaps", ""))).strip(),
                "synthesis": str(parsed.get("synthesis", "")).strip() or text.strip(),
            }
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group(0))
            if isinstance(parsed, dict):
                return {
                    "consensus": str(parsed.get("consensus", "")).strip(),
                    "contradictions": str(parsed.get("contradictions", "")).strip(),
                    "blind_spots": str(parsed.get("blind_spots", parsed.get("coverage_gaps", ""))).strip(),
                    "synthesis": str(parsed.get("synthesis", "")).strip() or text.strip(),
                }
        except json.JSONDecodeError:
            pass

    sections = {}
    pattern = re.compile(
        r"(consensus|contradictions|blind[_ ]spots|coverage gaps|synthesis)\s*:\s*",
        flags=re.IGNORECASE,
    )
    matches = list(pattern.finditer(text))
    for index, item in enumerate(matches):
        key = item.group(1).lower().replace(" ", "_")
        if key == "coverage_gaps":
            key = "blind_spots"
        start = item.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        sections[key] = text[start:end].strip(" \n\r\t-*")

    if sections:
        return {
            "consensus": sections.get("consensus", ""),
            "contradictions": sections.get("contradictions", ""),
            "blind_spots": sections.get("blind_spots", ""),
            "synthesis": sections.get("synthesis", text.strip()),
        }

    return empty


async def _call_model(model: str, prompt: str, max_tokens: int = 300) -> dict:
    api_base = os.environ.get("LITELLM_API_BASE", "")
    api_key = os.environ.get("LITELLM_API_KEY", "")

    gpu_base = os.environ.get("GPU_API_BASE", "")
    gpu_key = os.environ.get("GPU_API_KEY", "")
    if "cpu" not in model and gpu_base:
        api_base = gpu_base
        api_key = gpu_key or api_key

    start = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{api_base}/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}",
                         "Content-Type": "application/json"},
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": max_tokens,
                    "temperature": 0.1,
                },
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        return {
            "model": model,
            "latency_ms": int((time.monotonic() - start) * 1000),
            "error": str(e),
        }

    latency_ms = int((time.monotonic() - start) * 1000)
    content = data["choices"][0]["message"].get("content", "")
    usage = data.get("usage", {})

    return {
        "model": model,
        "latency_ms": latency_ms,
        "response": content,
        "tokens": usage.get("completion_tokens", 0),
    }


async def run_fusion(prompt: str, task: str = "general") -> dict:
    """Run multi-model fusion: panel answers in parallel, judge synthesizes."""
    panel_models = _get_panel_models()
    judge_model = _get_judge_model()

    start_total = time.monotonic()

    panel_tasks = [_call_model(m, prompt) for m in panel_models]
    panel_results = await asyncio.gather(*panel_tasks)

    panel_latency_ms = int((time.monotonic() - start_total) * 1000)

    errors = [r for r in panel_results if "error" in r]
    valid = [r for r in panel_results if "error" not in r]

    if len(valid) < 2:
        return {
            "task": task,
            "status": "insufficient_panel",
            "panel_results": panel_results,
            "errors": len(errors),
        }

    panel_summary = "\n\n".join(
        f"Model {i+1} ({r['model']}):\n{r['response']}"
        for i, r in enumerate(valid)
    )

    judge_prompt = (
        f"You are a judge comparing {len(valid)} model responses to the same question.\n\n"
        f"Original question: {prompt[:500]}\n\n"
        f"Responses:\n{panel_summary}\n\n"
        "Return only valid JSON with these exact string fields:\n"
        '{"consensus":"","contradictions":"","blind_spots":"","synthesis":""}\n'
        "Be concise and do not wrap the JSON in Markdown."
    )

    judge_result = await _call_model(judge_model, judge_prompt, max_tokens=500)
    judge_fields = _parse_judge_response(judge_result.get("response", ""))

    total_ms = int((time.monotonic() - start_total) * 1000)

    return {
        "task": task,
        "status": "complete",
        "panel": {
            "models": [r["model"] for r in valid],
            "count": len(valid),
            "latency_ms": panel_latency_ms,
            "responses": [{"model": r["model"], "latency_ms": r["latency_ms"],
                           "tokens": r["tokens"]} for r in valid],
        },
        "judge": {
            "model": judge_result.get("model", judge_model),
            "latency_ms": judge_result.get("latency_ms", 0),
            "consensus": judge_fields["consensus"],
            "contradictions": judge_fields["contradictions"],
            "blind_spots": judge_fields["blind_spots"],
            "synthesis": judge_fields["synthesis"],
            "tokens": judge_result.get("tokens", 0),
        },
        "total_ms": total_ms,
        "total_models_called": len(valid) + 1,
        "errors": len(errors),
    }
