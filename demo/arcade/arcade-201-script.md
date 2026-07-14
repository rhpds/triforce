# Arcade 201 Recording Script — Triforce Solution Demo

**Format**: Solution Demo (201 level)
**Length**: ~3 minutes (14-16 steps)
**Audience**: Technical decision makers, architects, platform leads
**Tone**: Structured, clear, solution-oriented

## Before Recording

1. Open the Triforce frontend in Chrome: `https://triforce-<namespace>.<domain>/`
2. Start the Arcade Chrome extension
3. Set browser to full-screen or 1920×1080 window
4. Ensure you're on the splash screen (Red Hat × Intel, "click to begin")

---

## Recording Steps

### Step 1 — Splash Screen
**Click**: Anywhere to begin
**Hotspot**: Center of screen
**Annotation**: "Triforce: AI inference on Intel Xeon 6 — Red Hat + Intel"

### Step 2 — The Problem ($684B)
**What's on screen**: "$684 billion spent on enterprise AI in 2025"
**Click**: Anywhere to advance
**Annotation**: "Enterprise AI spending is massive — but most of it goes to GPU infrastructure that sits idle."

### Step 3 — The Failure Rate
**What's on screen**: Failure/waste statistics
**Click**: Advance through 2-3 slides quickly
**Annotation**: "85% of AI projects stall. The infrastructure cost is a key reason."

### Step 4 — The Root Cause
**What's on screen**: Root cause / reframe slide
**Click**: Advance to the "proof" slide
**Annotation**: "The question isn't 'is GPU faster?' — it's 'is CPU fast enough at $0?'"

### Step 5 — Architecture (Act 01)
**What's on screen**: Q&A challenge/answer pairs — 6 architecture layers revealed one at a time
**Click**: ▶ to advance to Act 01, then click **"Start: The first challenge -->"**
**Annotation**: "Six architecture challenges, each answered by a layer: intelligent routing, polyglot agents, MCP tools, event streams, CPU pool, GPU pool."
**Click sequence**: Alternate **"Show the answer: [layer] -->"** and **"Next challenge -->"** through all 6 layers
**Final click**: **"See it run live -->"**

### Step 6 — Live Inference: Healthcare (Act 02)
**Click**: ▶ to Act 02
**What's on screen**: Healthcare pipeline with CTA button
**Click**: **"Run Pipeline on Xeon 6"**
**Annotation**: "Live inference — a clinical note flows through classify → extract entities → check drug interactions → summarize. All on CPU."
**Wait**: For pipeline animation to complete (~8-10s)

### Step 7 — Pipeline Results
**What's on screen**: Classification, entity count, drug interactions, total latency, $0.00 cost
**Annotation**: "Full clinical NLP pipeline in under 10 seconds. Four models. Zero dollars."
**Pause**: 2 seconds on the results

### Step 8 — Live Inference: Fraud Scoring
**Click**: **"Score Transactions on Xeon 6"** (unlocks after pipeline completes)
**Wait**: Results appear
**Annotation**: "Same Xeon 6, different workload — Java/Quarkus fraud scoring with LLM + rule-based signals."
**Note**: Skip Telco and Energy verticals (steps 3-4 of Act 02) — they repeat the pattern. After fraud scoring, click **"See the cost story -->"** to advance.

### Step 9 — Benchmarks (Act 03)
**Click**: ▶ to Act 03
**What's on screen**: 6 task-selector buttons (Classification, NER, Summarization, Compliance, Network Anomaly, SCADA Alert)
**Click**: **"Run Classification Benchmark -->"**
**Wait**: Results table fills in
**Annotation**: "Side-by-side model comparison — same task, different models, different hardware. CPU classification in ~400ms."

### Step 10 — CPU vs GPU Table
**What's on screen**: Benchmark results with CPU and GPU columns
**Annotation**: "Classification: CPU is 2x slower but costs $0. Summarization: GPU is 2.3x faster. The decision depends on the task."
**Click**: **"See how it scales -->"**

### Step 11 — Scale Test (Act 04)
**Click**: ▶ to Act 04
**What's on screen**: Three tier buttons for concurrent load
**Click**: **"Run 10 records"**, wait for results
**Click**: **"Run 30 records"**, wait for results
**Annotation**: "Concurrent inference at scale — 30 records through the full pipeline simultaneously, still on CPU."
**Click**: **"See how we engineer it -->"** (unlocks after 2+ tiers)

### Step 12 — Efficiency Stack (Act 05)
**Click**: ▶ to Act 05
**What's on screen**: 12 optimization mechanisms revealed one at a time (Per-Record, Model, Fleet, Learning, Analysis)
**Click**: **"Show the first layer -->"**, then advance through 3-4 highlights
**Annotation**: "12 engineering techniques that make CPU fast enough — caching, routing, conditional pipeline, MCP tools, speculative decoding, and more."
**Tip**: Don't click through all 12. Show 3-4 (e.g. adaptive cache, conditional pipeline, multi-model fusion) then skip ahead.
**Final click**: **"The punchline -->"**

### Step 13 — The Punchline (Act 06)
**What's on screen**: Summary of what was demonstrated, CPU vs GPU routing decision table
**Annotation**: "The punchline: right model + right optimizations + right routing = CPU handles 80% at $0. GPU reserved for the 20% that genuinely needs it."
**Click**: **"What's next -->"**

### Step 14 — Variant Teasers (Footer)
**What's on screen**: Two cards — Secure, Virt — with "VIEW DEMO" badges
**Annotation**: "Two more stories: confidential AI (Intel TDX) and VM + AI coexistence (KubeVirt)."

---

## Recording Tips

- **Click pace**: Wait 1-2 seconds between clicks for Arcade to register each step
- **Annotations**: Write them AFTER recording — Arcade lets you add text overlays per step
- **Skip**: Act 02 verticals 3-4 (Telco + Energy) — they repeat the same pattern. Jump from fraud scoring to benchmarks.
- **Skip**: Act 05 (Efficiency) — show 3-4 mechanisms max, then skip to the punchline. All 12 would add 2+ minutes.
- **Hotspots**: Place on buttons and key numbers (latency, $0.00, speedup ratios)
- **End screen**: Stop recording on the variant teasers (Footer) — natural call-to-action

## Metadata for Submission

- **Title**: "Triforce: AI Inference on Intel Xeon 6 — CPU at $0/Token"
- **Type**: Solution Demo (201)
- **Product**: Red Hat OpenShift AI / Intel Xeon 6
- **Audience**: Technical decision makers, architects
- **Duration**: ~3 minutes
- **Keywords**: AI inference, CPU, Intel Xeon 6, heterogeneous compute, cost optimization
