"""A2A Protocol Stub Server.

Lightweight implementation of the Kagenti A2A gateway for local development.
Proxies agent card discovery and task/send calls to registered agent endpoints.
Implements the exact same JSON-RPC 2.0 contracts as real Kagenti — zero agent
code changes needed when deploying to OpenShift with real Kagenti.
"""

import os
import uuid

import httpx
import uvicorn
from fastapi import FastAPI

app = FastAPI(title="Triforce A2A Stub", version="0.1.0")

AGENTS: dict[str, dict] = {}

HEALTHCARE_URL = os.environ.get("HEALTHCARE_AGENT_URL", "http://localhost:8081")
FINSERV_URL = os.environ.get("FINSERV_AGENT_URL", "http://localhost:8082")


@app.on_event("startup")
async def discover_agents():
    for url in [HEALTHCARE_URL, FINSERV_URL]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{url}/.well-known/agent-card.json")
                if resp.status_code == 200:
                    card = resp.json()
                    AGENTS[card["name"]] = {"card": card, "url": url}
        except Exception:
            pass


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "a2a-stub", "agents": len(AGENTS)}


@app.get("/api/v1/agents")
async def list_agents():
    return {
        "agents": [
            {
                "name": info["card"]["name"],
                "url": info["url"],
                "status": "active",
                "skills": info["card"].get("skills", []),
            }
            for info in AGENTS.values()
        ]
    }


@app.get("/api/v1/agents/{agent_name}/agent-card.json")
async def get_agent_card(agent_name: str):
    for info in AGENTS.values():
        if info["card"]["name"] == agent_name:
            return info["card"]
    return {"error": f"Agent not found: {agent_name}"}


@app.post("/api/v1/agents/{agent_name}/tasks/send")
async def proxy_task_send(agent_name: str, request: dict):
    for info in AGENTS.values():
        if info["card"]["name"] == agent_name:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(f"{info['url']}/a2a", json=request)
                return resp.json()
    return {
        "jsonrpc": "2.0",
        "id": request.get("id", "unknown"),
        "error": {"code": -32600, "message": f"Agent not found: {agent_name}"},
    }


@app.post("/api/v1/register")
async def register_agent(registration: dict):
    name = registration.get("name", "")
    url = registration.get("url", "")
    if not name or not url:
        return {"error": "name and url required"}
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{url}/.well-known/agent-card.json")
            if resp.status_code == 200:
                card = resp.json()
                AGENTS[card["name"]] = {"card": card, "url": url}
                return {"status": "registered", "name": card["name"]}
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    port = int(os.environ.get("A2A_STUB_PORT", "8090"))
    uvicorn.run(app, host="0.0.0.0", port=port)
