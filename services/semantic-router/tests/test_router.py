"""RED tests for the vLLM Semantic Router service.

Classifies request complexity and recommends the right model.
Runs on CPU — keyword/embedding classification, no LLM call.
"""

import pytest
from fastapi.testclient import TestClient


class TestRouterHealth:
    def test_health_returns_200(self):
        from router import app
        client = TestClient(app)
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["service"] == "semantic-router"

    def test_health_shows_route_count(self):
        from router import app
        client = TestClient(app)
        resp = client.get("/health")
        assert "routes" in resp.json()
        assert resp.json()["routes"] >= 2


class TestRouteClassification:
    def test_simple_query_classified(self):
        from router import app
        client = TestClient(app)
        resp = client.post("/classify", json={
            "text": "What type of document is this?"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["route"] in ["simple", "complex"]
        assert "model" in data
        assert "latency_ms" in data
        assert "confidence" in data

    def test_complex_query_detected(self):
        from router import app
        client = TestClient(app)
        resp = client.post("/classify", json={
            "text": "Analyze the drug interactions between Warfarin, Aspirin, Metformin, and Lisinopril considering the patient's renal function, recent inferior STEMI, and provide a comprehensive differential diagnosis with ICD-10 codes and treatment plan."
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["route"] == "complex"

    def test_simple_returns_small_model(self):
        from router import app
        client = TestClient(app)
        resp = client.post("/classify", json={
            "text": "Classify this discharge summary."
        })
        data = resp.json()
        if data["route"] == "simple":
            assert data["model"] == "granite-2b-cpu"

    def test_complex_returns_larger_model(self):
        from router import app
        client = TestClient(app)
        resp = client.post("/classify", json={
            "text": "Perform multi-step reasoning: analyze drug interactions, cross-reference with patient history, evaluate renal function impact, and generate a risk-adjusted treatment plan with contraindications."
        })
        data = resp.json()
        if data["route"] == "complex":
            assert data["model"] in ["qwen25-3b-cpu", "phi3-mini-cpu"]

    def test_confidence_between_0_and_1(self):
        from router import app
        client = TestClient(app)
        resp = client.post("/classify", json={"text": "hello"})
        data = resp.json()
        assert 0 <= data["confidence"] <= 1

    def test_latency_under_100ms(self):
        from router import app
        client = TestClient(app)
        resp = client.post("/classify", json={"text": "classify this document"})
        assert resp.json()["latency_ms"] < 100


class TestRouteConfig:
    def test_routes_endpoint_exists(self):
        from router import app
        client = TestClient(app)
        resp = client.get("/routes")
        assert resp.status_code == 200

    def test_routes_has_simple_and_complex(self):
        from router import app
        client = TestClient(app)
        routes = client.get("/routes").json()["routes"]
        names = [r["name"] for r in routes]
        assert "simple" in names
        assert "complex" in names

    def test_each_route_has_model(self):
        from router import app
        client = TestClient(app)
        routes = client.get("/routes").json()["routes"]
        for route in routes:
            assert "model" in route
            assert "keywords" in route


class TestBatchClassification:
    def test_batch_endpoint(self):
        from router import app
        client = TestClient(app)
        resp = client.post("/classify/batch", json={
            "texts": [
                "What is this document?",
                "Analyze drug interactions for a complex multi-morbidity patient.",
                "Classify the lab report.",
            ]
        })
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["results"]) == 3
        for result in data["results"]:
            assert "route" in result
            assert "model" in result
