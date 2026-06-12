"""MCP Gateway Stub Server.

Lightweight implementation of the Kagenti MCP Gateway for local development.
Federates MCP tools/list and tools/call across registered tool servers.
Implements JSON-RPC 2.0 over HTTP — same contract as the real Envoy-based
MCP Gateway.
"""

import json
import os
import pathlib

import uvicorn
from fastapi import FastAPI

app = FastAPI(title="Triforce MCP Gateway Stub", version="0.1.0")

CONTRACTS_DIR = pathlib.Path(__file__).parent.parent / "contracts" / "mcp"

TOOL_REGISTRY: dict[str, dict] = {}


@app.on_event("startup")
async def load_tool_schemas():
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
    return {"status": "healthy", "service": "mcp-gateway-stub", "tools": len(TOOL_REGISTRY)}


@app.post("/mcp")
async def mcp_endpoint(request: dict):
    """JSON-RPC 2.0 endpoint for MCP tool operations."""
    jsonrpc = request.get("jsonrpc", "2.0")
    req_id = request.get("id", "unknown")
    method = request.get("method", "")
    params = request.get("params", {})

    if method == "tools/list":
        tools = [entry["tool"] for entry in TOOL_REGISTRY.values()]
        return {
            "jsonrpc": jsonrpc,
            "id": req_id,
            "result": {"tools": tools},
        }

    if method == "tools/call":
        tool_name = params.get("name", "")
        arguments = params.get("arguments", {})

        if tool_name not in TOOL_REGISTRY:
            return {
                "jsonrpc": jsonrpc,
                "id": req_id,
                "error": {"code": -32602, "message": f"Tool not found: {tool_name}"},
            }

        result = _execute_stub_tool(tool_name, arguments)
        return {
            "jsonrpc": jsonrpc,
            "id": req_id,
            "result": {
                "content": [{"type": "text", "text": json.dumps(result)}],
                "structuredContent": result,
                "isError": False,
            },
        }

    return {
        "jsonrpc": jsonrpc,
        "id": req_id,
        "error": {"code": -32601, "message": f"Method not found: {method}"},
    }


def _execute_stub_tool(tool_name: str, arguments: dict) -> dict:
    """Return synthetic stub data for each tool."""
    if tool_name == "fhir_patient_lookup":
        return {
            "patient_id": arguments.get("patient_id", "stub-patient"),
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
        return {
            "interactions": [
                {
                    "drug_a": meds[0] if len(meds) > 0 else "DrugA",
                    "drug_b": meds[1] if len(meds) > 1 else "DrugB",
                    "severity": "moderate",
                    "description": "May increase risk of hypoglycemia when used together",
                }
            ]
        }

    if tool_name == "risk_profile_lookup":
        return {
            "customer_id": arguments.get("customer_id", "stub-customer"),
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
            "transaction_id": arguments.get("transaction_id", "stub-tx"),
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
            "avg_latency_ms": 150.0,
            "p95_latency_ms": 350.0,
            "cpu_requests": 850,
            "gpu_requests": 150,
            "total_input_tokens": 500000,
            "total_output_tokens": 200000,
            "kv_cache_hit_rate": 0.42,
            "estimated_cost_savings": 1250.0,
        }

    return {"error": f"No stub implementation for tool: {tool_name}"}


if __name__ == "__main__":
    port = int(os.environ.get("MCP_STUB_PORT", "8091"))
    uvicorn.run(app, host="0.0.0.0", port=port)
