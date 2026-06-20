"""Healthcare Agent — LangGraph-powered FastAPI application with A2A protocol.

Multi-step clinical NLP agent: classify → extract entities → check drug
interactions (conditional) → summarize. All inference on Intel Xeon 6 CPU
via MAAS/LiteLLM. MCP tools provide FHIR data and drug interaction checking.
"""

import asyncio
import json
import logging
import os
import uuid
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.responses import JSONResponse

import db
import models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("healthcare-agent")

kafka_pipeline = None
healthcare_graph = None

SERVICE_PORT = int(os.environ.get("SERVICE_PORT", "8081"))


async def run_graph(text: str, patient_id: str = None) -> dict:
    """Execute the full LangGraph pipeline on a clinical text."""
    global healthcare_graph
    if healthcare_graph is None:
        from graph import build_graph
        healthcare_graph = await build_graph()

    result = await healthcare_graph.ainvoke({
        "messages": [],
        "patient_id": patient_id or str(uuid.uuid4()),
        "text": text,
        "classification": None,
        "entities": [],
        "drug_interactions": [],
        "summary": None,
        "inference_log": [],
    })

    for entry in result.get("inference_log", []):
        await db.log_inference(
            agent_name="healthcare-agent",
            model=entry.get("model", "unknown"),
            task_type=entry.get("node", "unknown"),
            latency_ms=entry.get("latency_ms", 0),
            accelerator=entry.get("accelerator", "cpu"),
        )

    return result


@asynccontextmanager
async def lifespan(app):
    global kafka_pipeline, healthcare_graph
    await db.init_pool()

    from attestation import get_litellm_api_key, is_running_in_tdx
    api_key = await get_litellm_api_key()
    if api_key:
        from graph import set_api_key
        set_api_key(api_key)

    in_tdx = await is_running_in_tdx()
    if in_tdx:
        logger.info("Running inside TDX Trust Domain — inference data is hardware-encrypted")
    else:
        logger.info("Running in standard mode (no TDX)")

    from graph import build_graph
    healthcare_graph = await build_graph()
    logger.info("LangGraph healthcare pipeline compiled")

    kafka_servers = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "")
    if kafka_servers:
        from kafka_consumer import HealthcareKafkaPipeline
        kafka_pipeline = HealthcareKafkaPipeline(graph_fn=run_graph)
        asyncio.create_task(kafka_pipeline.run())
        logger.info("Kafka pipeline started")

    yield

    if kafka_pipeline:
        await kafka_pipeline.stop()
    await db.close_pool()


app = FastAPI(title="Triforce Healthcare Agent", version="0.1.0", lifespan=lifespan)


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

        try:
            result = await run_graph(text, patient_id=task_id)
            artifacts = []

            if result.get("classification"):
                artifacts.append(models.Artifact(
                    parts=[models.Part(text=f"Classification: {result['classification']}")]
                ))

            if result.get("entities"):
                entity_text = json.dumps(result["entities"][:10])
                artifacts.append(models.Artifact(
                    parts=[models.Part(text=f"Entities: {entity_text}")]
                ))

            if result.get("drug_interactions"):
                interaction_text = json.dumps(result["drug_interactions"])
                artifacts.append(models.Artifact(
                    parts=[models.Part(text=f"Drug Interactions: {interaction_text}")]
                ))

            if result.get("summary"):
                artifacts.append(models.Artifact(
                    parts=[models.Part(text=result["summary"])]
                ))

            if not artifacts:
                artifacts = [models.Artifact(parts=[models.Part(text="Analysis complete")])]

            steps = len(result.get("inference_log", []))
            logger.info("A2A task %s completed: %d graph steps", task_id, steps)

        except Exception as e:
            logger.error("A2A task %s failed: %s", task_id, e)
            artifacts = [models.Artifact(parts=[models.Part(text=f"Error: {e}")])]

        return models.JsonRpcResponse(
            id=request.id,
            result=models.Task(
                id=task_id,
                contextId=str(uuid.uuid4()),
                status=models.TaskStatus(state="completed"),
                artifacts=artifacts,
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


# --- Clinical NLP Endpoints (graph-powered) ---

def _model_for_node(result: dict, node: str) -> str:
    """Extract the actual model used for a pipeline node from inference_log."""
    return next(
        (e.get("model", "unknown") for e in result.get("inference_log", []) if e.get("node") == node),
        "unknown",
    )


@app.post("/api/v1/classify")
async def classify_document(req: models.ClassifyRequest):
    result = await run_graph(req.text)
    total_ms = sum(e.get("latency_ms", 0) for e in result.get("inference_log", []) if e.get("node") == "classify")

    return models.ClassifyResponse(
        classification=models.DocumentType(result.get("classification", "unknown")),
        confidence=0.85,
        model=_model_for_node(result, "classify"),
        accelerator="cpu",
        inference_ms=total_ms,
    )


@app.post("/api/v1/extract-entities")
async def extract_entities(req: models.ExtractEntitiesRequest):
    result = await run_graph(req.text)
    total_ms = sum(e.get("latency_ms", 0) for e in result.get("inference_log", []) if e.get("node") == "extract_entities")

    entities = []
    for e in result.get("entities", []):
        entity_type = e.get("type", "condition")
        valid_types = [t.value for t in models.EntityType]
        if entity_type in valid_types:
            entities.append(models.MedicalEntity(
                text=e["text"],
                type=models.EntityType(entity_type),
                start=e.get("start", 0),
                end=e.get("end", len(e["text"])),
            ))

    return models.ExtractEntitiesResponse(
        entities=entities,
        model=_model_for_node(result, "extract_entities"),
        accelerator="cpu",
        inference_ms=total_ms,
    )


@app.post("/api/v1/summarize")
async def summarize_record(req: models.SummarizeRequest):
    result = await run_graph(req.text)
    total_ms = sum(e.get("latency_ms", 0) for e in result.get("inference_log", []) if e.get("node") == "summarize")

    return models.SummarizeResponse(
        summary=result.get("summary", "Summary unavailable."),
        model=_model_for_node(result, "summarize"),
        accelerator="cpu",
        inference_ms=total_ms,
    )


@app.post("/api/v1/pipeline")
async def run_pipeline(req: models.PipelineRequest):
    result = await run_graph(req.text, patient_id=req.patient_id)
    inference_log = result.get("inference_log", [])
    total_ms = sum(e.get("latency_ms", 0) for e in inference_log)

    entities = []
    for e in result.get("entities", []):
        entity_type = e.get("type", "condition")
        valid_types = [t.value for t in models.EntityType]
        if entity_type in valid_types:
            entities.append(models.MedicalEntity(
                text=e["text"],
                type=models.EntityType(entity_type),
                start=e.get("start", 0),
                end=e.get("end", len(e["text"])),
            ))

    return models.PipelineResponse(
        classification=result.get("classification", "unknown"),
        entities=entities,
        drug_interactions=result.get("drug_interactions", []),
        summary=result.get("summary", "Summary unavailable."),
        inference_log=[models.PipelineStepLog(**e) for e in inference_log],
        total_ms=total_ms,
    )


@app.get("/api/v1/stats")
async def inference_stats():
    return await db.get_inference_stats()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=SERVICE_PORT)
