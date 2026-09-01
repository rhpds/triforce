"""LangGraph StateGraph for the Solution Architect Agent.

Linear pipeline: understand requirements -> lookup hardware ->
lookup platform -> get architecture -> generate brief.
All inference on Intel Xeon 6 CPU via RACMaaS.
"""

import json
import logging
import os
import time
from pathlib import Path
from typing import Optional

import httpx
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from typing_extensions import TypedDict

from prompts import BRIEF_PROMPT, REQUIREMENTS_PROMPT

logger = logging.getLogger("solution-agent.graph")

LITELLM_API_BASE = os.environ.get("LITELLM_API_BASE", "")
LITELLM_API_KEY = os.environ.get("LITELLM_API_KEY", "")
ADVISOR_MODEL = os.environ.get("ADVISOR_MODEL", "qwen25-3b-cpu")
MCP_SERVER_URL = os.environ.get("MCP_SERVER_URL", "http://solution-tools:8095")
PROMPT_PATH = os.environ.get("PROMPT_PATH", "/etc/advisor/system_prompt")


class SolutionState(TypedDict):
    messages: list
    query: str
    requirements: Optional[dict]
    hardware_options: list
    platform_capabilities: list
    architecture: Optional[dict]
    brief: Optional[str]
    inference_log: list


def _get_llm(max_tokens: int = 2048) -> ChatOpenAI:
    return ChatOpenAI(
        model=ADVISOR_MODEL,
        base_url=f"{LITELLM_API_BASE}/v1",
        api_key=LITELLM_API_KEY or "no-key",
        temperature=0.1,
        max_tokens=max_tokens,
    )


def _safe_llm_error(exc: Exception) -> str:
    """Return a bounded diagnostic without exposing the configured credential."""
    message = str(exc)
    if LITELLM_API_KEY:
        message = message.replace(LITELLM_API_KEY, "[redacted]")
    return message[:500]


def _get_advisor_prompt() -> str:
    """Return the learner-managed advisor prompt when one is mounted."""
    prompt_file = Path(PROMPT_PATH)
    if prompt_file.is_file():
        prompt = prompt_file.read_text().strip()
        if prompt:
            return prompt
    return "You are a Red Hat + Intel Solution Architect."


def _unwrap_mcp_result(payload: dict) -> dict:
    """Return the machine-readable payload from a JSON-RPC MCP response."""
    result = payload.get("result", payload)
    if isinstance(result, dict) and isinstance(result.get("structuredContent"), dict):
        return result["structuredContent"]
    return result


def _select_vertical(query: str, workload: str) -> str:
    """Choose the reference-architecture vertical from all customer context."""
    context = f"{query} {workload}".lower()
    vertical_keywords = {
        "financial_services": ("financial", "fraud", "bank", "insurance"),
        "retail": ("retail", "store", "inventory"),
        "manufacturing": ("manufactur", "factory", "predictive maintenance", "edge"),
        "telco": ("telco", "telecom", "5g"),
        "healthcare": ("health", "clinical", "medical"),
    }
    for vertical, keywords in vertical_keywords.items():
        if any(keyword in context for keyword in keywords):
            return vertical
    return "healthcare"


async def _mcp_call(tool_name: str, arguments: dict) -> dict:
    """Call an MCP tool via JSON-RPC 2.0."""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(f"{MCP_SERVER_URL}/mcp", json={
                "jsonrpc": "2.0", "id": "1",
                "method": "tools/call",
                "params": {"name": tool_name, "arguments": arguments},
            })
            return _unwrap_mcp_result(resp.json())
    except Exception as e:
        return {"error": str(e)}

def _extract_json(text: str) -> dict:
    """Extract a JSON object from LLM output."""
    text = text.strip()
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass
    return {}

async def understand_requirements(state: SolutionState) -> dict:
    """Node 1: LLM extracts structured requirements from the customer query."""
    llm = _get_llm(max_tokens=512)
    start = time.monotonic()
    try:
        response = await llm.ainvoke([
            SystemMessage(content=REQUIREMENTS_PROMPT),
            HumanMessage(content=state["query"]),
        ])
        latency_ms = int((time.monotonic() - start) * 1000)
        requirements = _extract_json(response.content)
    except Exception as exc:
        error = _safe_llm_error(exc)
        logger.error("RACMaaS requirement extraction failed: %s", error)
        requirements = {"workload_type": "not specified"}
        latency_ms = int((time.monotonic() - start) * 1000)

    return {
        "requirements": requirements,
        "messages": [AIMessage(content=f"Requirements: {json.dumps(requirements)}")],
        "inference_log": state.get("inference_log", []) + [{
            "node": "understand_requirements", "model": ADVISOR_MODEL,
            "latency_ms": latency_ms, "accelerator": "cpu",
            **({"error": error} if "error" in locals() else {}),
        }],
    }

async def lookup_hardware(state: SolutionState) -> dict:
    """Node 2: MCP tool call to find matching Intel hardware."""
    reqs = state.get("requirements", {})
    use_case = reqs.get("workload_type", "ai_inference").replace(" ", "_").lower()
    start = time.monotonic()
    result = await _mcp_call("intel_hardware_lookup", {
        "family": "xeon6",
        "use_case": use_case,
    })
    # Requirement extraction can produce a useful but non-catalogue label
    # (for example "edge_computing"). Keep the Xeon 6 recommendation useful
    # by retrying without the optional use-case filter when there is no match.
    if isinstance(result, dict) and not result.get("products"):
        result = await _mcp_call("intel_hardware_lookup", {"family": "xeon6"})
    latency_ms = int((time.monotonic() - start) * 1000)
    options = result.get("products", []) if isinstance(result, dict) else result
    return {
        "hardware_options": options,
        "messages": [AIMessage(content=f"Found {len(options)} hardware options")],
        "inference_log": state.get("inference_log", []) + [{
            "node": "lookup_hardware", "tool": "intel_hardware_lookup",
            "latency_ms": latency_ms,
        }],
    }

async def lookup_platform(state: SolutionState) -> dict:
    """Node 3: MCP tool call to find applicable OpenShift capabilities."""
    start = time.monotonic()
    result = await _mcp_call("openshift_capabilities", {
        "capability_area": "ai_ml",
        "detail_level": "detailed",
    })
    latency_ms = int((time.monotonic() - start) * 1000)
    caps = result.get("capabilities", []) if isinstance(result, dict) else result
    return {
        "platform_capabilities": caps,
        "messages": [AIMessage(content=f"Found {len(caps)} platform capabilities")],
        "inference_log": state.get("inference_log", []) + [{
            "node": "lookup_platform", "tool": "openshift_capabilities",
            "latency_ms": latency_ms,
        }],
    }

async def get_architecture(state: SolutionState) -> dict:
    """Node 4: MCP tool call to retrieve a reference architecture."""
    reqs = state.get("requirements", {})
    workload = reqs.get("workload_type", "")
    vertical = _select_vertical(state.get("query", ""), workload)
    start = time.monotonic()
    result = await _mcp_call("reference_architectures", {
        "vertical": vertical,
        "scale": "medium",
    })
    latency_ms = int((time.monotonic() - start) * 1000)
    arch = result.get("architecture", result) if isinstance(result, dict) else result
    return {
        "architecture": arch,
        "messages": [AIMessage(content="Reference architecture retrieved")],
        "inference_log": state.get("inference_log", []) + [{
            "node": "get_architecture", "tool": "reference_architectures",
            "latency_ms": latency_ms,
        }],
    }

async def generate_brief(state: SolutionState) -> dict:
    """Node 5: LLM synthesizes all tool results into a solution brief."""
    task_context = BRIEF_PROMPT.format(
        requirements=json.dumps(state.get("requirements", {}), indent=2),
        hardware_options=json.dumps(state.get("hardware_options", []), indent=2),
        platform_capabilities=json.dumps(state.get("platform_capabilities", []), indent=2),
        architecture=json.dumps(state.get("architecture", {}), indent=2),
    )
    prompt = f"{_get_advisor_prompt()}\n\n{task_context}"
    llm = _get_llm(max_tokens=2048)
    start = time.monotonic()
    try:
        response = await llm.ainvoke([
            SystemMessage(content=prompt),
            HumanMessage(content=f"Generate the solution brief for: {state['query']}"),
        ])
        latency_ms = int((time.monotonic() - start) * 1000)
        brief = response.content.strip()
    except Exception as exc:
        error = _safe_llm_error(exc)
        logger.error("RACMaaS brief generation failed: %s", error)
        brief = "Brief generation failed. Please try again."
        latency_ms = int((time.monotonic() - start) * 1000)

    return {
        "brief": brief,
        "messages": [AIMessage(content=brief)],
        "inference_log": state.get("inference_log", []) + [{
            "node": "generate_brief", "model": ADVISOR_MODEL,
            "latency_ms": latency_ms, "accelerator": "cpu",
            **({"error": error} if "error" in locals() else {}),
        }],
    }

async def build_graph():
    """Build and compile the solution architect StateGraph."""
    builder = StateGraph(SolutionState)
    builder.add_node("understand_requirements", understand_requirements)
    builder.add_node("lookup_hardware", lookup_hardware)
    builder.add_node("lookup_platform", lookup_platform)
    builder.add_node("get_architecture", get_architecture)
    builder.add_node("generate_brief", generate_brief)

    builder.set_entry_point("understand_requirements")
    builder.add_edge("understand_requirements", "lookup_hardware")
    builder.add_edge("lookup_hardware", "lookup_platform")
    builder.add_edge("lookup_platform", "get_architecture")
    builder.add_edge("get_architecture", "generate_brief")
    builder.add_edge("generate_brief", END)

    return builder.compile()
