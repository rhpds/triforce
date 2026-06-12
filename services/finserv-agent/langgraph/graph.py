"""LangGraph StateGraph for the FinServ Agent.

Multi-step fraud reasoning pipeline:
  analyze transaction → lookup risk profile → (conditional) check sanctions →
  evaluate compliance → score and recommend

All inference on Intel Xeon 6 CPU via MAAS/LiteLLM.
MCP tools provide risk profiles, sanctions screening, and regulatory rules.
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
CLASSIFY_MODEL = os.environ.get("CLASSIFY_MODEL", "granite-2b-cpu")
REASONING_MODEL = os.environ.get("REASONING_MODEL", "phi3-mini-cpu")


class FinServState(TypedDict):
    messages: list
    transaction: dict
    risk_score: float
    signals: list
    compliance_checks: list
    sanctions_result: Optional[dict]
    risk_profile: Optional[dict]
    recommendation: Optional[str]
    inference_log: list


def _get_llm(model: str = None) -> ChatOpenAI:
    return ChatOpenAI(
        model=model or CLASSIFY_MODEL,
        base_url=f"{LITELLM_API_BASE}/v1",
        api_key=LITELLM_API_KEY or "no-key",
        temperature=0.1,
        max_tokens=512,
    )


async def analyze_transaction_node(state: FinServState) -> dict:
    """Analyze transaction for suspicious signals using rule-based + LLM."""
    tx = state["transaction"]
    amount = tx.get("amount", 0)
    tx_type = tx.get("type", "unknown")
    sender_country = tx.get("sender", {}).get("country", "US")
    receiver_country = tx.get("receiver", {}).get("country", "US")

    signals = []
    risk = 10.0

    if amount > 10000:
        signals.append({"type": "unusual_amount", "severity": "warning",
                        "description": f"Amount ${amount:,.2f} exceeds $10,000 threshold", "confidence": 0.95})
        risk += 25

    if amount > 0 and amount % 1000 == 0:
        signals.append({"type": "round_amount", "severity": "info",
                        "description": "Transaction is a round number", "confidence": 0.7})
        risk += 5

    if sender_country != receiver_country:
        signals.append({"type": "geographic_anomaly", "severity": "info",
                        "description": f"Cross-border: {sender_country} → {receiver_country}", "confidence": 0.6})
        risk += 10

    if tx_type == "crypto" and amount > 5000:
        signals.append({"type": "pattern_deviation", "severity": "warning",
                        "description": "High-value crypto transaction", "confidence": 0.8})
        risk += 15

    llm = _get_llm(CLASSIFY_MODEL)
    start = time.monotonic()
    try:
        prompt = (
            f"Analyze this financial transaction for fraud risk. "
            f"Amount: ${amount:,.2f} {tx.get('currency','USD')}. "
            f"Type: {tx_type}. Sender: {sender_country}. Receiver: {receiver_country}. "
            f"Rate the additional risk as a number 0-20. Respond with just the number."
        )
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        latency_ms = int((time.monotonic() - start) * 1000)
        try:
            llm_risk = float(response.content.strip().split()[0])
            risk += min(llm_risk, 20)
        except (ValueError, IndexError):
            pass
    except Exception:
        latency_ms = 0

    risk = min(risk, 100)
    log_entry = {"node": "analyze", "model": CLASSIFY_MODEL, "latency_ms": latency_ms, "accelerator": "cpu"}

    return {
        "signals": signals,
        "risk_score": risk,
        "messages": [AIMessage(content=f"Initial analysis: risk={risk:.0f}, signals={len(signals)}")],
        "inference_log": state.get("inference_log", []) + [log_entry],
    }


async def lookup_risk_profile_node(state: FinServState) -> dict:
    """Look up sender's risk profile via MCP tool."""
    from mcp_tools import risk_profile_lookup

    sender_id = state["transaction"].get("sender", {}).get("id", "unknown")
    start = time.monotonic()
    try:
        result = await risk_profile_lookup.ainvoke({"customer_id": sender_id})
        latency_ms = int((time.monotonic() - start) * 1000)
        profile = json.loads(result) if isinstance(result, str) else result
    except Exception:
        profile = {"risk_score": 0, "risk_level": "unknown"}
        latency_ms = 0

    profile_risk = profile.get("risk_score", 0)
    current_risk = state["risk_score"]
    blended = (current_risk * 0.7) + (profile_risk * 0.3)

    log_entry = {"node": "lookup_risk_profile", "tool": "risk_profile_lookup", "latency_ms": latency_ms}

    return {
        "risk_profile": profile,
        "risk_score": blended,
        "messages": [AIMessage(content=f"Risk profile: {profile.get('risk_level','unknown')}, blended score={blended:.0f}")],
        "inference_log": state.get("inference_log", []) + [log_entry],
    }


async def check_sanctions_node(state: FinServState) -> dict:
    """Screen sender and receiver against sanctions lists via MCP tool."""
    from mcp_tools import sanction_list_search

    tx = state["transaction"]
    sender_name = tx.get("sender", {}).get("name", "Unknown")
    receiver_name = tx.get("receiver", {}).get("name", "Unknown")

    start = time.monotonic()
    try:
        sender_result = await sanction_list_search.ainvoke({"entity_name": sender_name})
        receiver_result = await sanction_list_search.ainvoke({"entity_name": receiver_name})
        latency_ms = int((time.monotonic() - start) * 1000)

        sender_data = json.loads(sender_result) if isinstance(sender_result, str) else sender_result
        receiver_data = json.loads(receiver_result) if isinstance(receiver_result, str) else receiver_result

        all_matches = sender_data.get("matches", []) + receiver_data.get("matches", [])
    except Exception:
        all_matches = []
        latency_ms = 0

    sanctions_result = {"screened": True, "matches": all_matches}
    risk_adjustment = 0
    new_signals = list(state["signals"])

    if all_matches:
        risk_adjustment = 40
        new_signals.append({
            "type": "sanctioned_entity", "severity": "critical",
            "description": f"Sanctions match: {len(all_matches)} hit(s)",
            "confidence": 0.99,
        })

    log_entry = {"node": "check_sanctions", "tool": "sanction_list_search", "latency_ms": latency_ms}

    return {
        "sanctions_result": sanctions_result,
        "risk_score": min(state["risk_score"] + risk_adjustment, 100),
        "signals": new_signals,
        "messages": [AIMessage(content=f"Sanctions screen: {len(all_matches)} matches")],
        "inference_log": state.get("inference_log", []) + [log_entry],
    }


async def compliance_node(state: FinServState) -> dict:
    """Evaluate transaction against regulatory rules via MCP + LLM reasoning."""
    from mcp_tools import regulatory_rule_check

    tx = state["transaction"]
    tx_id = tx.get("id", "unknown")

    regulations = ["aml", "kyc", "ofac"]
    checks = []

    start = time.monotonic()
    for reg in regulations:
        try:
            result = await regulatory_rule_check.ainvoke({"transaction_id": tx_id, "regulation": reg})
            data = json.loads(result) if isinstance(result, str) else result
            checks.append({
                "regulation": reg,
                "status": data.get("status", "pass"),
                "details": f"{data.get('rules_evaluated', 0)} rules evaluated",
            })
        except Exception:
            checks.append({"regulation": reg, "status": "review_required", "details": "Check failed"})
    tool_latency = int((time.monotonic() - start) * 1000)

    all_pass = all(c["status"] == "pass" for c in checks)

    llm = _get_llm(CLASSIFY_MODEL)
    llm_start = time.monotonic()
    try:
        prompt = (
            f"Transaction ${tx.get('amount',0):,.2f} {tx.get('type','unknown')}. "
            f"Compliance checks: {json.dumps(checks)}. "
            f"Risk signals: {json.dumps(state.get('signals', []))}. "
            f"Current risk score: {state['risk_score']:.0f}. "
            f"Should this transaction be approved, reviewed, held, or blocked? "
            f"Respond with just the recommendation word."
        )
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        llm_latency = int((time.monotonic() - llm_start) * 1000)
        rec = response.content.strip().lower().split()[0].rstrip(".,;:")
        if rec not in ("approve", "review", "hold", "block"):
            rec = _default_recommendation(state["risk_score"], all_pass)
    except Exception:
        rec = _default_recommendation(state["risk_score"], all_pass)
        llm_latency = 0

    log_entries = [
        {"node": "compliance_tools", "tool": "regulatory_rule_check", "latency_ms": tool_latency},
        {"node": "compliance_reasoning", "model": CLASSIFY_MODEL, "latency_ms": llm_latency, "accelerator": "cpu"},
    ]

    return {
        "compliance_checks": checks,
        "recommendation": rec,
        "messages": [AIMessage(content=f"Compliance: {'pass' if all_pass else 'issues found'}. Recommendation: {rec}")],
        "inference_log": state.get("inference_log", []) + log_entries,
    }


def _default_recommendation(risk_score: float, compliant: bool) -> str:
    if not compliant:
        return "hold"
    if risk_score >= 80:
        return "block"
    if risk_score >= 60:
        return "hold"
    if risk_score >= 30:
        return "review"
    return "approve"


def should_check_sanctions(state: FinServState) -> str:
    """Route to sanctions check for high-value or suspicious transactions."""
    tx = state["transaction"]
    amount = tx.get("amount", 0)
    signals = state.get("signals", [])

    has_warning = any(s.get("severity") in ("warning", "critical") for s in signals)
    if amount > 10000 or has_warning or tx.get("type") == "crypto":
        return "check_sanctions"
    return "compliance"


async def build_graph():
    builder = StateGraph(FinServState)

    builder.add_node("analyze", analyze_transaction_node)
    builder.add_node("lookup_risk", lookup_risk_profile_node)
    builder.add_node("check_sanctions", check_sanctions_node)
    builder.add_node("compliance", compliance_node)

    builder.set_entry_point("analyze")
    builder.add_edge("analyze", "lookup_risk")
    builder.add_conditional_edges(
        "lookup_risk",
        should_check_sanctions,
        {"check_sanctions": "check_sanctions", "compliance": "compliance"},
    )
    builder.add_edge("check_sanctions", "compliance")
    builder.add_edge("compliance", END)

    return builder.compile()
