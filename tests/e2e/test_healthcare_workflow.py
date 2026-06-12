"""E2E integration tests for healthcare agent workflow.

These tests validate:
- Healthcare agent responds to A2A protocol correctly
- Clinical NLP endpoints return contract-compliant responses
- Agent card discovery works for orchestrator integration

Requires: healthcare agent running on localhost:8081
Run with: docker compose up healthcare-agent
"""

import sys
import pathlib

import pytest
import httpx

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent / "synthetic"))

import os

HEALTHCARE_URL = os.environ.get("HEALTHCARE_URL", "http://localhost:8081")


def agent_is_running():
    try:
        resp = httpx.get(f"{HEALTHCARE_URL}/health", timeout=2.0)
        return resp.status_code == 200
    except Exception:
        return False


skip_if_not_running = pytest.mark.skipif(
    not agent_is_running(),
    reason=f"Healthcare agent not running at {HEALTHCARE_URL}",
)


@skip_if_not_running
class TestHealthcareA2AIntegration:
    """Stage 4: A2A protocol works end-to-end."""

    def test_agent_card_discovery(self):
        resp = httpx.get(f"{HEALTHCARE_URL}/.well-known/agent-card.json")
        assert resp.status_code == 200
        card = resp.json()
        assert card["name"] == "Healthcare Agent"
        assert card["protocolVersion"] == "0.2.6"
        assert len(card["skills"]) >= 3

    def test_a2a_task_send_classify(self):
        resp = httpx.post(f"{HEALTHCARE_URL}/a2a", json={
            "jsonrpc": "2.0",
            "id": "e2e-1",
            "method": "tasks/send",
            "params": {
                "id": "task-e2e-1",
                "message": {
                    "messageId": "msg-e2e-1",
                    "kind": "message",
                    "role": "user",
                    "parts": [{"kind": "text", "text": "Classify this discharge summary for a patient with diabetes"}],
                },
            },
        }, timeout=30.0)
        assert resp.status_code == 200
        data = resp.json()
        assert data["jsonrpc"] == "2.0"
        assert data["result"]["kind"] == "task"
        assert data["result"]["status"]["state"] == "completed"
        assert len(data["result"]["artifacts"]) > 0

    def test_a2a_task_get(self):
        resp = httpx.post(f"{HEALTHCARE_URL}/a2a", json={
            "jsonrpc": "2.0",
            "id": "e2e-2",
            "method": "tasks/get",
            "params": {"id": "task-e2e-1"},
        }, timeout=5.0)
        assert resp.status_code == 200
        assert resp.json()["result"]["kind"] == "task"


@skip_if_not_running
class TestHealthcareNLPIntegration:
    """Stage 4: Clinical NLP endpoints work with real LiteLLM."""

    def test_classify_document(self):
        from healthcare_generator import generate_patient_record
        record = generate_patient_record("discharge_summary")

        resp = httpx.post(f"{HEALTHCARE_URL}/api/v1/classify",
                          json={"text": record["text"]}, timeout=30.0)
        assert resp.status_code == 200
        data = resp.json()
        assert data["classification"] in [
            "discharge_summary", "progress_note", "lab_report",
            "radiology_report", "pathology_report", "surgical_note",
            "consultation", "prescription", "unknown",
        ]
        assert 0 <= data["confidence"] <= 1
        assert data["accelerator"] == "cpu"
        assert data["inference_ms"] >= 0

    def test_extract_entities(self):
        resp = httpx.post(f"{HEALTHCARE_URL}/api/v1/extract-entities",
                          json={"text": "Patient has Type 2 Diabetes (E11.9) and is on Metformin 500mg twice daily. History of Hypertension."},
                          timeout=30.0)
        assert resp.status_code == 200
        data = resp.json()
        assert "entities" in data
        assert data["accelerator"] == "cpu"

    def test_summarize_record(self):
        from healthcare_generator import generate_patient_record
        record = generate_patient_record("discharge_summary")

        resp = httpx.post(f"{HEALTHCARE_URL}/api/v1/summarize",
                          json={"text": record["text"], "max_length": 200},
                          timeout=30.0)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["summary"]) > 0
        assert data["accelerator"] == "cpu"


@skip_if_not_running
class TestHealthcareContractCompliance:
    """Stage 3: Responses match OpenAPI contract schemas."""

    def test_health_response_schema(self):
        resp = httpx.get(f"{HEALTHCARE_URL}/health")
        data = resp.json()
        assert "status" in data
        assert data["status"] in ["healthy", "degraded", "unhealthy"]
        assert data["service"] == "healthcare-agent"
        assert "version" in data

    def test_classify_response_schema(self):
        resp = httpx.post(f"{HEALTHCARE_URL}/api/v1/classify",
                          json={"text": "Patient discharged in stable condition."}, timeout=30.0)
        data = resp.json()
        required_fields = ["classification", "confidence", "model", "inference_ms"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        assert isinstance(data["confidence"], (int, float))
        assert isinstance(data["inference_ms"], int)

    def test_agent_card_schema(self):
        resp = httpx.get(f"{HEALTHCARE_URL}/.well-known/agent-card.json")
        card = resp.json()
        required_fields = ["name", "description", "version", "url", "protocolVersion", "capabilities", "skills"]
        for field in required_fields:
            assert field in card, f"Agent card missing: {field}"
        assert isinstance(card["skills"], list)
        for skill in card["skills"]:
            assert "id" in skill
            assert "name" in skill
            assert "description" in skill
