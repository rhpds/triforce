"""Solution Architect Agent — LangGraph-powered FastAPI application.

Takes a customer workload description and generates a joint Red Hat + Intel
solution brief. LLM inference runs on Intel Xeon 6 CPU via MAAS/LiteLLM.
MCP tools provide hardware, platform, and architecture lookups.
"""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
import uvicorn
from fastapi import FastAPI

import models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("solution-agent")

solution_graph = None

SERVICE_PORT = int(os.environ.get("SERVICE_PORT", "8082"))
MCP_SERVER_URL = os.environ.get("MCP_SERVER_URL", "http://solution-tools:8095")
PROMPT_PATH = os.environ.get("PROMPT_PATH", "/etc/advisor/system_prompt.txt")


def _load_system_prompt() -> str | None:
    """Load an optional system prompt override from a mounted file."""
    path = Path(PROMPT_PATH)
    if path.exists():
        return path.read_text().strip()
    return None


@asynccontextmanager
async def lifespan(app):
    global solution_graph
    from graph import build_graph
    solution_graph = await build_graph()
    logger.info("LangGraph solution pipeline compiled")

    prompt = _load_system_prompt()
    if prompt:
        logger.info("Loaded system prompt override from %s", PROMPT_PATH)

    yield


app = FastAPI(title="Triforce Solution Architect Agent", version="0.1.0", lifespan=lifespan)


@app.get("/health")
async def health():
    return models.HealthResponse(status=models.HealthStatus.healthy)


@app.post("/api/v1/advise")
async def advise(req: models.AdviseRequest):
    global solution_graph
    if solution_graph is None:
        from graph import build_graph
        solution_graph = await build_graph()

    result = await solution_graph.ainvoke({
        "messages": [],
        "query": req.query,
        "requirements": None,
        "hardware_options": [],
        "platform_capabilities": [],
        "architecture": None,
        "brief": None,
        "inference_log": [],
    })

    inference_log = result.get("inference_log", [])
    total_ms = sum(e.get("latency_ms", 0) for e in inference_log)

    return models.AdviseResponse(
        brief=result.get("brief", ""),
        requirements=result.get("requirements", {}),
        hardware_options=result.get("hardware_options", []),
        platform_capabilities=result.get("platform_capabilities", []),
        architecture=result.get("architecture", {}),
        inference_log=[models.InferenceLogEntry(**e) for e in inference_log],
        total_ms=total_ms,
    )


@app.get("/api/v1/tools")
async def list_tools():
    """List available MCP tools from the solution-tools server."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(f"{MCP_SERVER_URL}/mcp", json={
                "jsonrpc": "2.0", "id": "1",
                "method": "tools/list", "params": {},
            })
            data = resp.json()
            return data.get("result", data)
    except Exception as e:
        return {"error": str(e), "tools": []}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=SERVICE_PORT)
