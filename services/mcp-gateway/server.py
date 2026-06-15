"""Triforce MCP Gateway — Model Context Protocol tool federation server.

Implements MCP JSON-RPC 2.0 over HTTP. Federates tools from healthcare
and finserv agents into a single gateway endpoint.

In production this would be the Kagenti Envoy-based MCP Gateway.
This implementation provides the same JSON-RPC contract.
"""

import json
import os
import pathlib
import uuid
from datetime import datetime, timezone
from typing import Optional

import uvicorn
from fastapi import FastAPI

app = FastAPI(title="Triforce MCP Gateway", version="0.1.0")

SERVICE_PORT = int(os.environ.get("MCP_GATEWAY_PORT", "8091"))
CONTRACTS_DIR = pathlib.Path(os.environ.get("CONTRACTS_DIR", str(pathlib.Path(__file__).parent.parent.parent / "contracts" / "mcp")))

# Tool registry — loaded from contract schemas + synthetic implementations
TOOL_REGISTRY: dict[str, dict] = {}


@app.on_event("startup")
async def load_tools():
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
    return {"status": "healthy", "service": "mcp-gateway", "tools": len(TOOL_REGISTRY)}


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

    if tool_name == "fhir_patient_lookup":
        patient_id = arguments.get("patient_id", "unknown")
        return {
            "patient_id": patient_id,
            "name": "Jane Doe",
            "age": 62,
            "gender": "F",
            "conditions": [
                {"code": "E11.9", "display": "Type 2 diabetes mellitus", "onset_date": "2020-03-15"},
                {"code": "I10", "display": "Essential hypertension", "onset_date": "2018-07-22"},
            ],
            "medications": [
                {"name": "Metformin", "dosage": "500mg", "frequency": "twice daily"},
                {"name": "Lisinopril", "dosage": "10mg", "frequency": "once daily"},
            ],
            "encounters": [
                {"date": "2026-06-01", "type": "inpatient", "department": "cardiology"},
                {"date": "2026-05-15", "type": "outpatient", "department": "endocrinology"},
            ],
        }

    if tool_name == "clinical_code_search":
        query = arguments.get("query", "")
        return {
            "results": [
                {"code": "E11.9", "display": "Type 2 diabetes mellitus, without complications", "category": "Endocrine"},
                {"code": "E11.65", "display": "Type 2 diabetes mellitus with hyperglycemia", "category": "Endocrine"},
            ]
        }

    if tool_name == "drug_interaction_check":
        meds = arguments.get("medications", [])
        if len(meds) < 2:
            return {"interactions": []}
        return {
            "interactions": [
                {
                    "drug_a": meds[0],
                    "drug_b": meds[1],
                    "severity": "moderate",
                    "description": f"Potential interaction between {meds[0]} and {meds[1]}. Monitor renal function.",
                }
            ]
        }

    if tool_name == "risk_profile_lookup":
        return {
            "customer_id": arguments.get("customer_id", "unknown"),
            "risk_score": 25.0,
            "risk_level": "low",
            "account_age_days": 730,
            "transaction_summary": {
                "count": 142, "total_amount": 45200.0, "avg_amount": 318.31,
                "max_amount": 5000.0, "unique_recipients": 23, "unique_countries": 3,
            },
            "flags": [],
        }

    if tool_name == "regulatory_rule_check":
        return {
            "transaction_id": arguments.get("transaction_id", "unknown"),
            "regulation": arguments.get("regulation", "aml"),
            "status": "pass",
            "rules_evaluated": 12,
            "failures": [],
        }

    if tool_name == "sanction_list_search":
        return {
            "entity_name": arguments.get("entity_name", "Unknown"),
            "matches": [],
            "screened": True,
        }

    if tool_name == "get_agent_status":
        return {
            "agent_name": arguments.get("agent_name", "unknown"),
            "status": "active",
            "url": "http://localhost:8081",
            "skills": [],
        }

    if tool_name == "get_inference_stats":
        return {
            "total_requests": 1000,
            "avg_latency_ms": 612.0,
            "p95_latency_ms": 1850.0,
            "cpu_requests": 1000,
            "gpu_requests": 0,
            "total_input_tokens": 500000,
            "total_output_tokens": 200000,
            "kv_cache_hit_rate": 0.0,
            "estimated_cost_savings": 42.0,
        }

    return {"error": f"No implementation for tool: {tool_name}"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=SERVICE_PORT)
