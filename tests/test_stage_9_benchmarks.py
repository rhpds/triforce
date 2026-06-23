"""Stage 9: Benchmark validation — models, tasks, CPU vs GPU metrics."""

import os
import pytest
import httpx

HEALTHCARE_URL = os.environ.get("HEALTHCARE_URL", "http://localhost:8081")
SKIP_LIVE = not os.environ.get("LITELLM_API_KEY", "")

SAMPLE_TEXT = (
    "DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes "
    "on Metformin 500mg and Lisinopril 10mg. Recent STEMI with PCI to RCA."
)


@pytest.mark.skipif(SKIP_LIVE, reason="LITELLM_API_KEY not set — skipping live benchmark tests")
class TestBenchmarkModels:
    """stage_9: Benchmark model listing."""

    def test_models_endpoint_returns_cpu_and_gpu(self):
        resp = httpx.get(f"{HEALTHCARE_URL}/api/v1/benchmark/models", timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["cpu_models"]) >= 3
        assert data["total"] >= 5

    def test_models_have_hardware_field(self):
        data = httpx.get(f"{HEALTHCARE_URL}/api/v1/benchmark/models", timeout=10).json()
        for m in data["cpu_models"]:
            assert m["hardware"] == "cpu"


@pytest.mark.skipif(SKIP_LIVE, reason="LITELLM_API_KEY not set")
class TestBenchmarkRun:
    """stage_9: Benchmark execution produces valid metrics."""

    def test_classification_benchmark(self):
        resp = httpx.post(
            f"{HEALTHCARE_URL}/api/v1/benchmark/run",
            json={"task": "classification", "text": SAMPLE_TEXT, "models": ["granite-2b-cpu"]},
            timeout=30,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["task"] == "classification"
        assert data["models_compared"] == 1
        result = data["results"][0]
        assert "error" not in result, f"Benchmark error: {result.get('error')}"
        assert result["latency_ms"] > 0
        assert "discharge_summary" in result["output"].lower()

    def test_ner_benchmark(self):
        resp = httpx.post(
            f"{HEALTHCARE_URL}/api/v1/benchmark/run",
            json={"task": "ner", "text": SAMPLE_TEXT, "models": ["granite-2b-cpu"]},
            timeout=30,
        )
        data = resp.json()
        result = data["results"][0]
        assert "error" not in result, f"Benchmark error: {result.get('error')}"
        assert result["output_tokens"] > 10

    def test_summarization_benchmark(self):
        resp = httpx.post(
            f"{HEALTHCARE_URL}/api/v1/benchmark/run",
            json={"task": "summarization", "text": SAMPLE_TEXT, "models": ["granite-2b-cpu"]},
            timeout=30,
        )
        data = resp.json()
        result = data["results"][0]
        assert "error" not in result, f"Benchmark error: {result.get('error')}"
        assert result["output_tokens"] > 20

    def test_multi_model_comparison_sorted_by_latency(self):
        resp = httpx.post(
            f"{HEALTHCARE_URL}/api/v1/benchmark/run",
            json={"task": "classification", "text": SAMPLE_TEXT,
                  "models": ["granite-2b-cpu", "qwen25-3b-cpu"]},
            timeout=30,
        )
        data = resp.json()
        assert data["models_compared"] == 2
        latencies = [r["latency_ms"] for r in data["results"] if "error" not in r]
        assert latencies == sorted(latencies), "Results should be sorted by latency"

    def test_fastest_field_matches_first_result(self):
        resp = httpx.post(
            f"{HEALTHCARE_URL}/api/v1/benchmark/run",
            json={"task": "classification", "text": SAMPLE_TEXT,
                  "models": ["granite-2b-cpu", "qwen25-3b-cpu"]},
            timeout=30,
        )
        data = resp.json()
        assert data["fastest"]["model"] == data["results"][0]["model"]

    def test_empty_text_returns_error(self):
        resp = httpx.post(
            f"{HEALTHCARE_URL}/api/v1/benchmark/run",
            json={"task": "classification", "text": "", "models": ["granite-2b-cpu"]},
            timeout=10,
        )
        data = resp.json()
        assert "error" in data


class TestBenchmarkReproducibility:
    """stage_9: Benchmarks are reproducible within variance."""

    @pytest.mark.skipif(SKIP_LIVE, reason="LITELLM_API_KEY not set")
    def test_two_runs_within_variance(self):
        results = []
        for _ in range(2):
            resp = httpx.post(
                f"{HEALTHCARE_URL}/api/v1/benchmark/run",
                json={"task": "classification", "text": SAMPLE_TEXT,
                      "models": ["granite-2b-cpu"]},
                timeout=30,
            )
            data = resp.json()
            results.append(data["results"][0]["latency_ms"])
        ratio = max(results) / max(min(results), 1)
        assert ratio < 3.0, f"Latency variance too high: {results} (ratio {ratio:.1f}x)"
