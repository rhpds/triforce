"""Tests for healthcare agent A2A protocol compliance."""

import pytest
from fastapi.testclient import TestClient

from agent import app


@pytest.fixture
def client():
    return TestClient(app)


class TestAgentCard:
    def test_agent_card_returns_200(self, client):
        resp = client.get("/.well-known/agent-card.json")
        assert resp.status_code == 200

    def test_agent_card_has_required_fields(self, client):
        card = client.get("/.well-known/agent-card.json").json()
        for field in ["name", "description", "version", "url", "protocolVersion", "capabilities", "skills"]:
            assert field in card, f"Agent card missing required field: {field}"

    def test_agent_card_has_skills(self, client):
        card = client.get("/.well-known/agent-card.json").json()
        skill_ids = [s["id"] for s in card["skills"]]
        assert "classify-document" in skill_ids
        assert "extract-entities" in skill_ids
        assert "summarize-record" in skill_ids

    def test_agent_card_name(self, client):
        card = client.get("/.well-known/agent-card.json").json()
        assert card["name"] == "Healthcare Agent"


class TestA2AEndpoint:
    def test_tasks_send_returns_200(self, client):
        resp = client.post("/a2a", json={
            "jsonrpc": "2.0",
            "id": "test-1",
            "method": "tasks/send",
            "params": {
                "id": "task-1",
                "message": {
                    "messageId": "msg-1",
                    "kind": "message",
                    "role": "user",
                    "parts": [{"kind": "text", "text": "Classify this document"}],
                },
            },
        })
        assert resp.status_code == 200

    def test_tasks_send_returns_jsonrpc(self, client):
        resp = client.post("/a2a", json={
            "jsonrpc": "2.0",
            "id": "test-2",
            "method": "tasks/send",
            "params": {
                "id": "task-2",
                "message": {
                    "messageId": "msg-2",
                    "kind": "message",
                    "role": "user",
                    "parts": [{"kind": "text", "text": "test"}],
                },
            },
        })
        data = resp.json()
        assert data["jsonrpc"] == "2.0"
        assert data["id"] == "test-2"
        assert "result" in data

    def test_tasks_send_returns_task_with_status(self, client):
        resp = client.post("/a2a", json={
            "jsonrpc": "2.0",
            "id": "test-3",
            "method": "tasks/send",
            "params": {
                "id": "task-3",
                "message": {
                    "messageId": "msg-3",
                    "kind": "message",
                    "role": "user",
                    "parts": [{"kind": "text", "text": "test"}],
                },
            },
        })
        result = resp.json()["result"]
        assert result["kind"] == "task"
        assert result["status"]["state"] in ["pending", "running", "completed", "failed"]

    def test_tasks_get_returns_200(self, client):
        resp = client.post("/a2a", json={
            "jsonrpc": "2.0",
            "id": "test-4",
            "method": "tasks/get",
            "params": {"id": "task-1"},
        })
        assert resp.status_code == 200

    def test_unknown_method_returns_error(self, client):
        resp = client.post("/a2a", json={
            "jsonrpc": "2.0",
            "id": "test-5",
            "method": "unknown/method",
            "params": {},
        })
        data = resp.json()
        assert "error" in data


class TestHealthEndpoint:
    def test_health_returns_200(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200

    def test_health_returns_service_name(self, client):
        data = client.get("/health").json()
        assert data["service"] == "healthcare-agent"

    def test_health_returns_status(self, client):
        data = client.get("/health").json()
        assert data["status"] in ["healthy", "degraded", "unhealthy"]


class TestClassifyEndpoint:
    def test_classify_returns_200(self, client):
        resp = client.post("/api/v1/classify", json={"text": "Patient discharged in stable condition with follow-up in 2 weeks."})
        assert resp.status_code == 200

    def test_classify_returns_required_fields(self, client):
        data = client.post("/api/v1/classify", json={"text": "Patient discharged in stable condition."}).json()
        assert "classification" in data
        assert "confidence" in data
        assert "model" in data
        assert "inference_ms" in data

    def test_classify_returns_valid_type(self, client):
        data = client.post("/api/v1/classify", json={"text": "test"}).json()
        valid_types = ["discharge_summary", "progress_note", "lab_report", "radiology_report",
                       "pathology_report", "surgical_note", "consultation", "prescription", "unknown"]
        assert data["classification"] in valid_types

    def test_classify_rejects_empty_text(self, client):
        resp = client.post("/api/v1/classify", json={"text": ""})
        assert resp.status_code == 422


class TestExtractEntitiesEndpoint:
    def test_extract_returns_200(self, client):
        resp = client.post("/api/v1/extract-entities", json={"text": "Patient has Type 2 Diabetes and is on Metformin 500mg."})
        assert resp.status_code == 200

    def test_extract_returns_required_fields(self, client):
        data = client.post("/api/v1/extract-entities", json={"text": "Patient has diabetes."}).json()
        assert "entities" in data
        assert "model" in data
        assert "inference_ms" in data


class TestSummarizeEndpoint:
    def test_summarize_returns_200(self, client):
        resp = client.post("/api/v1/summarize", json={"text": "Patient is a 65-year-old male presenting with chest pain."})
        assert resp.status_code == 200

    def test_summarize_returns_required_fields(self, client):
        data = client.post("/api/v1/summarize", json={"text": "Patient presenting with symptoms."}).json()
        assert "summary" in data
        assert "model" in data
        assert "inference_ms" in data
