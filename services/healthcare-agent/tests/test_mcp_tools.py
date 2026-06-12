"""RED tests for MCP tool wrappers.

These tests verify MCP tools conform to contracts and integrate with the MCP gateway.
They should all FAIL until mcp_tools.py is implemented.
"""

import json

import pytest


class TestMCPToolSchemaCompliance:
    """MCP tools must match schemas defined in contracts/mcp/fhir-tools.json."""

    @pytest.mark.asyncio
    async def test_fhir_lookup_output_has_required_fields(self):
        from mcp_tools import fhir_patient_lookup
        result = await fhir_patient_lookup.ainvoke({"patient_id": "schema-test"})
        data = json.loads(result) if isinstance(result, str) else result
        for field in ["patient_id", "name", "age", "gender", "conditions", "medications"]:
            assert field in data, f"fhir_patient_lookup missing field: {field}"

    @pytest.mark.asyncio
    async def test_fhir_lookup_conditions_structure(self):
        from mcp_tools import fhir_patient_lookup
        result = await fhir_patient_lookup.ainvoke({"patient_id": "schema-test"})
        data = json.loads(result) if isinstance(result, str) else result
        assert isinstance(data["conditions"], list)
        if data["conditions"]:
            cond = data["conditions"][0]
            assert "code" in cond
            assert "display" in cond

    @pytest.mark.asyncio
    async def test_drug_interaction_output_has_required_fields(self):
        from mcp_tools import drug_interaction_check
        result = await drug_interaction_check.ainvoke(
            {"medications": ["Warfarin", "Aspirin"]}
        )
        data = json.loads(result) if isinstance(result, str) else result
        assert "interactions" in data
        assert isinstance(data["interactions"], list)

    @pytest.mark.asyncio
    async def test_drug_interaction_severity_is_valid(self):
        from mcp_tools import drug_interaction_check
        result = await drug_interaction_check.ainvoke(
            {"medications": ["Metformin", "Lisinopril"]}
        )
        data = json.loads(result) if isinstance(result, str) else result
        valid_severities = ["minor", "moderate", "major", "contraindicated"]
        for interaction in data["interactions"]:
            assert interaction["severity"] in valid_severities

    @pytest.mark.asyncio
    async def test_clinical_code_search_returns_results(self):
        from mcp_tools import clinical_code_search
        result = await clinical_code_search.ainvoke(
            {"query": "diabetes", "code_system": "icd10"}
        )
        data = json.loads(result) if isinstance(result, str) else result
        assert "results" in data
        assert isinstance(data["results"], list)
        if data["results"]:
            assert "code" in data["results"][0]
            assert "display" in data["results"][0]


class TestMCPToolErrorHandling:
    """Tools must handle errors gracefully."""

    @pytest.mark.asyncio
    async def test_fhir_lookup_with_nonexistent_patient(self):
        from mcp_tools import fhir_patient_lookup
        result = await fhir_patient_lookup.ainvoke({"patient_id": "nonexistent-999"})
        assert result is not None

    @pytest.mark.asyncio
    async def test_drug_interaction_with_single_medication(self):
        from mcp_tools import drug_interaction_check
        result = await drug_interaction_check.ainvoke({"medications": ["Aspirin"]})
        data = json.loads(result) if isinstance(result, str) else result
        assert "interactions" in data
