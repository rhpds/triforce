"""Stage 9: Per-module benchmark validation against rubric baselines.

Tests run against live MAAS. Each module's benchmarks validate latency,
quality, and correctness against measured baselines in benchmark_rubric.yaml.
"""

import os
import pytest
import httpx
import yaml
from pathlib import Path

HEALTHCARE_URL = os.environ.get("HEALTHCARE_URL", "http://localhost:8081")
SEMANTIC_ROUTER_URL = os.environ.get("SEMANTIC_ROUTER_URL", "http://localhost:8094")
SKIP_LIVE = not os.environ.get("LITELLM_API_KEY", "")

RUBRIC = yaml.safe_load(
    (Path(__file__).parent / "benchmark_rubric.yaml").read_text()
)["benchmark_rubric"]["modules"]


@pytest.mark.skipif(SKIP_LIVE, reason="LITELLM_API_KEY not set")
class TestCorePipelineBenchmarks:
    """stage_9: Core pipeline benchmarks against rubric baselines."""

    def test_classification_all_models_correct(self):
        cfg = RUBRIC["core_pipeline"]["benchmarks"]["classification"]
        for model_cfg in cfg["models"]:
            if model_cfg["hardware"] == "gpu":
                continue
            resp = httpx.post(
                f"{HEALTHCARE_URL}/api/v1/benchmark/run",
                json={"task": "classification", "text": cfg["test_text"],
                      "models": [model_cfg["model"]]},
                timeout=30,
            )
            result = resp.json()["results"][0]
            assert "error" not in result, f'{model_cfg["model"]}: {result.get("error")}'
            assert model_cfg["expected_output"] in result["output"].lower(), (
                f'{model_cfg["model"]} returned "{result["output"]}" not "{model_cfg["expected_output"]}"'
            )

    def test_classification_within_max_latency(self):
        cfg = RUBRIC["core_pipeline"]["benchmarks"]["classification"]
        for model_cfg in cfg["models"]:
            if model_cfg["hardware"] == "gpu":
                continue
            resp = httpx.post(
                f"{HEALTHCARE_URL}/api/v1/benchmark/run",
                json={"task": "classification", "text": cfg["test_text"],
                      "models": [model_cfg["model"]]},
                timeout=30,
            )
            result = resp.json()["results"][0]
            if "error" in result:
                continue
            assert result["latency_ms"] < model_cfg["max_ms"], (
                f'{model_cfg["model"]}: {result["latency_ms"]}ms exceeds max {model_cfg["max_ms"]}ms'
            )

    def test_ner_minimum_entities(self):
        cfg = RUBRIC["core_pipeline"]["benchmarks"]["ner"]
        for model_cfg in cfg["models"]:
            if model_cfg["hardware"] == "gpu":
                continue
            resp = httpx.post(
                f"{HEALTHCARE_URL}/api/v1/benchmark/run",
                json={"task": "ner", "text": cfg["test_text"],
                      "models": [model_cfg["model"]]},
                timeout=60,
            )
            result = resp.json()["results"][0]
            if "error" in result:
                continue
            entity_count = result["output"].count('"text"')
            assert entity_count >= model_cfg["min_entities"], (
                f'{model_cfg["model"]}: found {entity_count} entities, need {model_cfg["min_entities"]}'
            )

    def test_summarization_minimum_tokens(self):
        cfg = RUBRIC["core_pipeline"]["benchmarks"]["summarization"]
        for model_cfg in cfg["models"]:
            if model_cfg["hardware"] == "gpu":
                continue
            resp = httpx.post(
                f"{HEALTHCARE_URL}/api/v1/benchmark/run",
                json={"task": "summarization", "text": cfg["test_text"],
                      "models": [model_cfg["model"]]},
                timeout=60,
            )
            result = resp.json()["results"][0]
            if "error" in result:
                continue
            assert result["output_tokens"] >= model_cfg["min_tokens"], (
                f'{model_cfg["model"]}: {result["output_tokens"]} tokens, need {model_cfg["min_tokens"]}'
            )


@pytest.mark.skipif(SKIP_LIVE, reason="LITELLM_API_KEY not set")
class TestFusionBenchmarks:
    """stage_9: Fusion panel + judge timing and consensus."""

    def test_fusion_completes_within_budget(self):
        cfg = RUBRIC["fusion"]["benchmarks"]["panel_consensus"]
        resp = httpx.post(
            f"{HEALTHCARE_URL}/api/v1/fusion",
            json={"task": "compliance", "prompt": cfg["test_prompt"]},
            timeout=120,
        )
        data = resp.json()
        assert data.get("status") == "complete", f"Fusion status: {data.get('status')}"
        assert data["panel"]["count"] >= cfg["min_panel_responses"]
        assert data["total_ms"] < cfg["max_total_ms"], (
            f'Fusion took {data["total_ms"]}ms, max {cfg["max_total_ms"]}ms'
        )

    def test_fusion_judge_produces_synthesis(self):
        cfg = RUBRIC["fusion"]["benchmarks"]["panel_consensus"]
        resp = httpx.post(
            f"{HEALTHCARE_URL}/api/v1/fusion",
            json={"task": "compliance", "prompt": cfg["test_prompt"]},
            timeout=120,
        )
        data = resp.json()
        synthesis = data.get("judge", {}).get("synthesis", "")
        assert len(synthesis) > 50, f"Judge synthesis too short: {len(synthesis)} chars"

    def test_fusion_judge_has_structured_fields(self):
        cfg = RUBRIC["fusion"]["benchmarks"]["panel_consensus"]
        resp = httpx.post(
            f"{HEALTHCARE_URL}/api/v1/fusion",
            json={"task": "compliance", "prompt": cfg["test_prompt"]},
            timeout=120,
        )
        judge = resp.json().get("judge", {})
        for field in ["consensus", "contradictions", "blind_spots", "synthesis"]:
            assert field in judge, f"Fusion judge missing {field}"


@pytest.mark.skipif(SKIP_LIVE, reason="LITELLM_API_KEY not set")
class TestAdaptiveCacheBenchmarks:
    """stage_9: Adaptive cache cold vs warm performance."""

    def test_warm_cache_under_threshold(self):
        cfg = RUBRIC["adaptive_classification"]["benchmarks"]["cache_warmup"]
        for _ in range(cfg["warmup_calls"]):
            httpx.post(
                f"{HEALTHCARE_URL}/api/v1/pipeline",
                json={"text": cfg["test_text"]},
                timeout=60,
            )
        resp = httpx.post(
            f"{HEALTHCARE_URL}/api/v1/pipeline",
            json={"text": cfg["test_text"]},
            timeout=60,
        )
        data = resp.json()
        classify_entry = data["inference_log"][0]
        if classify_entry.get("model") == "adaptive-cache":
            assert classify_entry["latency_ms"] <= cfg["warm_max_ms"], (
                f'Warm cache: {classify_entry["latency_ms"]}ms exceeds {cfg["warm_max_ms"]}ms'
            )


class TestHeterogeneousRoutingBenchmarks:
    """stage_9: Routing decisions match expected hardware targets."""

    def test_simple_routes_to_cpu(self):
        cfg = RUBRIC["heterogeneous_routing"]["benchmarks"]["simple_routes_cpu"]
        try:
            resp = httpx.post(
                f"{SEMANTIC_ROUTER_URL}/classify",
                json={"text": cfg["test_text"]},
                timeout=10,
            )
        except httpx.ConnectError:
            pytest.skip("Semantic router not running")
        data = resp.json()
        assert data["route"] == cfg["models"][0]["expected_route"]
        assert data.get("hardware", "cpu") == "cpu"

    def test_complex_routes_correctly(self):
        cfg = RUBRIC["heterogeneous_routing"]["benchmarks"]["complex_routes_gpu"]
        try:
            resp = httpx.post(
                f"{SEMANTIC_ROUTER_URL}/classify",
                json={"text": cfg["test_text"]},
                timeout=10,
            )
        except httpx.ConnectError:
            pytest.skip("Semantic router not running")
        data = resp.json()
        assert data["route"] == cfg["models"][0]["expected_route"]


class TestSpeculativeDecodingBenchmarks:
    """stage_9: Speculative decoding — RED tests (not yet implemented)."""

    @pytest.mark.skipif(SKIP_LIVE, reason="LITELLM_API_KEY not set")
    def test_speculative_status_configured(self):
        """Healthcare agent should expose the configured speculative pair."""
        cfg = RUBRIC["speculative_decoding"]["benchmarks"]["draft_target_speedup"]
        resp = httpx.get(f"{HEALTHCARE_URL}/api/v1/speculative/status", timeout=10)
        data = resp.json()
        assert data["draft_model"] == cfg["draft_model"]
        assert data["target_model"] == cfg["target_model"]
        assert data["speculative_model"] == cfg["speculative_model"]

    @pytest.mark.skipif(SKIP_LIVE, reason="LITELLM_API_KEY not set")
    def test_speculative_speedup_measurable(self):
        """Draft+target path returns measured latency, tokens, text, and speedup."""
        cfg = RUBRIC["speculative_decoding"]["benchmarks"]["draft_target_speedup"]
        resp = httpx.post(
            f"{HEALTHCARE_URL}/api/v1/speculative/run",
            json={
                "task": "summarization",
                "text": cfg["test_text"],
                "max_tokens": cfg["max_tokens"],
            },
            timeout=120,
        )
        data = resp.json()
        assert data["status"] == "complete", data
        assert data["baseline"]["model"] == cfg["target_model"]
        assert data["speculative"]["model"] == cfg["speculative_model"]
        assert "latency_ms" in data["baseline"]
        assert "latency_ms" in data["speculative"]
        assert "output_tokens" in data["baseline"]
        assert "output_tokens" in data["speculative"]
        assert data["baseline"].get("output", "")
        assert data["speculative"].get("output", "")
        assert data["speedup"] is not None
        if data["speedup"] < cfg["minimum_speedup_for_claim"]:
            assert "configured and measured" in data["message"]
