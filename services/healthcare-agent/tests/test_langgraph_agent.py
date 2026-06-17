"""RED tests for LangGraph healthcare agent.

These tests define the expected behavior of the LangGraph StateGraph.
They should all FAIL until graph.py is implemented (RED phase of TDD).
"""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


class TestGraphCompilation:
    """The StateGraph must compile without errors."""

    def test_graph_module_imports(self):
        from graph import build_graph, HealthcareState
        assert HealthcareState is not None

    def test_state_has_required_fields(self):
        from graph import HealthcareState
        hints = HealthcareState.__annotations__
        assert "messages" in hints
        assert "patient_id" in hints
        assert "classification" in hints
        assert "entities" in hints

    @pytest.mark.asyncio
    async def test_graph_compiles(self):
        from graph import build_graph
        graph = await build_graph()
        assert graph is not None
        assert hasattr(graph, "ainvoke")


class TestClassifyNode:
    """Classify node must update state with document classification."""

    @pytest.mark.asyncio
    async def test_classify_node_sets_classification(self):
        from graph import classify_node
        state = {
            "messages": [],
            "patient_id": "test-1",
            "text": "DISCHARGE SUMMARY: Patient discharged in stable condition.",
            "classification": None,
            "entities": [],
            "drug_interactions": [],
            "summary": None,
        }
        result = await classify_node(state)
        assert "classification" in result
        assert result["classification"] is not None

    @pytest.mark.asyncio
    async def test_classify_node_returns_valid_type(self):
        from graph import classify_node
        valid_types = [
            "discharge_summary", "progress_note", "lab_report",
            "radiology_report", "pathology_report", "surgical_note",
            "consultation", "prescription", "unknown",
        ]
        state = {
            "messages": [],
            "patient_id": "test-2",
            "text": "Lab results: WBC 12.5, Hemoglobin 10.2",
            "classification": None,
            "entities": [],
            "drug_interactions": [],
            "summary": None,
        }
        result = await classify_node(state)
        assert result["classification"] in valid_types


class TestMCPToolNode:
    """Tool node must call MCP gateway and return structured results."""

    @pytest.mark.asyncio
    async def test_fhir_lookup_tool_exists(self):
        from mcp_tools import fhir_patient_lookup
        assert hasattr(fhir_patient_lookup, 'invoke') or callable(fhir_patient_lookup)

    @pytest.mark.asyncio
    async def test_drug_interaction_tool_exists(self):
        from mcp_tools import drug_interaction_check
        assert hasattr(drug_interaction_check, 'invoke') or callable(drug_interaction_check)

    @pytest.mark.asyncio
    async def test_clinical_code_search_tool_exists(self):
        from mcp_tools import clinical_code_search
        assert hasattr(clinical_code_search, 'invoke') or callable(clinical_code_search)

    @pytest.mark.asyncio
    async def test_fhir_lookup_returns_patient_data(self):
        from mcp_tools import fhir_patient_lookup
        result = await fhir_patient_lookup.ainvoke({"patient_id": "test-patient-1"})
        data = json.loads(result) if isinstance(result, str) else result
        assert "patient_id" in data
        assert "conditions" in data
        assert "medications" in data

    @pytest.mark.asyncio
    async def test_drug_interaction_returns_interactions(self):
        from mcp_tools import drug_interaction_check
        result = await drug_interaction_check.ainvoke(
            {"medications": ["Metformin", "Lisinopril"]}
        )
        data = json.loads(result) if isinstance(result, str) else result
        assert "interactions" in data


class TestConditionalRouting:
    """Graph must route conditionally based on state."""

    @pytest.mark.asyncio
    async def test_route_function_exists(self):
        from graph import should_check_interactions
        assert callable(should_check_interactions)

    @pytest.mark.asyncio
    async def test_routes_to_check_when_medications_found(self):
        from graph import should_check_interactions
        state = {
            "entities": [
                {"text": "Metformin", "type": "medication"},
                {"text": "Lisinopril", "type": "medication"},
            ],
        }
        result = should_check_interactions(state)
        assert result == "check_interactions"

    @pytest.mark.asyncio
    async def test_routes_to_summarize_when_no_medications(self):
        from graph import should_check_interactions
        state = {
            "entities": [
                {"text": "Hypertension", "type": "condition"},
            ],
        }
        result = should_check_interactions(state)
        assert result == "summarize"


class TestFullGraphExecution:
    """Full graph must execute multi-step pipeline end-to-end."""

    @pytest.mark.asyncio
    async def test_graph_returns_classification(self):
        from graph import build_graph
        graph = await build_graph()
        result = await graph.ainvoke({
            "messages": [],
            "patient_id": "e2e-test-1",
            "text": "Patient discharged after treatment for pneumonia. On Amoxicillin 500mg.",
            "classification": None,
            "entities": [],
            "drug_interactions": [],
            "summary": None,
        })
        assert result["classification"] is not None

    @pytest.mark.asyncio
    async def test_graph_runs_extract_node(self):
        from graph import build_graph
        graph = await build_graph()
        result = await graph.ainvoke({
            "messages": [],
            "patient_id": "e2e-test-2",
            "text": "Patient has Type 2 Diabetes on Metformin 500mg and Hypertension on Lisinopril.",
            "classification": None,
            "entities": [],
            "drug_interactions": [],
            "summary": None,
        })
        assert "entities" in result
        assert isinstance(result["entities"], list)
        log_nodes = [e["node"] for e in result.get("inference_log", [])]
        assert "extract_entities" in log_nodes

    @pytest.mark.asyncio
    async def test_graph_produces_summary(self):
        from graph import build_graph
        graph = await build_graph()
        result = await graph.ainvoke({
            "messages": [],
            "patient_id": "e2e-test-3",
            "text": "DISCHARGE SUMMARY: 65yo male with chest pain. Troponin negative. Discharged stable.",
            "classification": None,
            "entities": [],
            "drug_interactions": [],
            "summary": None,
        })
        assert result["summary"] is not None
        assert len(result["summary"]) > 0
