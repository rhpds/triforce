"""Stage 0: Validate all AsyncAPI event schemas parse and are structurally correct."""

import pathlib

import pytest
import yaml


CONTRACTS_DIR = pathlib.Path(__file__).parent.parent.parent / "contracts"
ASYNCAPI_DIR = CONTRACTS_DIR / "asyncapi"

ASYNCAPI_SPECS = [
    "healthcare-events.yaml",
    "finserv-events.yaml",
    "orchestrator-events.yaml",
]


def load_spec(filename):
    path = ASYNCAPI_DIR / filename
    assert path.exists(), f"AsyncAPI contract file missing: {path}"
    with open(path) as f:
        return yaml.safe_load(f)


class TestAsyncAPIContractValidation:
    """Stage 0: All AsyncAPI specs must parse and contain required structure."""

    @pytest.mark.parametrize("spec_file", ASYNCAPI_SPECS)
    def test_spec_parses(self, spec_file):
        spec = load_spec(spec_file)
        assert spec is not None

    @pytest.mark.parametrize("spec_file", ASYNCAPI_SPECS)
    def test_spec_has_asyncapi_version(self, spec_file):
        spec = load_spec(spec_file)
        assert "asyncapi" in spec, f"{spec_file} missing 'asyncapi' field"
        assert spec["asyncapi"].startswith("3."), f"{spec_file} not AsyncAPI 3.x"

    @pytest.mark.parametrize("spec_file", ASYNCAPI_SPECS)
    def test_spec_has_info(self, spec_file):
        spec = load_spec(spec_file)
        assert "info" in spec
        assert "title" in spec["info"]
        assert "version" in spec["info"]

    @pytest.mark.parametrize("spec_file", ASYNCAPI_SPECS)
    def test_spec_has_channels(self, spec_file):
        spec = load_spec(spec_file)
        assert "channels" in spec
        assert len(spec["channels"]) > 0

    @pytest.mark.parametrize("spec_file", ASYNCAPI_SPECS)
    def test_all_channels_have_address(self, spec_file):
        spec = load_spec(spec_file)
        for name, channel in spec["channels"].items():
            assert "address" in channel, f"{spec_file}: channel {name} missing 'address'"

    @pytest.mark.parametrize("spec_file", ASYNCAPI_SPECS)
    def test_all_channels_have_messages(self, spec_file):
        spec = load_spec(spec_file)
        for name, channel in spec["channels"].items():
            assert "messages" in channel, f"{spec_file}: channel {name} missing 'messages'"

    @pytest.mark.parametrize("spec_file", ASYNCAPI_SPECS)
    def test_has_operations(self, spec_file):
        spec = load_spec(spec_file)
        assert "operations" in spec
        assert len(spec["operations"]) > 0

    @pytest.mark.parametrize("spec_file", ASYNCAPI_SPECS)
    def test_message_refs_resolve(self, spec_file):
        spec = load_spec(spec_file)
        messages = spec.get("components", {}).get("messages", {})
        for ch_name, channel in spec["channels"].items():
            for msg_name, msg in channel.get("messages", {}).items():
                if "$ref" in msg:
                    ref = msg["$ref"]
                    if ref.startswith("#/components/messages/"):
                        msg_key = ref.split("/")[-1]
                        assert msg_key in messages, (
                            f"{spec_file}: unresolved message ref {ref} in channel {ch_name}"
                        )

    @pytest.mark.parametrize("spec_file", ASYNCAPI_SPECS)
    def test_all_messages_have_payload(self, spec_file):
        spec = load_spec(spec_file)
        messages = spec.get("components", {}).get("messages", {})
        for name, msg in messages.items():
            assert "payload" in msg, f"{spec_file}: message {name} missing 'payload'"
            payload = msg["payload"]
            assert "type" in payload, f"{spec_file}: message {name} payload missing 'type'"
            assert "required" in payload, f"{spec_file}: message {name} payload missing 'required'"


class TestHealthcareEvents:
    """Stage 0: Healthcare event topics have correct structure."""

    def test_has_patient_synthetic_channel(self):
        spec = load_spec("healthcare-events.yaml")
        addresses = [ch["address"] for ch in spec["channels"].values()]
        assert "healthcare.patients.synthetic" in addresses

    def test_has_analysis_results_channel(self):
        spec = load_spec("healthcare-events.yaml")
        addresses = [ch["address"] for ch in spec["channels"].values()]
        assert "healthcare.analysis.results" in addresses

    def test_has_alerts_channel(self):
        spec = load_spec("healthcare-events.yaml")
        addresses = [ch["address"] for ch in spec["channels"].values()]
        assert "healthcare.alerts" in addresses

    def test_analysis_result_tracks_kv_cache(self):
        spec = load_spec("healthcare-events.yaml")
        msg = spec["components"]["messages"]["AnalysisResult"]
        props = msg["payload"]["properties"]
        assert "kv_cache_hit" in props

    def test_analysis_result_tracks_accelerator(self):
        spec = load_spec("healthcare-events.yaml")
        msg = spec["components"]["messages"]["AnalysisResult"]
        props = msg["payload"]["properties"]
        assert "accelerator" in props
        assert "cpu" in props["accelerator"]["enum"]


class TestFinServEvents:
    """Stage 0: FinServ event topics have correct structure."""

    def test_has_transaction_synthetic_channel(self):
        spec = load_spec("finserv-events.yaml")
        addresses = [ch["address"] for ch in spec["channels"].values()]
        assert "finserv.transactions.synthetic" in addresses

    def test_has_fraud_scores_channel(self):
        spec = load_spec("finserv-events.yaml")
        addresses = [ch["address"] for ch in spec["channels"].values()]
        assert "finserv.fraud.scores" in addresses

    def test_has_compliance_decisions_channel(self):
        spec = load_spec("finserv-events.yaml")
        addresses = [ch["address"] for ch in spec["channels"].values()]
        assert "finserv.compliance.decisions" in addresses

    def test_fraud_score_tracks_kv_cache(self):
        spec = load_spec("finserv-events.yaml")
        msg = spec["components"]["messages"]["FraudScore"]
        props = msg["payload"]["properties"]
        assert "kv_cache_hit" in props


class TestOrchestratorEvents:
    """Stage 0: Orchestrator event topics have correct structure."""

    def test_has_workflows_channel(self):
        spec = load_spec("orchestrator-events.yaml")
        addresses = [ch["address"] for ch in spec["channels"].values()]
        assert "orchestrator.workflows" in addresses

    def test_has_synthetic_trigger_channel(self):
        spec = load_spec("orchestrator-events.yaml")
        addresses = [ch["address"] for ch in spec["channels"].values()]
        assert "orchestrator.synthetic.trigger" in addresses

    def test_workflow_event_has_valid_types(self):
        spec = load_spec("orchestrator-events.yaml")
        msg = spec["components"]["messages"]["WorkflowEvent"]
        event_types = msg["payload"]["properties"]["event_type"]["enum"]
        assert "started" in event_types
        assert "completed" in event_types
        assert "failed" in event_types
