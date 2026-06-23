"""Stage 10: End-to-end workflow validation across modules."""

import os
import pytest
import httpx

HEALTHCARE_URL = os.environ.get("HEALTHCARE_URL", "http://localhost:8081")
FINSERV_URL = os.environ.get("FINSERV_URL", "http://localhost:8082")
ORCHESTRATOR_URL = os.environ.get("ORCHESTRATOR_URL", "http://localhost:8083")
SKIP_LIVE = not os.environ.get("LITELLM_API_KEY", "")

SAMPLE_TEXT = (
    "DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes "
    "on Metformin 500mg and Lisinopril 10mg. Recent STEMI with PCI to RCA."
)


@pytest.mark.skipif(SKIP_LIVE, reason="LITELLM_API_KEY not set")
class TestCPUPipelineWorkflow:
    """stage_10: Full healthcare pipeline on CPU with real provenance."""

    def test_pipeline_completes(self):
        resp = httpx.post(
            f"{HEALTHCARE_URL}/api/v1/pipeline",
            json={"text": SAMPLE_TEXT},
            timeout=60,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["classification"] in [
            "discharge_summary", "progress_note", "lab_report",
            "radiology_report", "pathology_report", "surgical_note",
            "consultation", "prescription",
        ]
        assert len(data["entities"]) > 0
        assert data["total_ms"] > 0

    def test_pipeline_has_real_model_provenance(self):
        resp = httpx.post(
            f"{HEALTHCARE_URL}/api/v1/pipeline",
            json={"text": SAMPLE_TEXT},
            timeout=60,
        )
        data = resp.json()
        for entry in data["inference_log"]:
            model = entry.get("model", "")
            assert model != "", f"Empty model in inference_log: {entry}"
            assert model != "unknown", f"Unknown model in inference_log: {entry}"
            assert entry.get("latency_ms", -1) >= 0

    def test_pipeline_reports_kv_cache_hit(self):
        resp = httpx.post(
            f"{HEALTHCARE_URL}/api/v1/pipeline",
            json={"text": SAMPLE_TEXT},
            timeout=60,
        )
        data = resp.json()
        classify_entry = data["inference_log"][0]
        assert "kv_cache_hit" in classify_entry or classify_entry.get("model") == "adaptive-cache"


@pytest.mark.skipif(SKIP_LIVE, reason="LITELLM_API_KEY not set")
class TestFraudScoringWorkflow:
    """stage_10: Fraud scoring returns real LLM + rule scores."""

    def test_fraud_scoring_e2e(self):
        try:
            httpx.get(f"{FINSERV_URL}/health", timeout=5)
        except httpx.ConnectError:
            pytest.skip("FinServ agent not running")
        resp = httpx.post(
            f"{FINSERV_URL}/api/v1/score-transaction",
            json={
                "transaction_id": "tx-test-workflow",
                "amount": 15000.00,
                "country": "NG",
                "merchant_category": "wire_transfer",
            },
            timeout=30,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "rule_score" in data
        assert "llm_score" in data
        assert "risk_score" in data
        assert data["model"] != ""
        assert data["inference_ms"] > 0


class TestA2ADiscoveryWorkflow:
    """stage_10: Orchestrator discovers both agents via A2A."""

    def test_orchestrator_discovers_agents(self):
        try:
            resp = httpx.get(f"{ORCHESTRATOR_URL}/api/v1/agents", timeout=10)
        except httpx.ConnectError:
            pytest.skip("Orchestrator not running")
        assert resp.status_code == 200
        data = resp.json()
        names = [a["name"] for a in data.get("agents", [])]
        assert len(names) >= 2

    def test_healthcare_agent_card(self):
        resp = httpx.get(f"{HEALTHCARE_URL}/.well-known/agent-card.json", timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Healthcare Agent"
        assert len(data["skills"]) >= 3


@pytest.mark.skipif(SKIP_LIVE, reason="LITELLM_API_KEY not set")
class TestAdaptiveLearningWorkflow:
    """stage_10: Adaptive cache hit rate increases with volume."""

    def test_cache_learns_from_repeated_text(self):
        for _ in range(3):
            httpx.post(
                f"{HEALTHCARE_URL}/api/v1/pipeline",
                json={"text": SAMPLE_TEXT},
                timeout=60,
            )
        stats = httpx.get(f"{HEALTHCARE_URL}/api/v1/adaptive/stats", timeout=10).json()
        assert stats["cache_size"] >= 1
        assert stats["cache_hits"] >= 1
        assert stats["hit_rate"] > 0


class TestModulesEndpoint:
    """stage_10: Modules endpoint reports active modules."""

    def test_modules_endpoint_exists(self):
        resp = httpx.get(f"{HEALTHCARE_URL}/api/v1/modules", timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        assert "enabled" in data
        assert "count" in data
        assert isinstance(data["enabled"], list)
