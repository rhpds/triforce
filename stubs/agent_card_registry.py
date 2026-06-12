"""Agent Card Registry Stub.

In-memory replacement for Kagenti's AgentCard CRD controller.
Agents register on startup, the orchestrator queries for discovery.

In real Kagenti:
  - AgentCard Sync Controller watches pods with kagenti.io/type=agent label
  - Fetches /.well-known/agent.json from each pod
  - Creates AgentCard CRDs automatically

This stub does the same over HTTP without any K8s dependency.
"""

import os
from datetime import datetime

import httpx
import uvicorn
from fastapi import FastAPI

app = FastAPI(title="Triforce Agent Card Registry Stub", version="0.1.0")

REGISTRY: dict[str, dict] = {}


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "agent-registry-stub", "agents": len(REGISTRY)}


@app.get("/api/v1/agent-cards")
async def list_agent_cards():
    return {
        "items": [
            {
                "name": name,
                "protocol": "a2a",
                "target": info.get("url", ""),
                "agent": info.get("card", {}).get("name", name),
                "synced": True,
                "last_sync": info.get("last_sync", ""),
            }
            for name, info in REGISTRY.items()
        ]
    }


@app.get("/api/v1/agent-cards/{name}")
async def get_agent_card(name: str):
    if name in REGISTRY:
        return REGISTRY[name].get("card", {})
    return {"error": f"Agent card not found: {name}"}


@app.post("/api/v1/agent-cards/sync")
async def sync_agent_card(request: dict):
    url = request.get("url", "")
    if not url:
        return {"error": "url required"}

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{url}/.well-known/agent-card.json")
            if resp.status_code == 200:
                card = resp.json()
                name = card.get("name", url)
                REGISTRY[name] = {
                    "card": card,
                    "url": url,
                    "last_sync": datetime.utcnow().isoformat(),
                }
                return {"status": "synced", "name": name}
    except Exception as e:
        return {"error": str(e)}


@app.delete("/api/v1/agent-cards/{name}")
async def delete_agent_card(name: str):
    if name in REGISTRY:
        del REGISTRY[name]
        return {"status": "deleted", "name": name}
    return {"error": f"Agent card not found: {name}"}


if __name__ == "__main__":
    port = int(os.environ.get("REGISTRY_PORT", "8092"))
    uvicorn.run(app, host="0.0.0.0", port=port)
