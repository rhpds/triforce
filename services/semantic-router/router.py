"""Triforce Semantic Router — Multi-model request routing via embeddings.

Routes requests to the optimal CPU model based on semantic similarity:
  SIMPLE  → granite-2b-cpu (2B, fastest, classification/NER)
  MEDIUM  → qwen25-3b-cpu (3B, balanced, summarization/analysis)
  COMPLEX → phi3-mini-cpu (3.8B, deepest reasoning)

Uses sentence-transformers (all-MiniLM-L6-v2) for embedding-based
classification. Falls back to keyword matching if model unavailable.
Runs entirely on CPU — no GPU, no LLM call.
"""

import logging
import os
import re
import time
from typing import Optional

import numpy as np
import uvicorn
from fastapi import FastAPI

app = FastAPI(title="Triforce Semantic Router", version="0.3.0")
logger = logging.getLogger("semantic-router")

SERVICE_PORT = int(os.environ.get("SEMANTIC_ROUTER_PORT", "8094"))
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
HETEROGENEOUS_ENABLED = os.environ.get("HETEROGENEOUS_ROUTING", "false").lower() == "true"
GPU_COMPLEX_MODEL = os.environ.get("GPU_COMPLEX_MODEL", "granite-3-2-8b-instruct")

# Route definitions with anchor examples for embedding similarity
ROUTES = [
    {
        "name": "simple",
        "model": "granite-2b-cpu",
        "params": "2B",
        "description": "Fast classification, NER, simple Q&A, labeling",
        "anchors": [
            "Classify this clinical document",
            "What type of document is this",
            "Label this text",
            "Is this a discharge summary or a lab report",
            "Score this transaction",
            "Check if this is compliant",
            "What category does this belong to",
            "Tag this record",
            "Identify the document type",
        ],
        "keywords": [
            "classify", "what type", "what is", "label", "categorize",
            "identify", "tag", "score", "check", "is this",
        ],
    },
    {
        "name": "medium",
        "model": "qwen25-3b-cpu",
        "params": "3B",
        "description": "Summarization, extraction, structured analysis",
        "anchors": [
            "Summarize this patient record",
            "Extract the key findings from this report",
            "List all medications mentioned in this note",
            "Generate an overview of this case",
            "Describe the patient's condition",
            "Write a brief summary of the discharge",
            "Compile the lab results into a table",
            "Outline the treatment history",
        ],
        "keywords": [
            "summarize", "extract", "list", "describe", "outline",
            "generate", "write", "create", "compile", "overview",
        ],
    },
    {
        "name": "complex",
        "model": "phi3-mini-cpu",
        "params": "3.8B",
        "description": "Multi-step reasoning, differential diagnosis, treatment plans",
        "anchors": [
            "Analyze the drug interactions between Warfarin and Aspirin considering renal function",
            "Provide a differential diagnosis for this presentation",
            "Evaluate the risk factors and recommend a treatment plan",
            "Cross-reference the lab results with the medication list for contraindications",
            "Assess the patient's cardiovascular risk given their comorbidities",
            "Synthesize the findings and provide a comprehensive clinical assessment",
            "Justify the treatment decision considering the patient's history",
            "Compare the efficacy of two treatment approaches for this condition",
        ],
        "keywords": [
            "analyze", "differential", "interaction", "contraindication",
            "risk assessment", "treatment plan", "multi-step", "reasoning",
            "evaluate", "synthesize", "cross-reference", "justify",
        ],
    },
]

# Embedding model + precomputed anchor embeddings
_model = None
_anchor_embeddings: dict[str, np.ndarray] = {}


def _load_model():
    global _model, _anchor_embeddings
    if _model is not None:
        return

    try:
        from sentence_transformers import SentenceTransformer
        logger.info(f"Loading embedding model: {EMBEDDING_MODEL}")
        start = time.monotonic()
        _model = SentenceTransformer(EMBEDDING_MODEL)

        for route in ROUTES:
            embeddings = _model.encode(route["anchors"], convert_to_numpy=True)
            _anchor_embeddings[route["name"]] = embeddings

        load_time = int((time.monotonic() - start) * 1000)
        logger.info(f"Embedding model loaded in {load_time}ms — {sum(len(r['anchors']) for r in ROUTES)} anchors encoded")
    except Exception as e:
        logger.warning(f"Failed to load embedding model: {e}. Falling back to keyword matching.")
        _model = None


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8))


def _classify_by_embedding(text: str) -> Optional[dict]:
    if _model is None:
        return None

    query_embedding = _model.encode([text], convert_to_numpy=True)[0]

    best_route = None
    best_score = -1.0
    scores = {}

    for route in ROUTES:
        anchor_embs = _anchor_embeddings.get(route["name"])
        if anchor_embs is None:
            continue
        similarities = [_cosine_similarity(query_embedding, anchor) for anchor in anchor_embs]
        max_sim = max(similarities)
        avg_sim = sum(similarities) / len(similarities)
        score = 0.7 * max_sim + 0.3 * avg_sim
        scores[route["name"]] = round(score, 4)

        if score > best_score:
            best_score = score
            best_route = route

    if best_route is None:
        return None

    return {
        "route": best_route["name"],
        "model": best_route["model"],
        "model_params": best_route["params"],
        "confidence": round(min(best_score, 0.99), 3),
        "method": "embedding",
        "scores": scores,
    }


def _classify_by_keywords(text: str) -> dict:
    text_lower = text.lower()
    scores = {}

    for route in ROUTES:
        score = 0
        for kw in route["keywords"]:
            if kw in text_lower:
                score += 1
        scores[route["name"]] = score

    word_count = len(text.split())
    if word_count > 80:
        scores["complex"] = scores.get("complex", 0) + 2
    elif word_count > 40:
        scores["medium"] = scores.get("medium", 0) + 1

    total = sum(scores.values())
    if total == 0:
        best = "simple"
        confidence = 0.5
    else:
        best = max(scores, key=scores.get)
        confidence = min(scores[best] / (total + 1), 0.99)

    route_config = next(r for r in ROUTES if r["name"] == best)
    return {
        "route": best,
        "model": route_config["model"],
        "model_params": route_config["params"],
        "confidence": round(confidence, 3),
        "method": "keyword",
        "scores": scores,
    }


def classify_request(text: str) -> dict:
    start = time.monotonic()

    result = _classify_by_embedding(text)
    if result is None:
        result = _classify_by_keywords(text)

    if HETEROGENEOUS_ENABLED and result["route"] == "complex":
        result["model"] = GPU_COMPLEX_MODEL
        result["hardware"] = "gpu"
    else:
        result["hardware"] = "cpu"

    result["heterogeneous"] = HETEROGENEOUS_ENABLED
    result["latency_ms"] = int((time.monotonic() - start) * 1000)
    result["word_count"] = len(text.split())
    return result


@app.on_event("startup")
async def startup():
    _load_model()


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "semantic-router",
        "version": "0.3.0",
        "routes": len(ROUTES),
        "models": [r["model"] for r in ROUTES],
        "method": "embedding" if _model is not None else "keyword",
    }


@app.get("/routes")
async def get_routes():
    return {
        "routes": [
            {
                "name": r["name"],
                "model": r["model"],
                "params": r["params"],
                "description": r["description"],
                "keywords": r["keywords"],
                "anchors": r["anchors"][:3],
            }
            for r in ROUTES
        ]
    }


@app.post("/classify")
async def classify(request: dict):
    return classify_request(request.get("text", ""))


@app.post("/classify/batch")
async def classify_batch(request: dict):
    results = [classify_request(t) for t in request.get("texts", [])]
    return {"results": results}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=SERVICE_PORT)
