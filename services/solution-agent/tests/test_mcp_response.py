from pathlib import Path
import sys


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import graph


def test_unwraps_structured_mcp_content():
    structured = {"products": [{"sku": "6787P"}]}
    payload = {
        "jsonrpc": "2.0",
        "result": {
            "content": [{"type": "text", "text": "human-readable copy"}],
            "structuredContent": structured,
            "isError": False,
        },
    }

    assert graph._unwrap_mcp_result(payload) == structured


def test_preserves_unwrapped_and_error_responses():
    assert graph._unwrap_mcp_result({"result": {"products": []}}) == {"products": []}
    assert graph._unwrap_mcp_result({"error": "unavailable"}) == {"error": "unavailable"}


def test_selects_vertical_from_query_and_workload():
    assert graph._select_vertical("Inventory monitoring at retail stores", "edge computing") == "retail"
    assert graph._select_vertical("Offline factories", "predictive maintenance") == "manufacturing"
    assert graph._select_vertical("On-prem fraud detection", "AI inference") == "financial_services"
