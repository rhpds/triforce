"""E2E integration tests for finserv agent workflow.

These tests validate:
- FinServ agent responds to A2A protocol correctly
- Fraud scoring and compliance endpoints return contract-compliant responses
- Agent card discovery works for orchestrator integration

Requires: finserv agent running on localhost:8082
Run with: docker compose up finserv-agent
"""

import sys
import pathlib

import pytest
import httpx

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent / "synthetic"))

import os

FINSERV_URL = os.environ.get("FINSERV_URL", "http://localhost:8082")


def agent_is_running():
    try:
        resp = httpx.get(f"{FINSERV_URL}/health", timeout=2.0)
        return resp.status_code == 200
    except Exception:
        return False


skip_if_not_running = pytest.mark.skipif(
    not agent_is_running(),
    reason=f"FinServ agent not running at {FINSERV_URL}",
)


@skip_if_not_running
class TestFinServA2AIntegration:
    """Stage 4: A2A protocol works end-to-end."""

    def test_agent_card_discovery(self):
        resp = httpx.get(f"{FINSERV_URL}/.well-known/agent-card.json")
        assert resp.status_code == 200
        card = resp.json()
        assert card["name"] == "Financial Services Agent"
        assert card["protocolVersion"] == "0.2.6"
        assert len(card["skills"]) >= 3

    def test_a2a_task_send(self):
        resp = httpx.post(f"{FINSERV_URL}/a2a", json={
            "jsonrpc": "2.0",
            "id": "e2e-fs-1",
            "method": "tasks/send",
            "params": {
                "id": "task-fs-1",
                "message": {
                    "messageId": "msg-fs-1",
                    "kind": "message",
                    "role": "user",
                    "parts": [{"kind": "text", "text": "Score this transaction for fraud"}],
                },
            },
        }, timeout=10.0)
        assert resp.status_code == 200
        data = resp.json()
        assert data["jsonrpc"] == "2.0"
        assert data["result"]["kind"] == "task"
        assert data["result"]["status"]["state"] == "completed"


@skip_if_not_running
class TestFinServFraudIntegration:
    """Stage 4: Fraud scoring works with synthetic data."""

    def test_score_low_risk_transaction(self):
        from finserv_generator import generate_transaction
        tx = generate_transaction(suspicious=False)
        tx["amount"] = 50.0

        resp = httpx.post(f"{FINSERV_URL}/api/v1/score-transaction",
                          json={"transaction": tx}, timeout=10.0)
        assert resp.status_code == 200
        data = resp.json()
        assert data["risk_level"] == "low"
        assert data["recommendation"] == "approve"
        assert data["accelerator"] == "cpu"

    def test_score_high_risk_transaction(self):
        from finserv_generator import generate_transaction
        tx = generate_transaction(suspicious=True)
        tx["amount"] = 75000.0

        resp = httpx.post(f"{FINSERV_URL}/api/v1/score-transaction",
                          json={"transaction": tx}, timeout=10.0)
        assert resp.status_code == 200
        data = resp.json()
        assert data["risk_score"] > 30
        assert data["accelerator"] == "cpu"

    def test_check_compliance(self):
        from finserv_generator import generate_transaction
        tx = generate_transaction()

        resp = httpx.post(f"{FINSERV_URL}/api/v1/check-compliance",
                          json={"transaction": tx, "regulations": ["aml", "kyc"]},
                          timeout=10.0)
        assert resp.status_code == 200
        data = resp.json()
        assert "compliant" in data
        assert "checks" in data
        assert len(data["checks"]) == 2
        assert data["accelerator"] == "cpu"

    def test_assess_risk(self):
        resp = httpx.post(f"{FINSERV_URL}/api/v1/assess-risk",
                          json={"customer_id": "cust-1234"},
                          timeout=10.0)
        assert resp.status_code == 200
        data = resp.json()
        assert data["customer_id"] == "cust-1234"
        assert 0 <= data["risk_score"] <= 100
        assert data["risk_level"] in ["low", "medium", "high", "critical"]
        assert data["accelerator"] == "cpu"


@skip_if_not_running
class TestFinServContractCompliance:
    """Stage 3: Responses match OpenAPI contract schemas."""

    def test_fraud_score_response_schema(self):
        from finserv_generator import generate_transaction
        tx = generate_transaction()

        resp = httpx.post(f"{FINSERV_URL}/api/v1/score-transaction",
                          json={"transaction": tx}, timeout=10.0)
        data = resp.json()
        required = ["transaction_id", "risk_score", "risk_level", "signals", "model", "inference_ms"]
        for field in required:
            assert field in data, f"Missing required field: {field}"

    def test_compliance_response_schema(self):
        from finserv_generator import generate_transaction
        tx = generate_transaction()

        resp = httpx.post(f"{FINSERV_URL}/api/v1/check-compliance",
                          json={"transaction": tx}, timeout=10.0)
        data = resp.json()
        required = ["transaction_id", "compliant", "checks", "model", "inference_ms"]
        for field in required:
            assert field in data, f"Missing required field: {field}"
