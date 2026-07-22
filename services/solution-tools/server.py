"""Triforce Solution Tools — MCP tool server for Intel + Red Hat Solution Architect Agent.

Implements MCP JSON-RPC 2.0 over HTTP. Provides hardware lookup, OpenShift
capabilities, and joint reference architecture tools for solution design.

Loads all data from JSON files at startup — no hardcoded product data.
"""

import json
import os
import pathlib
import uuid
from typing import Optional

import uvicorn
from fastapi import FastAPI

app = FastAPI(title="Triforce Solution Tools", version="0.1.0")

SERVICE_PORT = int(os.environ.get("SERVICE_PORT", "8095"))
DATA_DIR = pathlib.Path(os.environ.get("DATA_DIR", str(pathlib.Path(__file__).parent / "data")))
CONTRACTS_DIR = pathlib.Path(os.environ.get("CONTRACTS_DIR", str(pathlib.Path(__file__).parent / "contracts")))

# Data stores — loaded from JSON at startup
INTEL_CATALOG: list[dict] = []
OPENSHIFT_CATALOG: dict[str, list[dict]] = {}
ARCHITECTURES: dict[str, dict] = {}

# Tool registry — loaded from contract schemas
TOOL_REGISTRY: dict[str, dict] = {}


@app.on_event("startup")
async def load_data():
    global INTEL_CATALOG, OPENSHIFT_CATALOG, ARCHITECTURES

    with open(DATA_DIR / "intel_catalog.json") as f:
        INTEL_CATALOG = json.load(f)["products"]

    with open(DATA_DIR / "openshift_catalog.json") as f:
        OPENSHIFT_CATALOG = json.load(f)["capabilities"]

    with open(DATA_DIR / "architectures.json") as f:
        ARCHITECTURES = json.load(f)["architectures"]

    for schema_file in CONTRACTS_DIR.glob("*.json"):
        with open(schema_file) as f:
            schema = json.load(f)
        for tool in schema.get("tools", []):
            TOOL_REGISTRY[tool["name"]] = {
                "server": schema["name"],
                "tool": tool,
            }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "solution-tools",
        "tools": len(TOOL_REGISTRY),
        "intel_skus": len(INTEL_CATALOG),
        "capability_areas": len(OPENSHIFT_CATALOG),
        "verticals": len(ARCHITECTURES),
    }


@app.post("/mcp")
async def mcp_endpoint(request: dict):
    """MCP JSON-RPC 2.0 endpoint — tools/list and tools/call."""
    jsonrpc = request.get("jsonrpc", "2.0")
    req_id = request.get("id", str(uuid.uuid4()))
    method = request.get("method", "")
    params = request.get("params", {})

    if method == "tools/list":
        tools = [entry["tool"] for entry in TOOL_REGISTRY.values()]
        return {"jsonrpc": jsonrpc, "id": req_id, "result": {"tools": tools}}

    if method == "tools/call":
        tool_name = params.get("name", "")
        arguments = params.get("arguments", {})

        if tool_name not in TOOL_REGISTRY:
            return {
                "jsonrpc": jsonrpc, "id": req_id,
                "error": {"code": -32602, "message": f"Tool not found: {tool_name}"},
            }

        result = execute_tool(tool_name, arguments)
        return {
            "jsonrpc": jsonrpc, "id": req_id,
            "result": {
                "content": [{"type": "text", "text": json.dumps(result)}],
                "structuredContent": result,
                "isError": False,
            },
        }

    return {
        "jsonrpc": jsonrpc, "id": req_id,
        "error": {"code": -32601, "message": f"Method not found: {method}"},
    }


def execute_tool(tool_name: str, arguments: dict) -> dict:
    """Execute an MCP tool and return structured data."""

    if tool_name == "intel_hardware_lookup":
        family = arguments.get("family", "xeon6")
        use_case = arguments.get("use_case")
        min_cores = arguments.get("min_cores")

        products = [p for p in INTEL_CATALOG if p["family"] == family]

        if use_case:
            products = [p for p in products if use_case in p.get("use_cases", [])]

        if min_cores is not None:
            products = [p for p in products if p.get("cores", 0) >= min_cores]

        return {"products": products}

    if tool_name == "openshift_capabilities":
        area = arguments.get("capability_area", "ai_ml")
        detail_level = arguments.get("detail_level", "summary")

        capabilities = OPENSHIFT_CATALOG.get(area, [])

        if detail_level == "summary":
            capabilities = [
                {"name": c["name"], "description": c["description"], "when_to_use": c["when_to_use"]}
                for c in capabilities
            ]

        return {"capability_area": area, "capabilities": capabilities}

    if tool_name == "reference_architectures":
        vertical = arguments.get("vertical", "healthcare")
        scale = arguments.get("scale")

        arch = ARCHITECTURES.get(vertical)
        if not arch:
            return {"vertical": vertical, "architecture": None, "error": f"No architecture found for vertical: {vertical}"}

        result = {"vertical": vertical, "architecture": dict(arch)}

        if scale and "estimated_nodes" in arch:
            result["architecture"]["estimated_nodes"] = arch["estimated_nodes"].get(scale, arch["estimated_nodes"])

        return result

    return {"error": f"No implementation for tool: {tool_name}"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=SERVICE_PORT)
