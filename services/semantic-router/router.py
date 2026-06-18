"""Triforce Semantic Router — Multi-model request routing.

Routes requests to the optimal CPU model based on complexity:
  SIMPLE  → granite-2b-cpu (2B, fastest, classification/NER)
  MEDIUM  → qwen25-3b-cpu (3B, balanced, summarization/analysis)
  COMPLEX → phi3-mini-cpu (3.8B, deepest reasoning)

All models run on Intel Xeon 6 CPU. No LLM call for routing — keyword
classification in <1ms. This is the Red Hat intelligent routing story.
"""

import os
import re
import time

import uvicorn
from fastapi import FastAPI

app = FastAPI(title="Triforce Semantic Router", version="0.2.0")

SERVICE_PORT = int(os.environ.get("SEMANTIC_ROUTER_PORT", "8094"))

ROUTES = [
    {
        "name": "simple",
        "model": "granite-2b-cpu",
        "params": "2B",
        "description": "Fast classification, NER, simple Q&A, labeling",
        "keywords": [
            "classify", "what type", "what is", "label", "categorize",
            "identify", "name", "define", "score", "check", "is this",
            "which category", "tag",
        ],
    },
    {
        "name": "medium",
        "model": "qwen25-3b-cpu",
        "params": "3B",
        "description": "Summarization, extraction, structured analysis",
        "keywords": [
            "summarize", "extract", "list", "describe", "outline",
            "generate", "write", "create", "produce", "draft",
            "compile", "overview", "brief",
        ],
    },
    {
        "name": "complex",
        "model": "phi3-mini-cpu",
        "params": "3.8B",
        "description": "Multi-step reasoning, differential diagnosis, treatment plans",
        "keywords": [
            "analyze", "differential", "interaction", "contraindication",
            "risk assessment", "treatment plan", "multi-step", "reasoning",
            "cross-reference", "comprehensive", "evaluate", "compare",
            "synthesize", "correlate", "implications", "prognosis",
            "recommend", "justify",
        ],
    },
]

COMPLEX_SIGNALS = [
    (r"\b(analyze|evaluate|assess|synthesize|correlate)\b", 3),
    (r"\b(multi-step|comprehensive|differential|contraindication)\b", 4),
    (r"\b(drug interaction|risk assessment|treatment plan)\b", 4),
    (r"\b(cross-reference|implications|prognosis|comorbid)\b", 3),
    (r"\b(ICD-10|CPT|SNOMED|diagnostic)\b", 2),
    (r"\band\b.*\band\b.*\band\b", 3),
    (r"\b(considering|given that|taking into account)\b", 3),
    (r"\b(recommend|justify|explain why)\b", 2),
]

MEDIUM_SIGNALS = [
    (r"\b(summarize|summary|overview|outline|brief)\b", 3),
    (r"\b(extract|generate|write|create|produce|draft)\b", 2),
    (r"\b(list all|compile|describe in detail)\b", 2),
]

SIMPLE_SIGNALS = [
    (r"^(what|which|classify|label|is this|tag|score|check)\b", 3),
    (r"\b(this document|this text|this record|this report)\b", 2),
    (r"\b(yes or no|true or false|one word)\b", 3),
]


def classify_request(text: str) -> dict:
    start = time.monotonic()
    text_lower = text.lower()

    scores = {"simple": 0, "medium": 0, "complex": 0}

    for pattern, weight in COMPLEX_SIGNALS:
        if re.search(pattern, text_lower):
            scores["complex"] += weight

    for pattern, weight in MEDIUM_SIGNALS:
        if re.search(pattern, text_lower):
            scores["medium"] += weight

    for pattern, weight in SIMPLE_SIGNALS:
        if re.search(pattern, text_lower):
            scores["simple"] += weight

    word_count = len(text.split())
    if word_count > 80:
        scores["complex"] += 3
    elif word_count > 40:
        scores["medium"] += 2

    total = sum(scores.values())
    if total == 0:
        route = "simple"
        confidence = 0.5
    else:
        route = max(scores, key=scores.get)
        confidence = min(scores[route] / (total + 1), 0.99)

    route_config = next(r for r in ROUTES if r["name"] == route)
    latency_ms = int((time.monotonic() - start) * 1000)

    return {
        "route": route,
        "model": route_config["model"],
        "model_params": route_config["params"],
        "confidence": round(confidence, 3),
        "latency_ms": latency_ms,
        "scores": scores,
        "word_count": word_count,
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "semantic-router",
        "version": "0.2.0",
        "routes": len(ROUTES),
        "models": [r["model"] for r in ROUTES],
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
