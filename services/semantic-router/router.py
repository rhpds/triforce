"""Triforce Semantic Router — Config-driven multi-model request routing.

Routes requests to the optimal model based on semantic similarity:
  SIMPLE  → CPU small model (classification, NER)
  MEDIUM  → CPU medium model (summarization, analysis)
  COMPLEX → CPU large or Gaudi model (reasoning, diagnosis)

Configuration loaded from routes.yaml (or ConfigMap on K8s).
Uses sentence-transformers for embedding classification.
Falls back to keyword matching if model unavailable.
"""

import logging
import os
import time
from pathlib import Path
from typing import Optional

import numpy as np
import uvicorn
import yaml
from fastapi import FastAPI

app = FastAPI(title="Triforce Semantic Router", version="0.4.0")
logger = logging.getLogger("semantic-router")

SERVICE_PORT = int(os.environ.get("SEMANTIC_ROUTER_PORT", "8094"))

_config = {}
_routes = []
_model = None
_anchor_embeddings: dict[str, np.ndarray] = {}


def _load_config():
    global _config, _routes

    config_paths = [
        os.environ.get("ROUTES_CONFIG", ""),
        "/app/config/routes.yaml",
        str(Path(__file__).with_name("routes.yaml")),
        "./routes.yaml",
    ]

    for path in config_paths:
        if path and Path(path).exists():
            _config = yaml.safe_load(Path(path).read_text())
            _routes = _config.get("routes", [])
            logger.info("Loaded config from %s — %d routes, version %s",
                        path, len(_routes), _config.get("version", "?"))
            return path

    logger.warning("No routes.yaml found — router will have no routes")
    return None


def _get_scoring():
    scoring = _config.get("scoring", {})
    weights = scoring.get("weights", {})
    return {
        "embedding_max": weights.get("embedding_max", 0.7),
        "embedding_avg": weights.get("embedding_avg", 0.3),
        "confidence_cap": scoring.get("confidence_cap", 0.99),
        "word_count_thresholds": scoring.get("word_count_thresholds", {"complex": 80, "medium": 40}),
    }


def _get_heterogeneous():
    hetero = _config.get("heterogeneous", {})
    env_enabled = os.environ.get("HETEROGENEOUS_ROUTING", "").lower() == "true"
    return {
        "enabled": hetero.get("enabled", False) or env_enabled,
        "gpu_model": os.environ.get("GPU_COMPLEX_MODEL", hetero.get("gpu_model", "granite-4.1-8b")),
        "escalation_routes": hetero.get("escalation_routes", ["complex"]),
    }


def _load_model():
    global _model, _anchor_embeddings
    if _model is not None:
        return

    embedding_config = _config.get("embedding", {})
    model_name = os.environ.get("EMBEDDING_MODEL", embedding_config.get("model", "all-MiniLM-L6-v2"))

    try:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading embedding model: %s", model_name)
        start = time.monotonic()
        try:
            _model = SentenceTransformer(model_name, backend="onnx",
                                         model_kwargs={"file_name": "onnx/model_qint8_avx512.onnx"})
            logger.info("Using ONNX backend (qint8_avx512) for embedding model")
        except Exception as e1:
            try:
                _model = SentenceTransformer(model_name, backend="onnx")
                logger.info("Using ONNX backend (default) for embedding model")
            except Exception:
                _model = SentenceTransformer(model_name)
                logger.info("ONNX not available, using PyTorch backend")

        for route in _routes:
            anchors = route.get("anchors", [])
            if anchors:
                embeddings = _model.encode(anchors, convert_to_numpy=True)
                _anchor_embeddings[route["name"]] = embeddings

        load_time = int((time.monotonic() - start) * 1000)
        total_anchors = sum(len(r.get("anchors", [])) for r in _routes)
        logger.info("Embedding model loaded in %dms — %d anchors encoded", load_time, total_anchors)
    except Exception as e:
        logger.warning("Failed to load embedding model: %s. Falling back to keyword matching.", e)
        _model = None


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8))


def _classify_by_embedding(text: str) -> Optional[dict]:
    if _model is None:
        return None

    scoring = _get_scoring()
    query_embedding = _model.encode([text], convert_to_numpy=True)[0]

    best_route = None
    best_score = -1.0
    scores = {}

    for route in _routes:
        anchor_embs = _anchor_embeddings.get(route["name"])
        if anchor_embs is None:
            continue
        similarities = [_cosine_similarity(query_embedding, anchor) for anchor in anchor_embs]
        max_sim = max(similarities)
        avg_sim = sum(similarities) / len(similarities)
        score = scoring["embedding_max"] * max_sim + scoring["embedding_avg"] * avg_sim
        scores[route["name"]] = round(score, 4)

        if score > best_score:
            best_score = score
            best_route = route

    if best_route is None:
        return None

    return {
        "route": best_route["name"],
        "model": best_route["model"],
        "model_params": best_route.get("params", ""),
        "confidence": round(min(best_score, scoring["confidence_cap"]), 3),
        "method": "embedding",
        "scores": scores,
    }


def _classify_by_keywords(text: str) -> dict:
    scoring = _get_scoring()
    text_lower = text.lower()
    scores = {}

    for route in _routes:
        score = 0
        for kw in route.get("keywords", []):
            if kw in text_lower:
                score += 1
        scores[route["name"]] = score

    thresholds = scoring["word_count_thresholds"]
    word_count = len(text.split())
    if word_count > thresholds.get("complex", 80):
        scores["complex"] = scores.get("complex", 0) + 2
    elif word_count > thresholds.get("medium", 40):
        scores["medium"] = scores.get("medium", 0) + 1

    total = sum(scores.values())
    if total == 0:
        best = "simple"
        confidence = 0.5
    else:
        best = max(scores, key=scores.get)
        confidence = min(scores[best] / (total + 1), scoring["confidence_cap"])

    route_config = next((r for r in _routes if r["name"] == best), _routes[0] if _routes else {"name": "simple", "model": "unknown"})
    return {
        "route": best,
        "model": route_config["model"],
        "model_params": route_config.get("params", ""),
        "confidence": round(confidence, 3),
        "method": "keyword",
        "scores": scores,
    }


def classify_request(text: str) -> dict:
    start = time.monotonic()

    result = _classify_by_embedding(text)
    if result is None:
        result = _classify_by_keywords(text)

    hetero = _get_heterogeneous()
    if hetero["enabled"] and result["route"] in hetero["escalation_routes"]:
        result["model"] = hetero["gpu_model"]
        result["hardware"] = "gpu"
    else:
        result["hardware"] = "cpu"

    result["heterogeneous"] = hetero["enabled"]
    result["latency_ms"] = int((time.monotonic() - start) * 1000)
    result["word_count"] = len(text.split())
    return result


config_source = _load_config()
_load_model()


@app.get("/health")
async def health():
    hetero = _get_heterogeneous()
    return {
        "status": "healthy",
        "service": "semantic-router",
        "version": "0.4.0",
        "config_version": _config.get("version", "unknown"),
        "config_source": config_source or "none",
        "routes": len(_routes),
        "models": [r["model"] for r in _routes],
        "method": "embedding" if _model is not None else "keyword",
        "heterogeneous": hetero["enabled"],
    }


@app.get("/routes")
async def list_routes():
    return [
        {
            "name": r["name"],
            "model": r["model"],
            "params": r.get("params", ""),
            "description": r.get("description", ""),
            "anchor_count": len(r.get("anchors", [])),
            "keyword_count": len(r.get("keywords", [])),
        }
        for r in _routes
    ]


@app.post("/classify")
async def classify(request: dict):
    text = request.get("text", "")
    if not text:
        return {"error": "text is required"}
    return classify_request(text)


@app.post("/route")
async def route(request: dict):
    return await classify(request)


@app.post("/classify/batch")
async def classify_batch(request: dict):
    texts = request.get("texts", [])
    return {"results": [classify_request(t) for t in texts]}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=SERVICE_PORT)
