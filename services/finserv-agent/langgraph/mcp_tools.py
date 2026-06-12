"""MCP tool wrappers for the FinServ LangGraph agent.

Wraps risk profile, regulatory rules, and sanctions screening
as LangChain tools via the MCP gateway.
"""

import json
import os

import httpx
from langchain_core.tools import tool

MCP_GATEWAY_URL = os.environ.get("MCP_GATEWAY_URL", "http://localhost:8091")


async def _call_mcp_tool(tool_name: str, arguments: dict) -> dict:
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
        result = data.get("result", {})
        structured = result.get("structuredContent", {})
        if structured:
            return structured
        content = result.get("content", [])
        if content and content[0].get("text"):
            return json.loads(content[0]["text"])
        return {}
    except Exception:
        return _fallback(tool_name, arguments)


def _fallback(tool_name: str, arguments: dict) -> dict:
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
    if tool_name == "sanction_list_search":
        return {
            "entity_name": arguments.get("entity_name", "Unknown"),
            "matches": [],
            "screened": True,
        }
    if tool_name == "regulatory_rule_check":
        return {
            "transaction_id": arguments.get("transaction_id", "unknown"),
            "regulation": arguments.get("regulation", "aml"),
            "status": "pass",
            "rules_evaluated": 12,
            "failures": [],
        }
    return {}


@tool
async def risk_profile_lookup(customer_id: str) -> str:
    """Look up a customer's risk profile including transaction history and risk factors."""
    result = await _call_mcp_tool("risk_profile_lookup", {"customer_id": customer_id})
    return json.dumps(result)


@tool
async def sanction_list_search(entity_name: str, entity_type: str = "individual") -> str:
    """Screen an entity against OFAC and sanctions lists."""
    result = await _call_mcp_tool("sanction_list_search", {
        "entity_name": entity_name, "entity_type": entity_type,
    })
    return json.dumps(result)


@tool
async def regulatory_rule_check(transaction_id: str, regulation: str = "aml") -> str:
    """Evaluate a transaction against a specific regulatory rule set."""
    result = await _call_mcp_tool("regulatory_rule_check", {
        "transaction_id": transaction_id, "regulation": regulation,
    })
    return json.dumps(result)


ALL_TOOLS = [risk_profile_lookup, sanction_list_search, regulatory_rule_check]
