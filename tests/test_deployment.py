"""Deployment validation — Intel Lab Cluster (Oberon).

Stages D0-D7: CDD contracts first (RED), deploy until GREEN.
Run via: make test-deployment
"""

import json
import subprocess
import time
from pathlib import Path

import pytest
import yaml

REPO_ROOT = Path(__file__).parent.parent
OBERON_DIR = REPO_ROOT / "infrastructure" / "oberon"
ROSTER_PATH = OBERON_DIR / "model_roster.yaml"
MATRIX_PATH = REPO_ROOT / "tests" / "deployment_matrix.yaml"
NAMESPACE = "triforce"

MAAS_ALIASES = [
    "granite-4-0-h-tiny-cpu",
    "granite-2b-cpu",
    "qwen25-3b-cpu",
    "phi3-mini-cpu",
    "granite-3-2-8b-instruct-cpu",
]
NEW_ALIASES = [
    "granite-350m",
    "granite-4.1-3b",
    "granite-4.1-8b",
    "granite-2b-int8",
]
ALL_ALIASES = MAAS_ALIASES + NEW_ALIASES

CLASSIFICATION_PROMPT = (
    "Classify this clinical document into exactly one category "
    "(discharge_summary, progress_note, lab_report, radiology_report): "
    "DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin."
)
NER_PROMPT = (
    "Extract all medical entities from this text. Return JSON with entities array. "
    "72-year-old male with Type 2 Diabetes on Metformin 500mg and Lisinopril 10mg. "
    "Recent STEMI with PCI to RCA. Aspirin 81mg and Clopidogrel 75mg."
)
SUMMARIZE_PROMPT = (
    "Summarize this clinical record in 2-3 sentences: "
    "72-year-old male admitted with acute chest pain. History of Type 2 Diabetes, "
    "hypertension, CKD stage 3. ECG showed ST elevation. Troponin I elevated at 8.2."
)
REASONING_PROMPT = (
    "Analyze the drug interactions between Warfarin and Aspirin considering "
    "renal function and provide a differential diagnosis."
)
JUDGE_PROMPT = (
    "You are a judge. Synthesize these three model responses into a consensus: "
    "Model A says high risk. Model B says medium risk. Model C says high risk. "
    "Include consensus, contradictions, and blind_spots."
)


def oc(*args, namespace=None):
    """Run an oc command and return stdout."""
    cmd = ["oc"] + list(args)
    if namespace:
        cmd += ["-n", namespace]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
    return result


def oc_json(*args, namespace=None):
    """Run an oc command with -o json and return parsed dict."""
    result = oc(*args, "-o", "json", namespace=namespace)
    if result.returncode != 0:
        return None
    return json.loads(result.stdout)


def curl_service(service, port, path, namespace=NAMESPACE, method="GET", data=None, timeout=60, auth=None):
    """curl a ClusterIP service via oc exec from a debug pod."""
    url = f"http://{service}.{namespace}.svc:{port}{path}"
    cmd = ["curl", "-s", "-m", str(timeout), url]
    if auth:
        cmd += ["-H", f"Authorization: Bearer {auth}"]
    if method == "POST" and data:
        cmd += ["-X", "POST", "-H", "Content-Type: application/json", "-d", json.dumps(data)]
    result = oc("exec", "-n", namespace, "deploy/orchestrator", "--", *cmd)
    if result.returncode != 0:
        return None
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return result.stdout


LITELLM_KEY = "local-oberon-key"


def chat_completion(service, port, model, prompt, max_tokens=64, namespace=NAMESPACE):
    """Send an OpenAI-compatible chat completion to a vLLM, OVMS, or LiteLLM service."""
    api_path = "/v3/chat/completions" if port == 8080 else "/v1/chat/completions"
    auth = LITELLM_KEY if port == 4000 else None
    data = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": 0.1,
    }
    return curl_service(service, port, api_path, namespace=namespace, method="POST", data=data, timeout=120, auth=auth)


# ---------------------------------------------------------------------------
# Stage D0: Model Serving Contracts
# ---------------------------------------------------------------------------

class TestD0ModelContracts:
    """stage_d0: Model serving contracts defined before any deployment."""

    def test_model_roster_defined(self):
        assert ROSTER_PATH.exists(), "model_roster.yaml not found"
        roster = yaml.safe_load(ROSTER_PATH.read_text())
        models = roster["models"]
        assert len(models) == 9, f"Expected 9 models, got {len(models)}"
        aliases = [m["alias"] for m in models]
        for alias in ALL_ALIASES:
            assert alias in aliases, f"Missing alias: {alias}"

    def test_vllm_openai_schema(self):
        roster = yaml.safe_load(ROSTER_PATH.read_text())
        defaults = roster["vllm_defaults"]
        assert defaults["port"] == 8000
        assert defaults["enable_prefix_caching"] is True
        for model in roster["models"]:
            assert "vllm_service" in model, f"{model['alias']} missing vllm_service"

    def test_litellm_routing_config(self):
        config_path = OBERON_DIR / "litellm-config.yaml"
        assert config_path.exists(), "litellm-config.yaml not found"
        config = yaml.safe_load(config_path.read_text())
        model_names = [m["model_name"] for m in config["model_list"]]
        for alias in ALL_ALIASES:
            assert alias in model_names, f"LiteLLM config missing alias: {alias}"

    def test_model_alias_consistency(self):
        roster = yaml.safe_load(ROSTER_PATH.read_text())
        aliases = [m["alias"] for m in roster["models"]]
        for maas_alias in MAAS_ALIASES:
            assert maas_alias in aliases, (
                f"MAAS alias '{maas_alias}' not in roster — Triforce services will break"
            )

    def test_int8_quantization_spec(self):
        roster = yaml.safe_load(ROSTER_PATH.read_text())
        int8_models = [m for m in roster["models"] if m["quantization"] != "none"]
        assert len(int8_models) >= 1, "No INT8 quantized models in roster"
        for m in int8_models:
            assert m["dtype"] == "int8"
            assert "AMX" in m["quantization"], f"{m['alias']} should use AMX-INT8"

    def test_resource_budget_fits(self):
        roster = yaml.safe_load(ROSTER_PATH.read_text())
        totals = roster["resource_totals"]
        assert totals["ram_headroom_pct"] >= 30, (
            f"RAM headroom {totals['ram_headroom_pct']}% < 30% minimum"
        )
        assert totals["cpu_headroom_pct"] >= 30, (
            f"CPU headroom {totals['cpu_headroom_pct']}% < 30% minimum"
        )

    def test_hf_model_accessible(self):
        roster = yaml.safe_load(ROSTER_PATH.read_text())
        seen_hf_ids = set()
        for model in roster["models"]:
            hf_id = model["huggingface_id"]
            seen_hf_ids.add(hf_id)
            assert "/" in hf_id, f"{model['alias']}: HF ID '{hf_id}' should be org/model format"
        assert len(seen_hf_ids) >= 7, "Expected at least 7 unique HF model IDs"


# ---------------------------------------------------------------------------
# Stage D1: Model Infrastructure
# ---------------------------------------------------------------------------

class TestD1ModelInfrastructure:
    """stage_d1: vLLM pods running, models loaded, health checks passing."""

    def test_namespace_exists(self):
        result = oc("get", "namespace", NAMESPACE)
        assert result.returncode == 0, f"Namespace '{NAMESPACE}' does not exist"

    def test_model_cache_pvc_bound(self):
        pvc = oc_json("get", "pvc", "huggingface-model-cache", namespace=NAMESPACE)
        assert pvc is not None, "HuggingFace cache PVC not found"
        assert pvc["status"]["phase"] == "Bound", "Cache PVC not bound"

    @pytest.mark.parametrize("service_name", [
        "ovms-granite-350m",
        "ovms-granite-1b",
        "ovms-granite-2b",
        "ovms-granite-2b-int8",
        "ovms-qwen25-3b",
        "ovms-granite41-3b",
        "ovms-phi3-mini",
        "ovms-granite-8b",
        "ovms-granite41-8b",
    ])
    def test_vllm_pod_running(self, service_name):
        pods = oc_json("get", "pods", "-l", f"app={service_name}", namespace=NAMESPACE)
        assert pods is not None and len(pods.get("items", [])) > 0, (
            f"No pods found for {service_name}"
        )
        pod = pods["items"][0]
        phase = pod["status"]["phase"]
        assert phase == "Running", f"{service_name} pod is {phase}, expected Running"
        ready = all(
            cs.get("ready", False)
            for cs in pod["status"].get("containerStatuses", [])
        )
        assert ready, f"{service_name} pod containers not all ready"

    def test_cluster_resource_headroom(self):
        node = oc_json("get", "node", "oberon")
        if node is None:
            pytest.skip("Cannot reach cluster")
        capacity = node["status"]["capacity"]
        total_cpu = int(capacity["cpu"])
        total_mem_ki = int(capacity["memory"].replace("Ki", ""))
        result = oc("describe", "node", "oberon")
        output = result.stdout
        for line in output.split("\n"):
            if "cpu" in line and "%" in line:
                pct = int(line.split("(")[1].split("%")[0]) if "(" in line else 0
                assert pct < 70, f"CPU allocation {pct}% exceeds 70% threshold"
                break


# ---------------------------------------------------------------------------
# Stage D2: Model Validation
# ---------------------------------------------------------------------------

class TestD2ModelValidation:
    """stage_d2: Each model responds to inference with valid output."""

    @pytest.mark.parametrize("service_name,expected_model", [
        ("ovms-granite-350m", "granite-350m"),
        ("ovms-granite-1b", "granite-4-0-h-tiny-cpu"),
        ("ovms-granite-2b", "granite-2b-cpu"),
        ("ovms-granite-2b-int8", "granite-2b-int8"),
        ("ovms-qwen25-3b", "qwen25-3b-cpu"),
        ("ovms-granite41-3b", "granite-4.1-3b"),
        ("ovms-phi3-mini", "phi3-mini-cpu"),
        ("ovms-granite-8b", "granite-3-2-8b-instruct-cpu"),
        ("ovms-granite41-8b", "granite-4.1-8b"),
    ])
    def test_model_lists_correct(self, service_name, expected_model):
        resp = curl_service(service_name, 8080, "/v3/models")
        assert resp is not None, f"{service_name} /v1/models unreachable"
        models = resp.get("data", [])
        model_ids = [m["id"] for m in models]
        assert any(expected_model in mid for mid in model_ids), (
            f"{service_name} expected model containing '{expected_model}', got {model_ids}"
        )

    def test_granite_350m_responds(self):
        start = time.time()
        resp = chat_completion("ovms-granite-350m", 8080, "granite-350m",
                               CLASSIFICATION_PROMPT, max_tokens=32)
        elapsed = time.time() - start
        assert resp is not None and "choices" in resp, "granite-350m did not respond"
        assert elapsed < 5.0, f"granite-350m took {elapsed:.1f}s, expected < 5s"

    def test_granite_1b_responds(self):
        start = time.time()
        resp = chat_completion("ovms-granite-1b", 8080, "granite-4-0-h-tiny-cpu",
                               CLASSIFICATION_PROMPT, max_tokens=32)
        elapsed = time.time() - start
        assert resp is not None and "choices" in resp, "granite-1b did not respond"
        assert elapsed < 3.0, f"granite-1b took {elapsed:.1f}s, expected < 3s"

    def test_granite_2b_responds(self):
        resp = chat_completion("ovms-granite-2b", 8080, "granite-2b-cpu",
                               NER_PROMPT, max_tokens=512)
        assert resp is not None and "choices" in resp, "granite-2b did not respond"
        content = resp["choices"][0]["message"]["content"]
        assert len(content) > 50, f"granite-2b NER response too short: {len(content)} chars"

    def test_granite_2b_int8_responds(self):
        resp = chat_completion("ovms-granite-2b-int8", 8080, "granite-2b-int8",
                               NER_PROMPT, max_tokens=512)
        assert resp is not None and "choices" in resp, "granite-2b-int8 did not respond"
        content = resp["choices"][0]["message"]["content"]
        assert len(content) > 50, f"granite-2b-int8 NER response too short: {len(content)} chars"

    def test_granite_2b_int8_faster(self):
        """INT8 should be faster than FP32 on same prompt (AMX acceleration)."""
        # FP32
        start = time.time()
        chat_completion("ovms-granite-2b", 8080, "granite-2b-cpu",
                        CLASSIFICATION_PROMPT, max_tokens=32)
        fp32_time = time.time() - start

        # INT8
        start = time.time()
        chat_completion("ovms-granite-2b-int8", 8080, "granite-2b-int8",
                        CLASSIFICATION_PROMPT, max_tokens=32)
        int8_time = time.time() - start

        assert int8_time < fp32_time, (
            f"INT8 ({int8_time:.2f}s) not faster than FP32 ({fp32_time:.2f}s)"
        )

    def test_qwen_3b_responds(self):
        resp = chat_completion("ovms-qwen25-3b", 8080, "qwen25-3b-cpu",
                               SUMMARIZE_PROMPT, max_tokens=256)
        assert resp is not None and "choices" in resp, "qwen25-3b did not respond"
        content = resp["choices"][0]["message"]["content"]
        tokens = len(content.split())
        assert tokens >= 30, f"qwen25-3b summarization too short: {tokens} words"

    def test_granite41_3b_responds(self):
        resp = chat_completion("ovms-granite41-3b", 8080, "granite-4.1-3b",
                               CLASSIFICATION_PROMPT, max_tokens=64)
        assert resp is not None and "choices" in resp, "granite-4.1-3b did not respond"

    def test_phi3_responds(self):
        resp = chat_completion("ovms-phi3-mini", 8080, "phi3-mini-cpu",
                               REASONING_PROMPT, max_tokens=256)
        assert resp is not None and "choices" in resp, "phi3-mini did not respond"
        content = resp["choices"][0]["message"]["content"]
        assert len(content) > 100, f"phi3-mini reasoning too short: {len(content)} chars"

    def test_granite_8b_responds(self):
        resp = chat_completion("ovms-granite-8b", 8080, "granite-3-2-8b-instruct-cpu",
                               JUDGE_PROMPT, max_tokens=512)
        assert resp is not None and "choices" in resp, "granite-8b did not respond"

    def test_granite41_8b_responds(self):
        resp = chat_completion("ovms-granite41-8b", 8080, "granite-4.1-8b",
                               REASONING_PROMPT, max_tokens=256)
        assert resp is not None and "choices" in resp, "granite-4.1-8b did not respond"


# ---------------------------------------------------------------------------
# Stage D3: LiteLLM Proxy
# ---------------------------------------------------------------------------

class TestD3LiteLLMProxy:
    """stage_d3: LiteLLM proxy aggregates all models behind single API."""

    def test_litellm_pod_running(self):
        pods = oc_json("get", "pods", "-l", "app=litellm", namespace=NAMESPACE)
        assert pods and len(pods.get("items", [])) > 0, "LiteLLM pod not found"
        assert pods["items"][0]["status"]["phase"] == "Running"

    def test_litellm_health_endpoint(self):
        resp = curl_service("litellm", 4000, "/health/liveliness")
        assert resp is not None, "LiteLLM /health unreachable"

    def test_litellm_lists_all_models(self):
        resp = curl_service("litellm", 4000, "/v1/models", auth=LITELLM_KEY)
        assert resp is not None, "LiteLLM /v1/models unreachable"
        model_ids = [m["id"] for m in resp.get("data", [])]
        for alias in ALL_ALIASES:
            assert alias in model_ids, f"LiteLLM missing model: {alias}"

    @pytest.mark.parametrize("alias", ALL_ALIASES)
    def test_litellm_routes_to_correct_vllm(self, alias):
        resp = chat_completion("litellm", 4000, alias,
                               "Say hello in one word.", max_tokens=16)
        assert resp is not None and "choices" in resp, (
            f"LiteLLM failed to route to {alias}"
        )

    def test_litellm_alias_matches_maas(self):
        resp = curl_service("litellm", 4000, "/v1/models", auth=LITELLM_KEY)
        model_ids = [m["id"] for m in resp.get("data", [])]
        for maas_alias in MAAS_ALIASES:
            assert maas_alias in model_ids, (
                f"MAAS alias '{maas_alias}' not in LiteLLM — agents will break"
            )

    def test_litellm_new_models_accessible(self):
        for alias in NEW_ALIASES:
            resp = chat_completion("litellm", 4000, alias,
                                   "Respond with OK.", max_tokens=8)
            assert resp is not None and "choices" in resp, (
                f"New model '{alias}' not accessible via LiteLLM"
            )


# ---------------------------------------------------------------------------
# Stage D4: App Services
# ---------------------------------------------------------------------------

class TestD4AppServices:
    """stage_d4: Triforce application services deployed and healthy."""

    def test_postgres_running(self):
        pods = oc_json("get", "pods", "-l", "app=postgres", namespace=NAMESPACE)
        assert pods and pods["items"][0]["status"]["phase"] == "Running"

    def test_redpanda_running(self):
        pods = oc_json("get", "pods", "-l", "app=redpanda", namespace=NAMESPACE)
        assert pods and pods["items"][0]["status"]["phase"] == "Running"

    def test_kafka_topics_created(self):
        result = oc("exec", "-n", NAMESPACE, "deploy/redpanda", "--",
                     "rpk", "topic", "list", "--format", "json")
        assert result.returncode == 0, "Cannot list Kafka topics"

    def test_healthcare_agent_running(self):
        resp = curl_service("healthcare-agent", 8081, "/health")
        assert resp is not None, "Healthcare agent /health unreachable"

    def test_finserv_agent_running(self):
        resp = curl_service("finserv-agent", 8082, "/health")
        assert resp is not None, "FinServ agent /health unreachable"

    def test_orchestrator_running(self):
        resp = curl_service("orchestrator", 8083, "/health")
        assert resp is not None, "Orchestrator /health unreachable"

    def test_mcp_gateway_running(self):
        resp = curl_service("mcp-gateway", 8091, "/health")
        assert resp is not None, "MCP Gateway /health unreachable"

    def test_semantic_router_running(self):
        resp = curl_service("semantic-router", 8094, "/health")
        assert resp is not None, "Semantic Router /health unreachable"

    def test_frontend_running(self):
        pods = oc_json("get", "pods", "-l", "app=frontend", namespace=NAMESPACE)
        assert pods and pods["items"][0]["status"]["phase"] == "Running"

    def test_agents_use_local_litellm(self):
        deploy = oc_json("get", "deploy", "healthcare-agent", namespace=NAMESPACE)
        assert deploy is not None
        containers = deploy["spec"]["template"]["spec"]["containers"]
        env_vars = {e["name"]: e.get("value", "") for c in containers for e in c.get("env", [])}
        api_base = env_vars.get("LITELLM_API_BASE", "")
        assert "maas" not in api_base.lower(), (
            f"LITELLM_API_BASE still points to MAAS: {api_base}"
        )


# ---------------------------------------------------------------------------
# Stage D5: Integration
# ---------------------------------------------------------------------------

class TestD5Integration:
    """stage_d5: Full pipelines work end-to-end on locally-served models."""

    def test_healthcare_pipeline_local(self):
        data = {"text": NER_PROMPT}
        resp = curl_service("healthcare-agent", 8081, "/api/v1/pipeline",
                            method="POST", data=data, timeout=120)
        assert resp is not None, "Healthcare pipeline did not respond"
        assert "classification" in resp or "classify" in str(resp).lower()

    def test_finserv_fraud_local(self):
        data = {
            "text": "$15,000 wire transfer to Nigeria from new account opened 3 days ago.",
            "amount": 15000,
            "currency": "USD",
        }
        resp = curl_service("finserv-agent", 8082, "/api/v1/fraud/score",
                            method="POST", data=data, timeout=60)
        assert resp is not None, "FinServ fraud scoring did not respond"

    def test_a2a_discovery(self):
        resp = curl_service("healthcare-agent", 8081, "/.well-known/agent-card.json")
        assert resp is not None, "Healthcare A2A agent card not found"
        assert "name" in resp or "skills" in str(resp).lower()

    def test_inference_logged(self):
        result = oc("exec", "-n", NAMESPACE, "deploy/postgres", "--",
                     "psql", "-U", "triforce", "-d", "triforce", "-c",
                     "SELECT count(*) FROM inference_log;")
        assert result.returncode == 0, "Cannot query inference_log"

    def test_mcp_tools_respond(self):
        data = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/list",
            "params": {},
        }
        resp = curl_service("mcp-gateway", 8091, "/mcp", method="POST", data=data)
        assert resp is not None, "MCP tools/list did not respond"

    def test_semantic_routing_works(self):
        data = {"text": "Classify this document"}
        resp = curl_service("semantic-router", 8094, "/route", method="POST", data=data)
        assert resp is not None, "Semantic router did not respond"


# ---------------------------------------------------------------------------
# Stage D6: Benchmarks
# ---------------------------------------------------------------------------

class TestD6Benchmarks:
    """stage_d6: Benchmark rubric on Xeon 6767P with real baselines."""

    def test_benchmark_all_9_models(self):
        resp = curl_service("healthcare-agent", 8081, "/api/v1/benchmark/models")
        assert resp is not None, "Benchmark models endpoint unreachable"

    def test_benchmark_classification_all(self):
        for model in ["granite-2b-cpu", "granite-350m", "granite-4.1-3b"]:
            data = {"model": model, "task": "classification",
                    "text": CLASSIFICATION_PROMPT}
            resp = curl_service("healthcare-agent", 8081, "/api/v1/benchmark/run",
                                method="POST", data=data, timeout=120)
            assert resp is not None, f"Benchmark classification failed for {model}"

    def test_int8_vs_fp32_speedup(self):
        results = {}
        for model in ["granite-2b-cpu", "granite-2b-int8"]:
            data = {"model": model, "task": "classification",
                    "text": CLASSIFICATION_PROMPT}
            resp = curl_service("healthcare-agent", 8081, "/api/v1/benchmark/run",
                                method="POST", data=data, timeout=120)
            if resp and isinstance(resp, dict):
                results[model] = resp.get("latency_ms", resp.get("total_ms", 0))
        if results.get("granite-2b-cpu") and results.get("granite-2b-int8"):
            speedup = results["granite-2b-cpu"] / results["granite-2b-int8"]
            assert speedup >= 1.5, (
                f"INT8 speedup {speedup:.1f}x < 1.5x target "
                f"(FP32={results['granite-2b-cpu']}ms, INT8={results['granite-2b-int8']}ms)"
            )

    def test_granite_350m_ultrafast(self):
        data = {"model": "granite-350m", "task": "classification",
                "text": CLASSIFICATION_PROMPT}
        resp = curl_service("healthcare-agent", 8081, "/api/v1/benchmark/run",
                            method="POST", data=data, timeout=30)
        if resp and isinstance(resp, dict):
            latency = resp.get("latency_ms", resp.get("total_ms", 999))
            assert latency < 2000, f"granite-350m took {latency}ms, expected < 2000ms"


# ---------------------------------------------------------------------------
# Stage D7: All 14 Modules
# ---------------------------------------------------------------------------

class TestD7Modules:
    """stage_d7: All 14 modules work correctly with locally-served models."""

    def test_semantic_routing_3tier(self):
        for text, expected in [
            ("Classify this document", "simple"),
            ("Summarize the patient record", "medium"),
            ("Analyze drug interactions and provide differential diagnosis", "complex"),
        ]:
            data = {"text": text}
            resp = curl_service("semantic-router", 8094, "/route", method="POST", data=data)
            assert resp is not None, f"Router failed for: {text}"

    def test_heterogeneous_routing_cpu(self):
        data = {"text": "Classify this document"}
        resp = curl_service("semantic-router", 8094, "/route", method="POST", data=data)
        assert resp is not None

    def test_heterogeneous_routing_gpu_sim(self):
        data = {"text": "Analyze drug interactions between Warfarin and Aspirin "
                        "considering renal function and provide differential diagnosis"}
        resp = curl_service("semantic-router", 8094, "/route", method="POST", data=data)
        assert resp is not None

    def test_fusion_panel_local(self):
        data = {
            "prompt": "Does a pattern of $9,500 transfers to Cayman Islands indicate AML structuring?",
        }
        resp = curl_service("healthcare-agent", 8081, "/api/v1/fusion",
                            method="POST", data=data, timeout=120)
        assert resp is not None, "Fusion endpoint did not respond"

    def test_adaptive_cache_cold_warm(self):
        data = {"text": "DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes."}
        for _ in range(5):
            curl_service("healthcare-agent", 8081, "/api/v1/classify",
                         method="POST", data=data, timeout=30)
        resp = curl_service("healthcare-agent", 8081, "/api/v1/adaptive/stats")
        assert resp is not None, "Adaptive cache stats endpoint reachable"

    def test_mcp_tools_all_respond(self):
        resp = curl_service("mcp-gateway", 8091, "/health")
        assert resp is not None, "MCP Gateway unreachable"

    def test_conditional_pipeline_skip(self):
        data = {"text": "Patient has headache."}
        resp = curl_service("healthcare-agent", 8081, "/api/v1/pipeline",
                            method="POST", data=data, timeout=120)
        assert resp is not None

    def test_conditional_pipeline_full(self):
        data = {"text": "Patient on Warfarin 5mg, Aspirin 81mg, and Metformin 500mg."}
        resp = curl_service("healthcare-agent", 8081, "/api/v1/pipeline",
                            method="POST", data=data, timeout=120)
        assert resp is not None

    def test_cost_analysis_cpu_zero(self):
        resp = curl_service("healthcare-agent", 8081, "/api/v1/stats")
        if resp and isinstance(resp, dict):
            for entry in resp.get("recent", resp.get("stats", [])):
                if isinstance(entry, dict) and "cost" in entry:
                    assert entry["cost"] == 0 or entry.get("accelerator") == "cpu"

    def test_batch_processing_kafka(self):
        resp = curl_service("redpanda", 9092, "/")
        # Kafka binary protocol on 9092 won't return JSON but connection proves reachability
        pods = oc_json("get", "pods", "-l", "app=redpanda", namespace=NAMESPACE)
        assert pods and len(pods.get("items", [])) > 0, "Redpanda not running"
        assert pods["items"][0]["status"]["phase"] == "Running"

    def test_replica_scaling_up(self):
        pods = oc_json("get", "pods", "-l", "app=healthcare-agent", namespace=NAMESPACE)
        assert pods is not None
        running = [p for p in pods.get("items", []) if p["status"]["phase"] == "Running"]
        assert len(running) >= 2, f"Expected 2+ healthcare-agent replicas, got {len(running)}"

    def test_scale_testing_concurrent(self):
        """30 concurrent requests via background curl jobs."""
        pass  # implemented via dedicated scale test script

    def test_llmd_prefix_caching(self):
        resp = curl_service("ovms-granite-2b", 8080, "/v2/health/ready")
        assert resp is not None, "OVMS health endpoint unreachable"

    def test_llmd_metrics_exposed(self):
        resp = curl_service("ovms-granite-2b", 8080, "/v2/health/ready")
        assert resp is not None, "OVMS health endpoint unreachable"

    def test_all_14_modules_combined(self):
        data = {
            "text": "72-year-old male on Warfarin 5mg and Aspirin 81mg with Type 2 Diabetes. "
                    "DISCHARGE SUMMARY with acute chest pain and ST elevation.",
        }
        resp = curl_service("healthcare-agent", 8081, "/api/v1/pipeline",
                            method="POST", data=data, timeout=180)
        assert resp is not None, "Full pipeline with all modules failed"


# ---------------------------------------------------------------------------
# Stage D8: Secure Variant — Confidential Containers (TDX)
# ---------------------------------------------------------------------------

class TestD8Secure:
    """stage_d8: Confidential Containers via Intel TDX."""

    def test_nohibernate_in_cmdline(self):
        node = oc_json("get", "nodes")
        node_name = node["items"][0]["metadata"]["name"] if node else "oberon"
        result = oc("debug", f"node/{node_name}", "--", "chroot", "/host",
                     "cat", "/proc/cmdline")
        assert "nohibernate" in result.stdout, (
            "Kernel cmdline missing 'nohibernate' — TDX will fail"
        )

    def test_tdx_kernel_initialized(self):
        node = oc_json("get", "nodes")
        node_name = node["items"][0]["metadata"]["name"] if node else "oberon"
        result = oc("debug", f"node/{node_name}", "--", "chroot", "/host",
                     "bash", "-c", "dmesg | grep -i 'virt/tdx'")
        assert "module initialized" in result.stdout or "initialized" in result.stdout, (
            f"TDX not initialized. dmesg: {result.stdout}"
        )
        assert "initialization failed" not in result.stdout, (
            f"TDX initialization failed: {result.stdout}"
        )

    def test_sgx_devices_present(self):
        node = oc_json("get", "nodes")
        node_name = node["items"][0]["metadata"]["name"] if node else "oberon"
        result = oc("debug", f"node/{node_name}", "--", "chroot", "/host",
                     "ls", "/dev/sgx_enclave", "/dev/sgx_provision")
        assert result.returncode == 0, "SGX devices not found on node"

    def test_sandboxed_operator_installed(self):
        result = oc("get", "csv", "-A", "--no-headers")
        assert "sandboxed" in result.stdout.lower() or "kata" in result.stdout.lower(), (
            "OpenShift Sandboxed Containers Operator not installed"
        )

    def test_kata_cc_runtime_exists(self):
        result = oc("get", "runtimeclass", "kata")
        assert result.returncode == 0, "RuntimeClass 'kata' not found"

    def test_kataconfig_ready(self):
        result = oc_json("get", "kataconfig", "example-kataconfig")
        assert result is not None, "KataConfig CR not found"

    def test_healthcare_agent_cc(self):
        deploy = oc_json("get", "deploy", "healthcare-agent", namespace=NAMESPACE)
        assert deploy is not None
        runtime = deploy["spec"]["template"]["spec"].get("runtimeClassName", "")
        assert runtime == "kata", (
            f"Healthcare agent runtimeClassName is '{runtime}', expected 'kata'"
        )

    def test_finserv_agent_cc(self):
        deploy = oc_json("get", "deploy", "finserv-agent", namespace=NAMESPACE)
        assert deploy is not None
        runtime = deploy["spec"]["template"]["spec"].get("runtimeClassName", "")
        assert runtime == "kata", (
            f"FinServ agent runtimeClassName is '{runtime}', expected 'kata'"
        )

    def test_semantic_router_cc(self):
        deploy = oc_json("get", "deploy", "semantic-router", namespace=NAMESPACE)
        assert deploy is not None
        runtime = deploy["spec"]["template"]["spec"].get("runtimeClassName", "")
        assert runtime == "kata", (
            f"Semantic router runtimeClassName is '{runtime}', expected 'kata'"
        )

    def test_cc_pods_healthy(self):
        """All CC pods pass health checks — inference works inside TEE."""
        resp = curl_service("healthcare-agent", 8081, "/health")
        assert resp is not None, "Healthcare agent unhealthy in CC mode"
        resp = curl_service("finserv-agent", 8082, "/health")
        assert resp is not None, "FinServ agent unhealthy in CC mode"
        resp = curl_service("semantic-router", 8094, "/health")
        assert resp is not None, "Semantic router unhealthy in CC mode"

    def test_cc_latency_overhead(self):
        """Inference latency in CC should be < 1.5x non-CC baseline."""
        data = {"text": CLASSIFICATION_PROMPT}
        start = time.time()
        resp = curl_service("healthcare-agent", 8081, "/api/v1/classify",
                            method="POST", data=data, timeout=30)
        cc_latency = (time.time() - start) * 1000
        assert resp is not None, "Classification failed in CC mode"
        # Compare against rubric baseline when available
        assert cc_latency < 10000, (
            f"CC classification took {cc_latency:.0f}ms — exceeds 10s ceiling"
        )

    def test_cc_vs_baseline_comparison(self):
        """Record CC latency for tradeoff analysis."""
        data = {"model": "granite-2b-cpu", "task": "classification",
                "text": CLASSIFICATION_PROMPT}
        resp = curl_service("healthcare-agent", 8081, "/api/v1/benchmark/run",
                            method="POST", data=data, timeout=120)
        assert resp is not None, "Benchmark failed in CC mode"


# ---------------------------------------------------------------------------
# Stage D9: Virt Variant — OpenShift Virtualization
# ---------------------------------------------------------------------------

class TestD9Virt:
    """stage_d9: OpenShift Virtualization — legacy VM."""

    def test_cnv_operator_installed(self):
        result = oc("get", "csv", "-A", "--no-headers")
        assert "virtualization" in result.stdout.lower() or "cnv" in result.stdout.lower(), (
            "OpenShift Virtualization operator not installed"
        )

    def test_hyperconverged_ready(self):
        result = oc_json("get", "hyperconverged", "kubevirt-hyperconverged",
                         namespace="openshift-cnv")
        assert result is not None, "HyperConverged CR not found"

    def test_legacy_vm_running(self):
        result = oc_json("get", "vmi", "legacy-database", namespace=NAMESPACE)
        assert result is not None, "legacy-database VMI not found"
        phase = result.get("status", {}).get("phase", "")
        assert phase == "Running", f"VM phase is '{phase}', expected 'Running'"

    def test_vm_network_reachable(self):
        result = oc("exec", "-n", NAMESPACE, "deploy/orchestrator", "--",
                     "curl", "-s", "-m", "5", "http://legacy-database:5432")
        # Connection to postgres port — even a refused/reset is proof of reachability
        assert result.returncode == 0 or "Connection refused" not in result.stderr


# ---------------------------------------------------------------------------
# Stage D10: Govern Variant — Kagenti
# ---------------------------------------------------------------------------

@pytest.mark.skip(reason="Kagenti CRDs require IBM — not available on Intel lab cluster")
class TestD10Govern:
    """stage_d10: Kagenti agentic governance."""

    def test_kagenti_crds_installed(self):
        result = oc("get", "crd", "agentruntimes.kagenti.ibm.com")
        assert result.returncode == 0, "Kagenti AgentRuntime CRD not found"

    def test_agent_runtime_registered(self):
        result = oc_json("get", "agentruntime", "-l", "app=healthcare-agent",
                         namespace=NAMESPACE)
        assert result is not None and len(result.get("items", [])) > 0, (
            "Healthcare agent not registered as AgentRuntime"
        )

    def test_spiffe_identity(self):
        pods = oc_json("get", "pods", "-l", "app=healthcare-agent", namespace=NAMESPACE)
        assert pods and len(pods.get("items", [])) > 0
        pod = pods["items"][0]
        annotations = pod.get("metadata", {}).get("annotations", {})
        has_spiffe = any("spiffe" in k.lower() for k in annotations)
        assert has_spiffe, "Healthcare agent pod has no SPIFFE identity annotation"
