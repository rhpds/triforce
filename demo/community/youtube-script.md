# Triforce Deep Dive — YouTube Walkthrough Script

**Duration:** 20-25 minutes
**Format:** Screen recording (terminal + dashboard + code editor)
**Audience:** Technical community — developers, architects, AI engineers

---

## Intro (0:00–2:00)

**Screen:** Code editor showing architecture diagram from CLAUDE.md
**VO:** "In this video, I'll walk you through Triforce — a multi-agent AI platform that runs clinical NLP and fraud scoring entirely on Intel Xeon 6 CPU. No GPU. Three languages. Two industry verticals. Real inference."

Show: git log, file tree, test counts.

## Chapter 1: Architecture (2:00–5:00)

Walk through:
- `contracts/` — OpenAPI, AsyncAPI, MCP schemas (CDD methodology)
- `services/healthcare-agent/graph.py` — LangGraph StateGraph
- `services/finserv-agent/` — Quarkus + LangGraph hybrid
- `services/orchestrator/` — Go A2A client + workflow engine

## Chapter 2: Running the Stack (5:00–8:00)

```bash
make up
podman ps
curl localhost:8081/health
curl localhost:8082/health
curl localhost:8083/health
```

Show all 5 containers healthy.

## Chapter 3: The Clinical NLP Pipeline (8:00–13:00)

Run Act 2 of the terminal demo:
```bash
python3 demo/engineer/triforce_demo.py --act 2
```

Then show the code: `graph.py` nodes, MCP tool wrappers, conditional routing.

## Chapter 4: The Inference Race (13:00–17:00)

Run the race at increasing scales:
```bash
python3 demo/engineer/inference_race.py --scale 10
python3 demo/engineer/inference_race.py --scale 100
```

Then open the executive dashboard and run it visually.

## Chapter 5: Cross-Agent Workflows (17:00–20:00)

Run Act 4:
```bash
python3 demo/engineer/triforce_demo.py --act 4
```

Show the orchestrator logs, the A2A calls, the workflow completion.

## Chapter 6: Deploying to OpenShift (20:00–23:00)

Show the Helm chart and CI/CD pipeline.
```bash
helm template triforce infrastructure/helm/ --set ...
```

## Closing (23:00–25:00)

Key numbers, where to find the code, how to contribute.
