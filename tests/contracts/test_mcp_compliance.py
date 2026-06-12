"""Stage 0: Validate all MCP tool schema files parse and are structurally correct."""

import json
import pathlib

import pytest


CONTRACTS_DIR = pathlib.Path(__file__).parent.parent.parent / "contracts"
MCP_DIR = CONTRACTS_DIR / "mcp"

MCP_SCHEMAS = [
    "fhir-tools.json",
    "risk-tools.json",
    "platform-tools.json",
]


def load_schema(filename):
    path = MCP_DIR / filename
    assert path.exists(), f"MCP schema file missing: {path}"
    with open(path) as f:
        return json.load(f)


class TestMCPSchemaValidation:
    """Stage 0: All MCP tool schemas must parse and contain required structure."""

    @pytest.mark.parametrize("schema_file", MCP_SCHEMAS)
    def test_schema_parses(self, schema_file):
        schema = load_schema(schema_file)
        assert schema is not None

    @pytest.mark.parametrize("schema_file", MCP_SCHEMAS)
    def test_schema_has_name(self, schema_file):
        schema = load_schema(schema_file)
        assert "name" in schema
        assert isinstance(schema["name"], str)

    @pytest.mark.parametrize("schema_file", MCP_SCHEMAS)
    def test_schema_has_tools(self, schema_file):
        schema = load_schema(schema_file)
        assert "tools" in schema
        assert isinstance(schema["tools"], list)
        assert len(schema["tools"]) > 0

    @pytest.mark.parametrize("schema_file", MCP_SCHEMAS)
    def test_all_tools_have_required_fields(self, schema_file):
        schema = load_schema(schema_file)
        for tool in schema["tools"]:
            assert "name" in tool, f"Tool missing 'name' in {schema_file}"
            assert "description" in tool, f"Tool {tool.get('name', '?')} missing 'description'"
            assert "inputSchema" in tool, f"Tool {tool['name']} missing 'inputSchema'"

    @pytest.mark.parametrize("schema_file", MCP_SCHEMAS)
    def test_all_input_schemas_are_objects(self, schema_file):
        schema = load_schema(schema_file)
        for tool in schema["tools"]:
            input_schema = tool["inputSchema"]
            assert input_schema.get("type") == "object", (
                f"Tool {tool['name']} inputSchema must be type: object"
            )
            assert "properties" in input_schema, (
                f"Tool {tool['name']} inputSchema missing 'properties'"
            )

    @pytest.mark.parametrize("schema_file", MCP_SCHEMAS)
    def test_tool_names_are_snake_case(self, schema_file):
        schema = load_schema(schema_file)
        import re
        for tool in schema["tools"]:
            assert re.match(r'^[a-z][a-z0-9_]*$', tool["name"]), (
                f"Tool name '{tool['name']}' must be snake_case"
            )


class TestFHIRTools:
    """Stage 0: FHIR healthcare tools have correct schemas."""

    def test_has_patient_lookup(self):
        schema = load_schema("fhir-tools.json")
        names = [t["name"] for t in schema["tools"]]
        assert "fhir_patient_lookup" in names

    def test_has_clinical_code_search(self):
        schema = load_schema("fhir-tools.json")
        names = [t["name"] for t in schema["tools"]]
        assert "clinical_code_search" in names

    def test_has_drug_interaction_check(self):
        schema = load_schema("fhir-tools.json")
        names = [t["name"] for t in schema["tools"]]
        assert "drug_interaction_check" in names

    def test_patient_lookup_requires_patient_id(self):
        schema = load_schema("fhir-tools.json")
        tool = next(t for t in schema["tools"] if t["name"] == "fhir_patient_lookup")
        assert "patient_id" in tool["inputSchema"].get("required", [])


class TestRiskTools:
    """Stage 0: Risk/FinServ tools have correct schemas."""

    def test_has_risk_profile_lookup(self):
        schema = load_schema("risk-tools.json")
        names = [t["name"] for t in schema["tools"]]
        assert "risk_profile_lookup" in names

    def test_has_regulatory_rule_check(self):
        schema = load_schema("risk-tools.json")
        names = [t["name"] for t in schema["tools"]]
        assert "regulatory_rule_check" in names

    def test_has_sanction_list_search(self):
        schema = load_schema("risk-tools.json")
        names = [t["name"] for t in schema["tools"]]
        assert "sanction_list_search" in names

    def test_sanction_search_has_output_schema(self):
        schema = load_schema("risk-tools.json")
        tool = next(t for t in schema["tools"] if t["name"] == "sanction_list_search")
        assert "outputSchema" in tool


class TestPlatformTools:
    """Stage 0: Platform/orchestrator tools have correct schemas."""

    def test_has_agent_status(self):
        schema = load_schema("platform-tools.json")
        names = [t["name"] for t in schema["tools"]]
        assert "get_agent_status" in names

    def test_has_inference_stats(self):
        schema = load_schema("platform-tools.json")
        names = [t["name"] for t in schema["tools"]]
        assert "get_inference_stats" in names

    def test_inference_stats_tracks_kv_cache(self):
        schema = load_schema("platform-tools.json")
        tool = next(t for t in schema["tools"] if t["name"] == "get_inference_stats")
        output_props = tool["outputSchema"]["properties"]
        assert "kv_cache_hit_rate" in output_props
