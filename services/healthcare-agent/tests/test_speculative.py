"""Tests for speculative decoding public endpoints."""

import pytest
from fastapi.testclient import TestClient

import speculative
from agent import app


@pytest.fixture
def client():
    return TestClient(app)


def test_speculative_status_reports_config(monkeypatch, client):
    monkeypatch.setenv("MODULES_ENABLED", "benchmarking,speculative,fusion")
    monkeypatch.setenv("SPECULATIVE_DRAFT_MODEL", "granite-350m")
    monkeypatch.setenv("SPECULATIVE_TARGET_MODEL", "granite-2b-cpu")
    monkeypatch.setenv("SPECULATIVE_MODEL", "granite-2b-cpu-speculative")

    data = client.get("/api/v1/speculative/status").json()

    assert data["enabled"] is True
    assert data["draft_model"] == "granite-350m"
    assert data["baseline_model"] == "granite-2b-cpu"
    assert data["speculative_model"] == "granite-2b-cpu-speculative"
    assert data["num_speculative_tokens"] == 5
    assert data["claim_threshold"] == 1.5


@pytest.mark.asyncio
async def test_speculative_run_computes_speedup(monkeypatch):
    async def fake_call(model, text, task, max_tokens):
        latency = 1000 if model == "granite-2b-cpu" else 500
        return {
            "model": model,
            "task": task,
            "latency_ms": latency,
            "output": f"{model} output",
            "prompt_tokens": 12,
            "output_tokens": 24,
        }

    monkeypatch.setattr(speculative, "_call_model", fake_call)

    data = await speculative.run("Patient summary", "summarization", 64)

    assert data["status"] == "complete"
    assert data["baseline"]["model"] == "granite-2b-cpu"
    assert data["speculative"]["model"] == "granite-2b-cpu-speculative"
    assert data["speedup"] == 2.0
    assert data["baseline"]["output_tokens"] == 24
    assert "2.0x faster" in data["message"]


def test_speculative_endpoint_rejects_empty_text(client):
    data = client.post("/api/v1/speculative/run", json={"text": ""}).json()
    assert data["error"] == "text is required"
