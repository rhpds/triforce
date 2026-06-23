"""LangGraph StateGraph for the Healthcare Agent.

Multi-step clinical NLP pipeline:
  classify → extract entities → (if medications) check interactions → summarize

All inference runs on Intel Xeon 6 CPU via MAAS/LiteLLM.
MCP tools provide FHIR data, drug interaction checking, and clinical code search.
"""

import json
import os
import time
from typing import Optional

from langchain_core.messages import AIMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph

from typing_extensions import TypedDict

LITELLM_API_BASE = os.environ.get("LITELLM_API_BASE", "https://maas-rhdp.apps.maas.redhatworkshops.io")
LITELLM_API_KEY = os.environ.get("LITELLM_API_KEY", "")
CLASSIFY_MODEL = os.environ.get("CLASSIFY_MODEL", "qwen25-3b-cpu")
NER_MODEL = os.environ.get("NER_MODEL", "granite-2b-cpu")
SUMMARIZE_MODEL = os.environ.get("SUMMARIZE_MODEL", "qwen25-3b-cpu")
REASONING_MODEL = os.environ.get("REASONING_MODEL", "phi3-mini-cpu")


def set_api_key(key: str):
    """Set the API key dynamically (used by attestation module)."""
    global LITELLM_API_KEY
    LITELLM_API_KEY = key


class HealthcareState(TypedDict):
    messages: list
    patient_id: str
    text: str
    classification: Optional[str]
    entities: list
    drug_interactions: list
    summary: Optional[str]
    inference_log: list


def _get_llm(model: str = None, max_tokens: int = 1024) -> ChatOpenAI:
    return ChatOpenAI(
        model=model or CLASSIFY_MODEL,
        base_url=f"{LITELLM_API_BASE}/v1",
        api_key=LITELLM_API_KEY or "no-key",
        temperature=0.1,
        max_tokens=max_tokens,
    )


async def classify_node(state: HealthcareState) -> dict:
    """Classify the clinical document type."""
    import adaptive_cache

    text = state["text"]

    start = time.monotonic()
    cached = adaptive_cache.lookup(text)
    if cached:
        latency_ms = int((time.monotonic() - start) * 1000)
        classification = cached["classification"]
        log_entry = {
            "node": "classify", "model": "adaptive-cache",
            "latency_ms": latency_ms, "accelerator": "cpu",
            "kv_cache_hit": True,
        }
        return {
            "classification": classification,
            "messages": [AIMessage(content=f"Classification: {classification}")],
            "inference_log": state.get("inference_log", []) + [log_entry],
        }

    prompt = (
        "Classify this clinical document into exactly one category: "
        "discharge_summary, progress_note, lab_report, radiology_report, "
        "pathology_report, surgical_note, consultation, prescription.\n\n"
        "Respond with only the category name.\n\n"
        f"Document:\n{text[:5000]}"
    )

    llm = _get_llm(CLASSIFY_MODEL, max_tokens=64)
    start = time.monotonic()
    try:
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        latency_ms = int((time.monotonic() - start) * 1000)
        classification = response.content.strip().lower().replace(" ", "_")
        valid = [
            "discharge_summary", "progress_note", "lab_report",
            "radiology_report", "pathology_report", "surgical_note",
            "consultation", "prescription",
        ]
        if classification not in valid:
            classification = "unknown"
    except Exception:
        classification = "unknown"
        latency_ms = 0

    if classification != "unknown":
        await adaptive_cache.store(text, classification)

    log_entry = {
        "node": "classify", "model": CLASSIFY_MODEL,
        "latency_ms": latency_ms, "accelerator": "cpu",
        "kv_cache_hit": False,
    }

    return {
        "classification": classification,
        "messages": [AIMessage(content=f"Classification: {classification}")],
        "inference_log": state.get("inference_log", []) + [log_entry],
    }


def _extract_json_array(text: str) -> list:
    """Extract a JSON array from model output, handling truncation and extra text."""
    text = text.strip()
    start_idx = text.find("[")
    if start_idx == -1:
        return []
    end_idx = text.rfind("]")
    if end_idx != -1 and end_idx > start_idx:
        try:
            result = json.loads(text[start_idx:end_idx + 1])
            if isinstance(result, list):
                return result
        except json.JSONDecodeError:
            pass
    fragment = text[start_idx:]
    for trim in ["},", "}", '"', ",", " "]:
        pos = fragment.rfind(trim)
        if pos > 0:
            attempt = fragment[:pos + len(trim)].rstrip(",").rstrip() + "]"
            try:
                result = json.loads(attempt)
                if isinstance(result, list):
                    return result
            except json.JSONDecodeError:
                continue
    return []


async def extract_entities_node(state: HealthcareState) -> dict:
    """Extract medical entities (conditions, medications, procedures) via NER."""
    text = state["text"]
    prompt = (
        "Extract medical entities from this clinical text.\n"
        "Return ONLY a JSON array. List ALL medications first, then conditions, then procedures.\n"
        "Each object: text, type. Valid types: medication, condition, procedure.\n\n"
        "Example:\n"
        'Input: "Patient has Hypertension, takes Metformin 500mg and Aspirin."\n'
        'Output: [{"text":"Metformin","type":"medication"},{"text":"Aspirin","type":"medication"},'
        '{"text":"Hypertension","type":"condition"}]\n\n'
        f"Input: \"{text[:2000]}\"\n"
        "Output: "
    )

    llm = _get_llm(NER_MODEL)
    start = time.monotonic()
    try:
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        latency_ms = int((time.monotonic() - start) * 1000)
        raw = _extract_json_array(response.content)
        entities = []
        valid_types = ["condition", "medication", "procedure", "lab_test", "anatomy", "dosage"]
        seen = set()
        for e in raw:
            if isinstance(e, dict) and "text" in e and "type" in e:
                etype = e["type"].lower()
                etext = e["text"].strip()
                if etype in valid_types and etext and etext not in seen:
                    seen.add(etext)
                    entities.append({
                        "text": etext,
                        "type": etype,
                        "start": e.get("start", 0),
                        "end": e.get("end", len(etext)),
                    })
    except Exception:
        entities = []
        latency_ms = 0

    log_entry = {"node": "extract_entities", "model": NER_MODEL, "latency_ms": latency_ms, "accelerator": "cpu"}

    return {
        "entities": entities,
        "messages": [AIMessage(content=f"Extracted {len(entities)} entities")],
        "inference_log": state.get("inference_log", []) + [log_entry],
    }


async def check_interactions_node(state: HealthcareState) -> dict:
    """Check drug interactions for medications found in entities (via MCP tool)."""
    from mcp_tools import drug_interaction_check

    medications = [e["text"] for e in state.get("entities", []) if e.get("type") == "medication"]

    if len(medications) < 2:
        return {
            "drug_interactions": [],
            "messages": [AIMessage(content="No drug interactions to check (< 2 medications)")],
        }

    start = time.monotonic()
    try:
        result = await drug_interaction_check.ainvoke({"medications": medications})
        latency_ms = int((time.monotonic() - start) * 1000)
        data = json.loads(result) if isinstance(result, str) else result
        interactions = data.get("interactions", [])
    except Exception:
        interactions = []
        latency_ms = 0

    log_entry = {"node": "check_interactions", "model": "mcp-tool", "tool": "drug_interaction_check", "latency_ms": latency_ms}

    return {
        "drug_interactions": interactions,
        "messages": [AIMessage(content=f"Found {len(interactions)} drug interactions")],
        "inference_log": state.get("inference_log", []) + [log_entry],
    }


async def summarize_node(state: HealthcareState) -> dict:
    """Generate a clinical summary incorporating all prior analysis."""
    text = state["text"]
    classification = state.get("classification", "unknown")
    entities = state.get("entities", [])
    interactions = state.get("drug_interactions", [])

    context_parts = [f"Document type: {classification}"]
    if entities:
        entity_summary = ", ".join(f"{e['text']} ({e['type']})" for e in entities[:10])
        context_parts.append(f"Entities found: {entity_summary}")
    if interactions:
        interaction_summary = "; ".join(
            f"{i.get('drug_a','?')} + {i.get('drug_b','?')}: {i.get('severity','?')}"
            for i in interactions
        )
        context_parts.append(f"Drug interactions: {interaction_summary}")

    context = "\n".join(context_parts)
    prompt = (
        f"Using the following analysis context:\n{context}\n\n"
        f"Summarize this patient record concisely:\n{text[:8000]}"
    )

    llm = _get_llm(SUMMARIZE_MODEL)
    start = time.monotonic()
    try:
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        latency_ms = int((time.monotonic() - start) * 1000)
        summary = response.content.strip()
    except Exception:
        summary = "Summary unavailable."
        latency_ms = 0

    log_entry = {"node": "summarize", "model": SUMMARIZE_MODEL, "latency_ms": latency_ms, "accelerator": "cpu"}

    return {
        "summary": summary,
        "messages": [AIMessage(content=summary)],
        "inference_log": state.get("inference_log", []) + [log_entry],
    }


def should_check_interactions(state: HealthcareState) -> str:
    """Route to drug interaction check if medications were found."""
    entities = state.get("entities", [])
    med_count = sum(1 for e in entities if e.get("type") == "medication")
    if med_count >= 2:
        return "check_interactions"
    return "summarize"


async def build_graph():
    """Build and compile the healthcare StateGraph."""
    builder = StateGraph(HealthcareState)

    builder.add_node("classify", classify_node)
    builder.add_node("extract_entities", extract_entities_node)
    builder.add_node("check_interactions", check_interactions_node)
    builder.add_node("summarize", summarize_node)

    builder.set_entry_point("classify")
    builder.add_edge("classify", "extract_entities")
    builder.add_conditional_edges(
        "extract_entities",
        should_check_interactions,
        {"check_interactions": "check_interactions", "summarize": "summarize"},
    )
    builder.add_edge("check_interactions", "summarize")
    builder.add_edge("summarize", END)

    return builder.compile()
