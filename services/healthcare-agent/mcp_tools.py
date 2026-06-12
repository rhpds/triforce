"""MCP tool wrappers for the healthcare LangGraph agent.

Wraps MCP gateway calls as LangChain tools that LangGraph nodes can invoke.
Calls the MCP gateway stub (or real Kagenti MCP Gateway) via HTTP JSON-RPC.
"""

import json
import os

import httpx
from langchain_core.tools import tool

MCP_GATEWAY_URL = os.environ.get("MCP_GATEWAY_URL", "http://localhost:8091")


async def _call_mcp_tool(tool_name: str, arguments: dict) -> dict:
    """Call an MCP tool via the gateway JSON-RPC endpoint."""
    request = {
        "jsonrpc": "2.0",
        "id": f"tool-{tool_name}",
        "method": "tools/call",
        "params": {"name": tool_name, "arguments": arguments},
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(f"{MCP_GATEWAY_URL}/mcp", json=request)
            resp.raise_for_status()
            data = resp.json()
        if "error" in data and data["error"]:
            return {"error": data["error"]["message"]}
        result = data.get("result", {})
        structured = result.get("structuredContent", {})
        if structured:
            return structured
        content = result.get("content", [])
        if content and content[0].get("text"):
            return json.loads(content[0]["text"])
        return {}
    except httpx.ConnectError:
        return _fallback_tool(tool_name, arguments)
    except Exception as e:
        return _fallback_tool(tool_name, arguments)


def _fallback_tool(tool_name: str, arguments: dict) -> dict:
    """Return synthetic data when MCP gateway is unavailable."""
    if tool_name == "fhir_patient_lookup":
        return {
            "patient_id": arguments.get("patient_id", "unknown"),
            "name": "Synthetic Patient",
            "age": 65,
            "gender": "M",
            "conditions": [
                {"code": "E11.9", "display": "Type 2 diabetes mellitus", "onset_date": "2020-03-15"},
                {"code": "I10", "display": "Essential hypertension", "onset_date": "2018-07-22"},
            ],
            "medications": [
                {"name": "Metformin", "dosage": "500mg", "frequency": "twice daily"},
                {"name": "Lisinopril", "dosage": "10mg", "frequency": "once daily"},
            ],
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
                    "description": f"Potential interaction between {meds[0]} and {meds[1]}",
                }
            ]
        }
    if tool_name == "clinical_code_search":
        return {
            "results": [
                {"code": "E11.9", "display": "Type 2 diabetes mellitus", "category": "Endocrine"},
            ]
        }
    return {}


@tool
async def fhir_patient_lookup(patient_id: str) -> str:
    """Look up a patient record by ID. Returns demographics, conditions, medications, and encounters."""
    result = await _call_mcp_tool("fhir_patient_lookup", {"patient_id": patient_id})
    return json.dumps(result)


@tool
async def drug_interaction_check(medications: list[str]) -> str:
    """Check for drug-drug interactions between a list of medications."""
    result = await _call_mcp_tool("drug_interaction_check", {"medications": medications})
    return json.dumps(result)


@tool
async def clinical_code_search(query: str, code_system: str = "icd10") -> str:
    """Search ICD-10/CPT codes by keyword. Returns matching codes with descriptions."""
    result = await _call_mcp_tool("clinical_code_search", {"query": query, "code_system": code_system})
    return json.dumps(result)


ALL_TOOLS = [fhir_patient_lookup, drug_interaction_check, clinical_code_search]
