"""Stage 0: Validate all OpenAPI contract specs parse and conform to 3.1."""

import json
import pathlib

import pytest
import yaml


CONTRACTS_DIR = pathlib.Path(__file__).parent.parent.parent / "contracts"
OPENAPI_DIR = CONTRACTS_DIR / "openapi"

OPENAPI_SPECS = [
    "healthcare-agent.yaml",
    "finserv-agent.yaml",
    "orchestrator.yaml",
    "a2a-protocol.yaml",
]


def load_spec(filename):
    path = OPENAPI_DIR / filename
    assert path.exists(), f"Contract file missing: {path}"
    with open(path) as f:
        return yaml.safe_load(f)


class TestOpenAPIContractValidation:
    """Stage 0: All OpenAPI specs must parse and contain required structure."""

    @pytest.mark.parametrize("spec_file", OPENAPI_SPECS)
    def test_spec_parses(self, spec_file):
        spec = load_spec(spec_file)
        assert spec is not None, f"{spec_file} parsed to None"

    @pytest.mark.parametrize("spec_file", OPENAPI_SPECS)
    def test_spec_has_openapi_version(self, spec_file):
        spec = load_spec(spec_file)
        assert "openapi" in spec, f"{spec_file} missing 'openapi' field"
        assert spec["openapi"].startswith("3."), f"{spec_file} not OpenAPI 3.x"

    @pytest.mark.parametrize("spec_file", OPENAPI_SPECS)
    def test_spec_has_info(self, spec_file):
        spec = load_spec(spec_file)
        assert "info" in spec, f"{spec_file} missing 'info'"
        assert "title" in spec["info"], f"{spec_file} missing info.title"
        assert "version" in spec["info"], f"{spec_file} missing info.version"

    @pytest.mark.parametrize("spec_file", OPENAPI_SPECS)
    def test_spec_has_paths(self, spec_file):
        spec = load_spec(spec_file)
        assert "paths" in spec, f"{spec_file} missing 'paths'"
        assert len(spec["paths"]) > 0, f"{spec_file} has no paths defined"

    @pytest.mark.parametrize("spec_file", OPENAPI_SPECS)
    def test_all_paths_have_operations(self, spec_file):
        spec = load_spec(spec_file)
        for path, methods in spec["paths"].items():
            valid_methods = {"get", "post", "put", "patch", "delete", "options", "head"}
            ops = [m for m in methods if m in valid_methods]
            assert len(ops) > 0, f"{spec_file}: path {path} has no operations"

    @pytest.mark.parametrize("spec_file", OPENAPI_SPECS)
    def test_all_operations_have_responses(self, spec_file):
        spec = load_spec(spec_file)
        valid_methods = {"get", "post", "put", "patch", "delete"}
        for path, methods in spec["paths"].items():
            for method in methods:
                if method in valid_methods:
                    op = methods[method]
                    assert "responses" in op, (
                        f"{spec_file}: {method.upper()} {path} missing responses"
                    )

    @pytest.mark.parametrize("spec_file", OPENAPI_SPECS)
    def test_schema_refs_resolve(self, spec_file):
        spec = load_spec(spec_file)
        schemas = spec.get("components", {}).get("schemas", {})

        def find_refs(obj, path=""):
            refs = []
            if isinstance(obj, dict):
                if "$ref" in obj:
                    refs.append((path, obj["$ref"]))
                for k, v in obj.items():
                    refs.extend(find_refs(v, f"{path}.{k}"))
            elif isinstance(obj, list):
                for i, v in enumerate(obj):
                    refs.extend(find_refs(v, f"{path}[{i}]"))
            return refs

        for ref_path, ref_value in find_refs(spec):
            if ref_value.startswith("#/components/schemas/"):
                schema_name = ref_value.split("/")[-1]
                assert schema_name in schemas, (
                    f"{spec_file}: unresolved $ref {ref_value} at {ref_path}"
                )


class TestHealthcareAgentContract:
    """Stage 0: Healthcare agent contract has required domain endpoints."""

    def test_has_health_endpoint(self):
        spec = load_spec("healthcare-agent.yaml")
        assert "/health" in spec["paths"]

    def test_has_a2a_endpoint(self):
        spec = load_spec("healthcare-agent.yaml")
        assert "/a2a" in spec["paths"]

    def test_has_agent_card_endpoint(self):
        spec = load_spec("healthcare-agent.yaml")
        assert "/.well-known/agent-card.json" in spec["paths"]

    def test_has_classify_endpoint(self):
        spec = load_spec("healthcare-agent.yaml")
        assert "/api/v1/classify" in spec["paths"]

    def test_has_extract_entities_endpoint(self):
        spec = load_spec("healthcare-agent.yaml")
        assert "/api/v1/extract-entities" in spec["paths"]

    def test_has_summarize_endpoint(self):
        spec = load_spec("healthcare-agent.yaml")
        assert "/api/v1/summarize" in spec["paths"]

    def test_has_speculative_status_endpoint(self):
        spec = load_spec("healthcare-agent.yaml")
        assert "/api/v1/speculative/status" in spec["paths"]

    def test_has_speculative_run_endpoint(self):
        spec = load_spec("healthcare-agent.yaml")
        assert "/api/v1/speculative/run" in spec["paths"]

    def test_classify_response_has_required_fields(self):
        spec = load_spec("healthcare-agent.yaml")
        schema = spec["components"]["schemas"]["ClassifyResponse"]
        required = schema.get("required", [])
        assert "classification" in required
        assert "confidence" in required
        assert "model" in required
        assert "inference_ms" in required


class TestFinServAgentContract:
    """Stage 0: FinServ agent contract has required domain endpoints."""

    def test_has_health_endpoint(self):
        spec = load_spec("finserv-agent.yaml")
        assert "/health" in spec["paths"]

    def test_has_a2a_endpoint(self):
        spec = load_spec("finserv-agent.yaml")
        assert "/a2a" in spec["paths"]

    def test_has_score_transaction_endpoint(self):
        spec = load_spec("finserv-agent.yaml")
        assert "/api/v1/score-transaction" in spec["paths"]

    def test_has_check_compliance_endpoint(self):
        spec = load_spec("finserv-agent.yaml")
        assert "/api/v1/check-compliance" in spec["paths"]

    def test_has_assess_risk_endpoint(self):
        spec = load_spec("finserv-agent.yaml")
        assert "/api/v1/assess-risk" in spec["paths"]

    def test_fraud_score_response_has_required_fields(self):
        spec = load_spec("finserv-agent.yaml")
        schema = spec["components"]["schemas"]["ScoreTransactionResponse"]
        required = schema.get("required", [])
        assert "risk_score" in required
        assert "risk_level" in required
        assert "signals" in required
        assert "model" in required
        assert "inference_ms" in required


class TestOrchestratorContract:
    """Stage 0: Orchestrator contract has required coordination endpoints."""

    def test_has_health_endpoint(self):
        spec = load_spec("orchestrator.yaml")
        assert "/health" in spec["paths"]

    def test_has_agents_endpoint(self):
        spec = load_spec("orchestrator.yaml")
        assert "/api/v1/agents" in spec["paths"]

    def test_has_workflows_endpoint(self):
        spec = load_spec("orchestrator.yaml")
        assert "/api/v1/workflows" in spec["paths"]

    def test_has_synthetic_start_endpoint(self):
        spec = load_spec("orchestrator.yaml")
        assert "/api/v1/synthetic/start" in spec["paths"]

    def test_has_metrics_endpoint(self):
        spec = load_spec("orchestrator.yaml")
        assert "/api/v1/metrics" in spec["paths"]

    def test_metrics_includes_kv_cache(self):
        spec = load_spec("orchestrator.yaml")
        inference_schema = spec["components"]["schemas"]["PlatformMetrics"]["properties"]["inference"]["properties"]
        assert "kv_cache_hit_rate" in inference_schema


class TestA2AProtocolContract:
    """Stage 0: A2A protocol contract matches spec v0.2.6."""

    def test_has_agent_card_endpoint(self):
        spec = load_spec("a2a-protocol.yaml")
        assert "/.well-known/agent-card.json" in spec["paths"]

    def test_has_a2a_endpoint(self):
        spec = load_spec("a2a-protocol.yaml")
        assert "/a2a" in spec["paths"]

    def test_agent_card_has_required_fields(self):
        spec = load_spec("a2a-protocol.yaml")
        schema = spec["components"]["schemas"]["AgentCard"]
        required = schema.get("required", [])
        for field in ["name", "description", "version", "url", "protocolVersion", "capabilities", "skills"]:
            assert field in required, f"AgentCard missing required field: {field}"

    def test_task_status_has_valid_states(self):
        spec = load_spec("a2a-protocol.yaml")
        status_schema = spec["components"]["schemas"]["TaskStatus"]
        state_enum = status_schema["properties"]["state"]["enum"]
        assert set(state_enum) == {"pending", "running", "completed", "failed"}

    def test_jsonrpc_methods(self):
        spec = load_spec("a2a-protocol.yaml")
        req_schema = spec["components"]["schemas"]["JsonRpcRequest"]
        methods = req_schema["properties"]["method"]["enum"]
        assert "tasks/send" in methods
        assert "tasks/get" in methods
        assert "tasks/cancel" in methods
