# Architecture Questions — Response to Amber (Intel)

## Questions

1. Is this demo not on top of Red Hat OpenShift AI? I am not seeing KServe-based deployments.
2. Most of the model deployments are with OV (OpenVINO)?
3. llm-d is also not done via KServe route?

## Answer

No, this is not on OpenShift AI / KServe. Intentionally.

### How It Runs on RHDP

The student namespace has **zero model-serving infrastructure**. No model servers, no GPUs, no InferenceService CRDs, no OVMS pods. All inference is a remote API call to the shared RHDP MAAS platform (LiteLLM proxy → Intel Xeon 6 / Gaudi).

The student's namespace has only the application layer — 9 pods total:

| Pod | Role |
|-----|------|
| Healthcare Agent (×2) | Clinical NLP pipeline (Python/LangGraph) |
| FinServ Agent | Fraud scoring (Java/Quarkus) |
| Orchestrator | A2A agent discovery (Go) |
| Semantic Router | Embedding-based complexity routing (<1ms after warm-up) |
| MCP Gateway | 8 federated tools via JSON-RPC |
| Frontend | React demo UI |
| PostgreSQL | Inference audit trail |
| Redpanda | Event streaming (Kafka-compatible) |

The model serving backend on MAAS is managed by the RAC team — what's behind that endpoint is transparent to the lab. KServe, vLLM, OVMS — it doesn't matter from the student's perspective. They see a `/v1/chat/completions` endpoint and measure latency. The lab teaches inference optimization at the application layer, not the serving layer.

This keeps provisioning fast (~8 minutes), namespace footprint tiny (~1.5 CPU cores requested), and avoids requiring RHOAI operator, Knative, or Istio on the shared cluster.

### On llm-d

llm-d is not deployed in this lab. It is a roadmap module. The lab focuses on what's measurable today — CPU vs GPU routing, model right-sizing, optimization techniques (caching, speculative decoding, conditional pipeline, MCP tool offloading, multi-model fusion).

llm-d (disaggregated prefill/decode) would be a future module once it's ready to demo on RHDP infrastructure. The application layer wouldn't change — llm-d would sit behind the same LiteLLM proxy endpoint.

### What Would Change to Add RHOAI/KServe

The application layer stays the same. If we moved model serving into the student's namespace with RHOAI, the changes would be:

- Add RHOAI operator to the cluster
- Deploy models as InferenceService CRDs instead of relying on remote MAAS
- LiteLLM would route to KServe endpoints instead of the MAAS URL
- Namespace footprint would increase significantly (GPU/CPU resources for model serving)

This could be a future variant — same lab, same agents, different serving layer underneath. The optimization techniques the students learn (routing, caching, fusion, speculative decoding) work regardless of whether the model is served by OVMS, vLLM, or KServe.

### The Deliberate Choice

This lab's story is **"CPU inference is fast enough at $0."** The optimization techniques work regardless of serving backend. KServe vs OVMS vs vLLM is an infrastructure decision. We kept the serving layer out of the student's namespace so the lab stays focused on what Intel cares about: proving that Xeon 6 CPUs handle routine inference — classification, NER, fraud scoring, summarization — at zero incremental cost, with intelligent routing to Gaudi GPUs for the tasks that genuinely need it.
