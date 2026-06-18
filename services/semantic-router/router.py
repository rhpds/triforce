"""Triforce Semantic Router — Request complexity classification.

Classifies incoming requests as SIMPLE or COMPLEX and recommends
the appropriate model. Runs entirely on CPU — keyword matching
with optional embedding similarity (no LLM call required).

This is the Red Hat AI story: intelligent routing before inference.
"""

import os
import re
import time

import uvicorn
from fastapi import FastAPI

app = FastAPI(title="Triforce Semantic Router", version="0.1.0")

SERVICE_PORT = int(os.environ.get("SEMANTIC_ROUTER_PORT", "8094"))

ROUTES = [
    {
        "name": "simple",
        "model": "granite-2b-cpu",
        "description": "Fast classification, NER, simple Q&A",
        "keywords": [
            "classify", "what type", "what is", "summarize", "list",
            "extract", "identify", "label", "categorize", "describe",
            "name", "define", "score", "check",
        ],
        "max_tokens_hint": 200,
    },
    {
        "name": "complex",
        "model": os.environ.get("COMPLEX_MODEL", "qwen25-3b-cpu"),
        "description": "Multi-step reasoning, analysis, differential diagnosis",
        "keywords": [
            "analyze", "differential", "interaction", "contraindication",
            "risk assessment", "treatment plan", "multi-step", "reasoning",
            "cross-reference", "comprehensive", "evaluate", "compare",
            "synthesize", "correlate", "implications", "prognosis",
        ],
        "max_tokens_hint": 1000,
    },
]

COMPLEXITY_SIGNALS = [
    (r"\b(analyze|evaluate|assess|synthesize|correlate)\b", 2),
    (r"\b(multi-step|comprehensive|differential|contraindication)\b", 3),
    (r"\b(drug interaction|risk assessment|treatment plan)\b", 3),
    (r"\b(cross-reference|implications|prognosis|comorbid)\b", 2),
    (r"\b(ICD-10|CPT|SNOMED|diagnostic)\b", 1),
    (r"\band\b.*\band\b.*\band\b", 2),  # multiple conjunctions = complex query
    (r"\b(considering|given that|taking into account)\b", 2),
]

SIMPLE_SIGNALS = [
    (r"^(what|which|classify|extract|list|name|define|score)\b", 2),
    (r"\b(this document|this text|this record|this report)\b", 1),
]


def classify_request(text: str) -> dict:
    """Classify a request as simple or complex based on keyword signals."""
    start = time.monotonic()
    text_lower = text.lower()

    complex_score = 0
    simple_score = 0

    for pattern, weight in COMPLEXITY_SIGNALS:
        if re.search(pattern, text_lower):
            complex_score += weight

    for pattern, weight in SIMPLE_SIGNALS:
        if re.search(pattern, text_lower):
            simple_score += weight

    word_count = len(text.split())
    if word_count > 50:
        complex_score += 2
    if word_count > 100:
        complex_score += 3

    total = complex_score + simple_score
    if total == 0:
        route = "simple"
        confidence = 0.5
    elif complex_score > simple_score:
        route = "complex"
        confidence = min(complex_score / (total + 1), 0.99)
    else:
        route = "simple"
        confidence = min(simple_score / (total + 1), 0.99)

    route_config = next(r for r in ROUTES if r["name"] == route)
    latency_ms = int((time.monotonic() - start) * 1000)

    return {
        "route": route,
        "model": route_config["model"],
        "confidence": round(confidence, 3),
        "latency_ms": latency_ms,
        "signals": {
            "complex_score": complex_score,
            "simple_score": simple_score,
            "word_count": word_count,
        },
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "semantic-router",
        "version": "0.1.0",
        "routes": len(ROUTES),
    }


@app.get("/routes")
async def get_routes():
    return {
        "routes": [
            {
                "name": r["name"],
                "model": r["model"],
                "description": r["description"],
                "keywords": r["keywords"],
            }
            for r in ROUTES
        ]
    }


@app.post("/classify")
async def classify(request: dict):
    text = request.get("text", "")
    return classify_request(text)


@app.post("/classify/batch")
async def classify_batch(request: dict):
    texts = request.get("texts", [])
    results = [classify_request(t) for t in texts]
    return {"results": results}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=SERVICE_PORT)
