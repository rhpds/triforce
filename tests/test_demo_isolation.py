"""Demo Isolation Tests — detect cross-pollination between demo sections.

Ensures state from one act/module doesn't leak into another and distort
metrics. The adaptive cache 0ms classification leak was the first example.
"""

import json
import os
import subprocess

import pytest

NAMESPACE = "triforce"
KUBECONFIG = os.path.expanduser("~/.kube/config-oberon")

SAMPLE_TEXT = (
    "DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on "
    "Metformin and Lisinopril. Recent STEMI with PCI to RCA."
)


def curl_pipeline(text, skip_cache=True, classify_model=None):
    body = {"text": text, "skip_cache": skip_cache}
    if classify_model:
        body["classify_model"] = classify_model
    cmd = [
        "oc", "--kubeconfig", KUBECONFIG, "exec", "-n", NAMESPACE,
        "deploy/orchestrator", "--",
        "curl", "-s", "-m", "60", "-X", "POST",
        f"http://healthcare-agent.{NAMESPACE}.svc:8081/api/v1/pipeline",
        "-H", "Content-Type: application/json",
        "-d", json.dumps(body),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if result.returncode != 0:
        return None
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return None


class TestCacheIsolation:
    """Adaptive cache must not leak 0ms into non-cache pipeline runs."""

    def test_skip_cache_produces_real_latency(self):
        result = curl_pipeline(SAMPLE_TEXT, skip_cache=True)
        assert result is not None, "Pipeline didn't respond"
        classify_log = next(
            (e for e in result.get("inference_log", []) if e["node"] == "classify"),
            None,
        )
        assert classify_log is not None, "No classify entry in inference_log"
        assert classify_log["latency_ms"] > 100, (
            f"Classification took {classify_log['latency_ms']}ms with skip_cache=true — "
            "should be real LLM inference (>100ms), not a cache hit"
        )
        assert classify_log.get("model") != "adaptive-cache", (
            "Classification used adaptive-cache despite skip_cache=true"
        )

    def test_cache_only_active_when_requested(self):
        # First: populate cache
        curl_pipeline(SAMPLE_TEXT, skip_cache=False)
        # Second: verify cache hit
        result2 = curl_pipeline(SAMPLE_TEXT, skip_cache=False)
        if result2:
            classify_log = next(
                (e for e in result2.get("inference_log", []) if e["node"] == "classify"),
                None,
            )
            if classify_log and classify_log.get("model") == "adaptive-cache":
                # Cache is working — now verify skip_cache bypasses it
                result3 = curl_pipeline(SAMPLE_TEXT, skip_cache=True)
                assert result3 is not None
                classify_log3 = next(
                    (e for e in result3.get("inference_log", []) if e["node"] == "classify"),
                    None,
                )
                assert classify_log3["latency_ms"] > 100, (
                    "skip_cache=true didn't bypass the adaptive cache"
                )


class TestModelStateIsolation:
    """Model override in one call must not persist to the next."""

    def test_model_override_does_not_persist(self):
        # Run with override
        result1 = curl_pipeline(SAMPLE_TEXT, classify_model="phi3-mini-cpu")
        # Run without override — should use default model
        result2 = curl_pipeline(SAMPLE_TEXT)
        if result1 and result2:
            log1 = next((e for e in result1.get("inference_log", []) if e["node"] == "classify"), {})
            log2 = next((e for e in result2.get("inference_log", []) if e["node"] == "classify"), {})
            assert log2.get("model") != "phi3-mini-cpu", (
                "Model override from previous call persisted to next call"
            )
