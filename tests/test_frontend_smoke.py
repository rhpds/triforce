"""Frontend Live Smoke Tests — validate every endpoint the demo UI calls.

Hits the same endpoints the React module pages and acts call, and checks:
- HTTP 200 response
- No NaN, null, or empty values in display-critical fields
- Latency > 0 for inference calls
- Model names present and non-empty
- Confidence values in valid range (0-1)
- Structured fields populated where expected

Run against a live cluster:
    HEALTHCARE_URL=http://localhost:8081 \
    ROUTER_URL=http://localhost:8094 \
    FINSERV_URL=http://localhost:8082 \
    BITNET_URL=http://localhost:8080 \
    python3 -m pytest tests/test_frontend_smoke.py -v

Or via port-forward / oc exec from inside a pod.
"""

import math
import os

import httpx
import pytest

HEALTHCARE = os.environ.get("HEALTHCARE_URL", "http://localhost:8081")
ROUTER = os.environ.get("ROUTER_URL", "http://localhost:8094")
FINSERV = os.environ.get("FINSERV_URL", "http://localhost:8082")
BITNET = os.environ.get("BITNET_URL", "http://localhost:8080")
ORCHESTRATOR = os.environ.get("ORCHESTRATOR_URL", "http://localhost:8083")
MCP_GATEWAY = os.environ.get("MCP_GATEWAY_URL", "http://localhost:8091")

CLINICAL_TEXT = (
    "DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on "
    "Metformin 500mg and Lisinopril 10mg. Started on Aspirin 81mg "
    "and Clopidogrel 75mg. Recent STEMI with PCI to RCA."
)


def _is_reachable(url):
    try:
        return httpx.get(f"{url}/health", timeout=3).status_code == 200
    except Exception:
        return False


def _not_nan(value):
    if isinstance(value, float):
        return not math.isnan(value) and not math.isinf(value)
    return True


SKIP = not _is_reachable(HEALTHCARE)


@pytest.mark.skipif(SKIP, reason="Healthcare agent not reachable")
class TestPipelineEndpoints:
    """Act02 Inference — pipeline, classify, entities, summarize."""

    def test_full_pipeline(self):
        """Act02 Step 1: Run Pipeline on Xeon 6."""
        resp = httpx.post(
            f"{HEALTHCARE}/api/v1/pipeline",
            json={"text": CLINICAL_TEXT, "skip_cache": True},
            timeout=120,
        )
        assert resp.status_code == 200
        data = resp.json()

        assert "classification" in data and data["classification"]
        assert "summary" in data and len(data["summary"]) > 20
        assert "entities" in data and len(data["entities"]) > 0

        for entry in data.get("inference_log", []):
            assert entry["latency_ms"] >= 0, f"Node {entry['node']} has negative latency"
            assert entry["model"], f"Node {entry['node']} has empty model"
            assert entry["accelerator"] in ("cpu", "gpu"), f"Node {entry['node']} bad accelerator: {entry['accelerator']}"

    def test_classify(self):
        """Act02 Telco vertical uses /classify."""
        resp = httpx.post(
            f"{HEALTHCARE}/api/v1/classify",
            json={"text": CLINICAL_TEXT, "skip_cache": True},
            timeout=60,
        )
        assert resp.status_code == 200
        data = resp.json()

        assert data["classification"], "Empty classification"
        assert data["model"], "Empty model"
        assert data["accelerator"] in ("cpu", "gpu")
        assert data["inference_ms"] >= 0, f"Latency is negative: {data['inference_ms']}"
        assert 0 < data["confidence"] <= 1, f"Confidence out of range: {data['confidence']}"

    def test_pipeline_compare(self):
        """Act04 Efficiency — FP32 vs INT8 comparison."""
        resp = httpx.post(
            f"{HEALTHCARE}/api/v1/pipeline/compare",
            json={"text": CLINICAL_TEXT},
            timeout=120,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "baseline" in data
        assert "optimized" in data
        for key in ("baseline", "optimized"):
            result = data[key]
            assert result.get("classification"), f"{key} missing classification"
            assert result.get("total_ms", 0) > 0, f"{key} latency is 0"


@pytest.mark.skipif(SKIP, reason="Healthcare agent not reachable")
class TestBenchmarkModule:
    """ModuleBenchmarking — model comparison."""

    def test_benchmark_classification(self):
        resp = httpx.post(
            f"{HEALTHCARE}/api/v1/benchmark/run",
            json={"task": "classification", "text": CLINICAL_TEXT, "models": ["granite-2b-cpu"]},
            timeout=60,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["models_compared"] >= 1
        for r in data["results"]:
            assert r["model"], "Empty model name"
            assert r["latency_ms"] > 0, f"Model {r['model']} latency is 0"
            assert r["output"], f"Model {r['model']} empty output"
            assert _not_nan(r["latency_ms"]), f"Model {r['model']} latency is NaN"


@pytest.mark.skipif(SKIP, reason="Healthcare agent not reachable")
class TestFusionModule:
    """ModuleFusion — panel + judge synthesis."""

    def test_fusion_returns_structured_judge(self):
        resp = httpx.post(
            f"{HEALTHCARE}/api/v1/fusion",
            json={"task": "compliance", "prompt": "Is this AML structuring? Three deposits of $9,500 in 48 hours."},
            timeout=120,
        )
        assert resp.status_code == 200
        data = resp.json()

        assert data["status"] == "complete"
        assert data["total_ms"] > 0, "Total latency is 0"
        assert _not_nan(data["total_ms"]), "Total latency is NaN"

        judge = data["judge"]
        assert judge["synthesis"], "Judge synthesis is empty"
        assert len(judge["synthesis"]) > 20, f"Synthesis too short: {len(judge['synthesis'])} chars"
        assert judge["model"], "Judge model is empty"
        assert judge["latency_ms"] > 0, "Judge latency is 0"

        panel = data["panel"]
        assert panel["count"] >= 2, f"Only {panel['count']} panel models responded"
        for r in panel["responses"]:
            assert r["model"], "Panel model empty"
            assert r["latency_ms"] > 0, f"Panel model {r['model']} latency is 0"


@pytest.mark.skipif(SKIP, reason="Healthcare agent not reachable")
class TestSpeculativeModule:
    """ModuleSpeculative — draft vs target comparison."""

    def test_speculative_status(self):
        resp = httpx.get(f"{HEALTHCARE}/api/v1/speculative/status", timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        assert data["draft_model"], "Draft model empty"
        assert data["target_model"], "Target model empty"
        assert data["mode"] in ("vllm-draft-model", "app-layer-draft")

    def test_speculative_run(self):
        resp = httpx.post(
            f"{HEALTHCARE}/api/v1/speculative/run",
            json={"text": CLINICAL_TEXT, "max_tokens": 64},
            timeout=120,
        )
        assert resp.status_code == 200
        data = resp.json()

        assert data["status"] == "complete"
        assert data["baseline"]["model"], "Baseline model empty"
        assert data["baseline"]["latency_ms"] > 0, "Baseline latency is 0"
        assert data["baseline"]["output"], "Baseline output empty"
        assert data["speculative"]["model"], "Speculative model empty"
        assert data["speculative"]["latency_ms"] > 0, "Speculative latency is 0"
        assert data["speculative"]["output"], "Speculative output empty"
        assert data["speedup"] is not None, "Speedup is None"
        assert _not_nan(data["speedup"]), "Speedup is NaN"
        assert data["speedup"] > 0, f"Speedup is {data['speedup']}"


@pytest.mark.skipif(SKIP, reason="Healthcare agent not reachable")
class TestAdaptiveCacheModule:
    """ModuleAdaptiveCache — cache warmup and stats."""

    def test_cache_stats(self):
        resp = httpx.get(f"{HEALTHCARE}/api/v1/adaptive/stats", timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        assert "total_lookups" in data
        assert "hit_rate" in data
        assert _not_nan(data["hit_rate"]), "Hit rate is NaN"

    def test_cache_warmup_produces_hit(self):
        httpx.post(f"{HEALTHCARE}/api/v1/adaptive/reset", timeout=10)
        for _ in range(3):
            httpx.post(
                f"{HEALTHCARE}/api/v1/pipeline",
                json={"text": "Simple lab report glucose 110"},
                timeout=60,
            )
        resp = httpx.post(
            f"{HEALTHCARE}/api/v1/pipeline",
            json={"text": "Simple lab report glucose 110"},
            timeout=60,
        )
        data = resp.json()
        classify_entry = next(
            (e for e in data.get("inference_log", []) if e["node"] == "classify"), None
        )
        assert classify_entry, "No classify entry in inference_log"
        assert classify_entry.get("kv_cache_hit") is True, "Cache did not hit after warmup"
        assert classify_entry["latency_ms"] < 50, f"Cached classify took {classify_entry['latency_ms']}ms"


@pytest.mark.skipif(SKIP, reason="Healthcare agent not reachable")
class TestMcpToolsModule:
    """ModuleMcpTools — pipeline with drug interactions."""

    def test_pipeline_finds_drug_interactions(self):
        resp = httpx.post(
            f"{HEALTHCARE}/api/v1/pipeline",
            json={
                "text": "Patient on Metformin 500mg, Lisinopril 10mg, Aspirin 81mg, and Clopidogrel 75mg.",
                "skip_cache": True,
            },
            timeout=120,
        )
        assert resp.status_code == 200
        data = resp.json()

        interactions = data.get("drug_interactions", [])
        assert len(interactions) > 0, "No drug interactions found — MCP tool may not be responding"

        mcp_entry = next(
            (e for e in data.get("inference_log", []) if e["node"] == "check_interactions"), None
        )
        assert mcp_entry, "No check_interactions node in inference_log"
        assert mcp_entry["latency_ms"] >= 0

        ner_entry = next(
            (e for e in data.get("inference_log", []) if e["node"] == "extract_entities"), None
        )
        assert ner_entry, "No extract_entities node in inference_log"
        assert ner_entry["latency_ms"] > 0, "NER latency is 0"

        if mcp_entry["latency_ms"] > 0 and ner_entry["latency_ms"] > 0:
            speedup = ner_entry["latency_ms"] / max(mcp_entry["latency_ms"], 1)
            assert _not_nan(speedup), "MCP vs LLM speedup is NaN"


@pytest.mark.skipif(not _is_reachable(ROUTER), reason="Semantic router not reachable")
class TestSemanticRouterModule:
    """ModuleSemanticRouting + ModuleHeterogeneous — routing decisions."""

    def test_simple_routes_to_cpu(self):
        resp = httpx.post(
            f"{ROUTER}/classify",
            json={"text": "Classify this clinical document type"},
            timeout=10,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["route"] == "simple"
        assert data["model"], "Model empty"
        assert 0 < data["confidence"] <= 1, f"Confidence {data['confidence']}"
        assert _not_nan(data["confidence"]), "Confidence is NaN"
        assert data["latency_ms"] >= 0
        assert data["hardware"] in ("cpu", "gpu")

    def test_complex_routes_to_gpu(self):
        resp = httpx.post(
            f"{ROUTER}/classify",
            json={"text": "Provide differential diagnosis considering drug interactions, renal function, and cardiovascular risk with comorbidities"},
            timeout=10,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["route"] == "complex"
        assert data["hardware"] == "gpu", f"Complex text routed to {data['hardware']}"
        assert data["model"], "Model empty on complex route"

    def test_all_six_samples_return_valid_data(self):
        """Same 6 prompts the module pages use."""
        samples = [
            "Classify this clinical document type",
            "What type of report is this",
            "Summarize this patient record for physician handoff",
            "List all medications mentioned in this clinical note",
            "Provide a differential diagnosis for this presentation considering drug interactions and renal function",
            "Synthesize the findings and evaluate the cardiovascular risk given comorbidities and contraindications",
        ]
        for text in samples:
            resp = httpx.post(f"{ROUTER}/classify", json={"text": text}, timeout=10)
            assert resp.status_code == 200
            data = resp.json()
            assert data["route"] in ("simple", "medium", "complex"), f"Invalid route: {data['route']}"
            assert data["model"], f"Empty model for: {text[:30]}"
            assert _not_nan(data["confidence"]), f"NaN confidence for: {text[:30]}"
            assert data["confidence"] > 0, f"Zero confidence for: {text[:30]}"


@pytest.mark.skipif(not _is_reachable(BITNET), reason="BitNet edge-agent not reachable")
class TestBitNetModule:
    """Act03EdgeLive + Act04SidecarLive — BitNet inference."""

    def test_bitnet_chat_completions(self):
        resp = httpx.post(
            f"{BITNET}/v1/chat/completions",
            json={
                "model": "bitnet-2b4t",
                "messages": [{"role": "user", "content": "Vibration 6.8mm/s baseline 4.2. Anomaly?"}],
                "max_tokens": 48,
            },
            timeout=60,
        )
        assert resp.status_code == 200
        data = resp.json()

        assert data["choices"], "No choices in response"
        content = data["choices"][0]["message"]["content"]
        assert content, "BitNet returned empty content"
        assert len(content) > 10, f"BitNet content too short: {len(content)} chars"

        usage = data.get("usage", {})
        assert usage.get("completion_tokens", 0) > 0, "BitNet 0 completion tokens"


@pytest.mark.skipif(not _is_reachable(FINSERV), reason="FinServ agent not reachable")
class TestFinServModule:
    """Act02 Step 2 — fraud scoring."""

    def test_score_transaction(self):
        resp = httpx.post(
            f"{FINSERV}/api/v1/score-transaction",
            json={
                "transaction_id": "tx-smoke-001",
                "amount": 15000,
                "currency": "USD",
                "merchant_category": "wire_transfer",
                "country": "NG",
                "customer_id": "cust-042",
            },
            timeout=60,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "risk_score" in data or "score" in data, "No risk score in response"


@pytest.mark.skipif(SKIP, reason="Healthcare agent not reachable")
class TestHealthEndpoints:
    """Basic health checks — all services respond."""

    def test_healthcare_health(self):
        resp = httpx.get(f"{HEALTHCARE}/health", timeout=5)
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"

    def test_healthcare_agent_card(self):
        resp = httpx.get(f"{HEALTHCARE}/.well-known/agent-card.json", timeout=5)
        assert resp.status_code == 200
        card = resp.json()
        assert card["name"] == "Healthcare Agent"

    def test_healthcare_modules(self):
        resp = httpx.get(f"{HEALTHCARE}/api/v1/modules", timeout=5)
        assert resp.status_code == 200
        data = resp.json()
        assert "enabled" in data or isinstance(data, list), "Unexpected modules response format"

    def test_healthcare_stats(self):
        resp = httpx.get(f"{HEALTHCARE}/api/v1/stats", timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        for key in ("classify", "extract_entities", "summarize"):
            if key in data:
                entry = data[key]
                assert _not_nan(entry.get("median_ms", 0)), f"Stats {key} median is NaN"
                assert _not_nan(entry.get("last_request_ms", 0)), f"Stats {key} last_request is NaN"
