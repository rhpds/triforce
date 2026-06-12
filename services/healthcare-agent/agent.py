"""Healthcare Agent — FastAPI application with A2A protocol support.

Clinical NLP agent for medical document classification, entity extraction,
and patient record summarization. All inference runs on Intel Xeon 6 CPU
via MAAS/LiteLLM.
"""

import asyncio
import json
import logging
import os
import time
import uuid
from contextlib import asynccontextmanager

import httpx
import uvicorn
from fastapi import FastAPI
from fastapi.responses import JSONResponse

import db
import models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("healthcare-agent")

kafka_pipeline = None


@asynccontextmanager
async def lifespan(app):
    global kafka_pipeline
    await db.init_pool()
    kafka_servers = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "")
    if kafka_servers:
        from kafka_consumer import HealthcareKafkaPipeline
        kafka_pipeline = HealthcareKafkaPipeline(
            classify_fn=classify_document,
            extract_fn=extract_entities,
        )
        asyncio.create_task(kafka_pipeline.run())
        logger.info("Kafka pipeline started")
    yield
    if kafka_pipeline:
        await kafka_pipeline.stop()
    await db.close_pool()


app = FastAPI(title="Triforce Healthcare Agent", version="0.1.0", lifespan=lifespan)

LITELLM_API_BASE = os.environ.get("LITELLM_API_BASE", "https://maas-rhdp.apps.maas.redhatworkshops.io")
LITELLM_API_KEY = os.environ.get("LITELLM_API_KEY", "")
CLASSIFY_MODEL = "granite-2b-cpu"
SUMMARIZE_MODEL = "granite-3-2-8b-instruct"
SERVICE_PORT = int(os.environ.get("SERVICE_PORT", "8081"))


async def llm_complete(model: str, prompt: str, max_tokens: int = 512) -> tuple[str, int]:
    """Call LiteLLM for inference. Returns (response_text, latency_ms)."""
    start = time.monotonic()
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{LITELLM_API_BASE}/v1/chat/completions",
            headers={"Authorization": f"Bearer {LITELLM_API_KEY}"},
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "temperature": 0.1,
            },
        )
        resp.raise_for_status()
        data = resp.json()
    latency_ms = int((time.monotonic() - start) * 1000)
    return data["choices"][0]["message"]["content"], latency_ms


# --- Health ---

@app.get("/health")
async def health():
    return models.HealthResponse(status=models.HealthStatus.healthy)


# --- A2A Protocol ---

@app.get("/.well-known/agent-card.json")
async def agent_card():
    card = models.AgentCard(url=f"http://localhost:{SERVICE_PORT}")
    return card.model_dump()


@app.post("/a2a")
async def a2a_endpoint(request: models.JsonRpcRequest):
    if request.method == "tasks/send":
        params = request.params or {}
        task_id = params.get("id", str(uuid.uuid4()))
        message = params.get("message", {})
        parts = message.get("parts", [])
        text = parts[0].get("text", "") if parts else ""

        result_text = f"Healthcare agent processed: {text[:100]}"
        try:
            result_text, _ = await llm_complete(CLASSIFY_MODEL, text, max_tokens=256)
        except Exception:
            pass

        return models.JsonRpcResponse(
            id=request.id,
            result=models.Task(
                id=task_id,
                contextId=str(uuid.uuid4()),
                status=models.TaskStatus(state="completed"),
                artifacts=[
                    models.Artifact(parts=[models.Part(text=result_text)])
                ],
            ),
        )

    if request.method == "tasks/get":
        task_id = (request.params or {}).get("id", "unknown")
        return models.JsonRpcResponse(
            id=request.id,
            result=models.Task(
                id=task_id,
                status=models.TaskStatus(state="completed"),
            ),
        )

    if request.method == "tasks/cancel":
        task_id = (request.params or {}).get("id", "unknown")
        return models.JsonRpcResponse(
            id=request.id,
            result=models.Task(
                id=task_id,
                status=models.TaskStatus(state="failed"),
            ),
        )

    return JSONResponse(
        content={
            "jsonrpc": "2.0",
            "id": request.id,
            "error": {"code": -32601, "message": f"Method not found: {request.method}"},
        }
    )


# --- Clinical NLP Endpoints ---

@app.post("/api/v1/classify")
async def classify_document(req: models.ClassifyRequest):
    prompt = f"""Classify the following clinical document into exactly one category:
discharge_summary, progress_note, lab_report, radiology_report, pathology_report, surgical_note, consultation, prescription.

Respond with only the category name, nothing else.

Document:
{req.text[:5000]}"""

    try:
        response, latency_ms = await llm_complete(CLASSIFY_MODEL, prompt, max_tokens=20)
        classification = response.strip().lower().replace(" ", "_")
        valid = [e.value for e in models.DocumentType if e != models.DocumentType.unknown]
        if classification not in valid:
            classification = "unknown"
    except Exception:
        classification = "unknown"
        latency_ms = 0

    await db.log_inference("healthcare-agent", CLASSIFY_MODEL, "classification", latency_ms)

    return models.ClassifyResponse(
        classification=models.DocumentType(classification),
        confidence=0.85,
        model=CLASSIFY_MODEL,
        accelerator="cpu",
        inference_ms=latency_ms,
    )


@app.post("/api/v1/extract-entities")
async def extract_entities(req: models.ExtractEntitiesRequest):
    prompt = f"""Extract medical entities from the following clinical text.
For each entity, provide: the exact text, the type (condition, medication, procedure, lab_test, anatomy, dosage), and the character offsets.

Respond in JSON format as a list of objects with keys: text, type, start, end.

Clinical text:
{req.text[:5000]}"""

    try:
        response, latency_ms = await llm_complete(CLASSIFY_MODEL, prompt, max_tokens=1024)
        try:
            entities_raw = json.loads(response)
        except json.JSONDecodeError:
            entities_raw = []

        entities = []
        for e in entities_raw:
            if isinstance(e, dict) and "text" in e and "type" in e:
                entity_type = e["type"].lower()
                valid_types = [t.value for t in models.EntityType]
                if entity_type in valid_types:
                    entities.append(models.MedicalEntity(
                        text=e["text"],
                        type=models.EntityType(entity_type),
                        start=e.get("start", 0),
                        end=e.get("end", len(e["text"])),
                    ))
    except Exception:
        entities = []
        latency_ms = 0

    await db.log_inference("healthcare-agent", CLASSIFY_MODEL, "ner", latency_ms)

    return models.ExtractEntitiesResponse(
        entities=entities,
        model=CLASSIFY_MODEL,
        accelerator="cpu",
        inference_ms=latency_ms,
    )


@app.post("/api/v1/summarize")
async def summarize_record(req: models.SummarizeRequest):
    prompt = f"""Summarize the following patient record in {req.max_length} words or fewer.
Include key findings as bullet points.

Patient record:
{req.text[:10000]}"""

    try:
        response, latency_ms = await llm_complete(SUMMARIZE_MODEL, prompt, max_tokens=req.max_length)
    except Exception:
        response = "Summary unavailable."
        latency_ms = 0

    await db.log_inference("healthcare-agent", SUMMARIZE_MODEL, "summarization", latency_ms)

    return models.SummarizeResponse(
        summary=response.strip(),
        model=SUMMARIZE_MODEL,
        accelerator="cpu",
        inference_ms=latency_ms,
    )



@app.get("/api/v1/stats")
async def inference_stats():
    return await db.get_inference_stats()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=SERVICE_PORT)
