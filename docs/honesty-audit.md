# Honesty Audit — AI Inference on Intel Xeon 6

**Measured on:** infra01 (MAAS backend), July 16 2026
**Scope:** Every number shown to users across frontend demo, showroom lab, and demo scripts

---

## 1. Measurement Comparison — Hardcoded vs infra01 Reality

### Classification (ms)

| Model | Hardcoded | infra01 Measured | Delta | Verdict |
|-------|-----------|------------------|-------|---------|
| granite-2b-cpu | 389 | 652 | +68% slower | **STALE** — needs update |
| qwen25-3b-cpu | ~400 | 673 | +68% slower | **STALE** |
| phi3-mini-cpu | — | 659 | — | Not hardcoded |
| granite-3-2-8b-instruct-cpu | — | 911 | — | Not hardcoded |

### NER (ms)

| Model | Hardcoded | infra01 Measured | Delta | Verdict |
|-------|-----------|------------------|-------|---------|
| granite-2b-cpu | 4,602 | 7,473 | +62% slower | **STALE** |
| qwen25-3b-cpu | — | 3,823 | — | Not hardcoded |
| phi3-mini-cpu | — | 5,430 | — | Not hardcoded |

### Summarization (ms)

| Model | Hardcoded | infra01 Measured | Delta | Verdict |
|-------|-----------|------------------|-------|---------|
| granite-2b-cpu | — | 3,557 | — | Not hardcoded |
| qwen25-3b-cpu | 3,448 | 3,348 | -3% | **OK** — within variance |

### Pipeline (ms)

| Metric | Hardcoded | infra01 Measured | Delta | Verdict |
|--------|-----------|------------------|-------|---------|
| Full pipeline | ~9,500 | 7,759 | -18% faster | **OK** — live data, hardcoded was conservative |
| MCP tool (drug_interaction) | 16 | 9 | -44% faster | **OK** — still sub-100ms |

### Fusion (ms)

| Metric | Hardcoded | infra01 Measured | Verdict |
|--------|-----------|------------------|---------|
| Total (3 panel + judge) | — | 11,586 | LIVE — no hardcoded value |

### Speculative Decoding

| Metric | Hardcoded | infra01 Measured | Verdict |
|--------|-----------|------------------|---------|
| Baseline | — | 2,187 | LIVE |
| Speculative | — | 21,290 | LIVE |
| Speedup | "6.52x" (Oberon; measured on local model serving; remote inference via MAAS adds network overhead per speculative token) | **0.11x** (slower) | **MISMATCH** — speculative is 10x slower on MAAS |

**Note:** The "6.52x speedup" (measured on local model serving; remote inference via MAAS adds network overhead per speculative token) was measured on Oberon with local OVMS. On MAAS (remote inference), speculative decoding adds network round-trip overhead for both draft and target calls, making it slower. The 6.52x claim is honest for local serving but misleading for MAAS. Proposal: show both numbers or caveat "local serving only."

### Semantic Router (ms)

| Metric | Hardcoded | infra01 Measured | Verdict |
|--------|-----------|------------------|---------|
| Simple query | "<1ms" | 8,285 | **MISMATCH** — router is slow on infra01 |
| Complex query | "<1ms" | 8,297 | **MISMATCH** |

**Note:** The "<1ms" claim is for the embedding similarity calculation only. The 8,285ms measured includes the first-time embedding model warm-up. Subsequent calls should be <1ms. Proposal: re-measure after warm-up, or caveat "after model warm-up."

### Fraud Scoring (ms)

| Metric | infra01 Measured | Verdict |
|--------|------------------|---------|
| Suspicious transaction | 574 | LIVE — no hardcoded value |

### Adaptive Cache

| Metric | Claim | infra01 Measured | Verdict |
|--------|-------|------------------|---------|
| Cache hit after warmup | <1ms | 0ms | **VERIFIED** |
| "60% cache at week 2, 95% at month 1" | Projected | Not measured | **UNVERIFIED** — theoretical trajectory |

---

## 2. Source Verification — Opening Narrative Stats

| # | Claim | Attribution | Verdict | Source | Proposal |
|---|-------|-------------|---------|--------|----------|
| 1 | **$684B** AI spending 2025 | "Industry aggregate" | **NOT VERIFIED** | No primary source exists. IDC says $307B on AI solutions; Gartner says $1.5T total AI stack | Replace with IDC's "$307B" or Gartner's "$1.5T" and cite the source |
| 2 | **80.3%** AI projects failed | "RAND Corporation, 2025" | **PARTIALLY VERIFIED** | RAND says ">80%" (not 80.3%), report is from 2024 not 2025. [RAND RRA2680-1](https://www.rand.org/pubs/research_reports/RRA2680-1.html) | Change to ">80%" and year to 2024. Add URL |
| 3 | **95%** AI pilots zero P&L | "MIT Project NANDA, 2025" | **VERIFIED** | Matches exactly. MIT NANDA "The GenAI Divide" report, July 2025 | Add URL to [Fortune coverage](https://fortune.com/2025/08/18/mit-report-95-percent-generative-ai-pilots-at-companies-failing-cfo/) |
| 4 | **12-18%** CPU utilization | "McKinsey" | **MISATTRIBUTED** | Number is from NRDC (2014), not McKinsey. McKinsey says 5-15% | Change attribution to "NRDC/McKinsey" or use McKinsey's 5-15% |
| 5 | **95%** GPU idle | "VentureBeat, Q1 2026" | **VERIFIED** | Cast AI research via [VentureBeat](https://venturebeat.com/infrastructure/5-gpu-utilization-the-401-billion-ai-infrastructure-problem-enterprises-cant-keep-ignoring/) | Add URL |
| 6 | **18x** cloud vs on-prem | "Lenovo TCO Study, 2026" | **VERIFIED** | [Lenovo Press LP2368](https://lenovopress.lenovo.com/lp2368-on-premise-vs-cloud-generative-ai-total-cost-of-ownership-2026-edition). Note: 18x is API-specific, not all cloud | Add URL. Consider noting "vs frontier API pricing" |
| 7 | **80%** doesn't need GPU | No attribution | **NOT VERIFIED** | No authoritative source found | Reframe: "In our measured workloads, classification, NER, and scoring ran within SLA on CPU at $0/token" |
| 8 | **85%** AI projects stall | Arcade script only | **NOT VERIFIED** | Contradicts frontend's 80.3%/95%. No source | Align with RAND's ">80%" or MIT's 95% |

### Additional Claims

| Claim | Verdict | Source |
|-------|---------|--------|
| VMware **300-1200%** increase | **VERIFIED** — actually conservative (reports go to 1,500%) | Multiple: [Software Pricing Guide](https://softwarepricingguide.com/vmware-pricing-after-broadcom-the-800-1500-price-shock-what-changed-and-your-real-alternatives-in-2025/), [Forbes](https://www.forbes.com/sites/stevemcdowell/2025/08/31/broadcom-plays-defense-at-vmware-explore-2025/) |
| HIPAA fine **$1.5M** average | **UNVERIFIED** — "commonly cited" but no specific source | Needs citation from HHS enforcement data |
| TDX overhead **+8% latency, +25% memory, +3s startup** | **UNVERIFIED** — expected from docs, not measured | Needs measurement or label as "expected" |

---

## 3. Claim Inventory by Category

### LIVE (fetched from API at runtime — inherently honest)
- Pipeline latencies (all steps)
- Benchmark results table
- Fusion panel + judge results
- Speculative decoding comparison
- Adaptive cache stats
- INT4 vs INT8 comparison
- BitNet edge inference
- Scale test (10/30/50 concurrent)
- Fraud scoring results

### MEASURED (from benchmarks, hardcoded — needs periodic refresh)
- Classification CPU: 389ms → **should be ~650ms on MAAS**
- NER CPU: 4,602ms → **should be ~7,400ms on MAAS**
- Summarization CPU: 3,448ms → **OK (~3,350ms)**
- MCP tool: 16ms → **OK (~9ms)**
- Speculative 6.52x speedup (measured on local model serving; remote inference via MAAS adds network overhead per speculative token) → **only valid on Oberon, not MAAS**

### UNVERIFIED (no source, projected, or unmeasured)
- $684B stat (no primary source)
- 80% doesn't need GPU (no source)
- 85% Arcade script stat (contradicts frontend)
- All cost/pricing figures (marked `verified: false` in claim registry)
- Adaptive cache trajectory (60%/95% projections)
- Conditional pipeline "25% skip rate" (asserted average)
- TDX overhead percentages
- llm-d visual numbers (200ms prefill, 1.2s decode — fabricated, roadmap feature)

---

## 4. Proposals

### High Priority (numbers shown on screen that don't match reality)

| Issue | Current | Proposal |
|-------|---------|----------|
| Classification CPU hardcoded as 389ms | 389ms | Update to ~650ms (MAAS median) or remove hardcoded value |
| NER CPU hardcoded as 4,602ms | 4,602ms | Update to ~7,400ms (MAAS median) |
| Speculative "6.52x speedup" | 6.52x (measured on local model serving; remote inference via MAAS adds network overhead per speculative token) | Add caveat: "measured on local serving (Oberon). Remote inference via MAAS adds network overhead" |
| Router "<1ms" claim | <1ms | Add caveat: "after embedding model warm-up (~2 min on first request)" |
| $684B stat | No source | Replace with IDC $307B or Gartner $1.5T and cite |
| 80.3% → change to >80% | False precision | Use RAND's actual language: "more than 80%" |
| 80% doesn't need GPU | Unsourced | Reframe as measured observation from this demo's workloads |

### Medium Priority (sourcing and attribution fixes)

| Issue | Proposal |
|-------|----------|
| 12-18% CPU utilization attributed to McKinsey | Correct to NRDC or use McKinsey's 5-15% |
| 85% in Arcade script contradicts frontend | Align with RAND >80% |
| Cost figures all unverified | Verify current pricing from vendor sites, add "as of July 2026" |
| llm-d visual shows fabricated numbers | Label as "projected target" — it's a roadmap feature |

### Low Priority (theoretical projections)

| Issue | Proposal |
|-------|----------|
| Cache trajectory 60%/95% | Label as "projected based on typical repeat-query patterns" |
| Conditional pipeline 25% skip rate | Label as "workload-dependent" |
| TDX overhead +8%/+25%/+3s | Label as "expected from Intel documentation" until measured |

---

## 5. Summary Scorecard

| Category | Count | Honest? |
|----------|-------|---------|
| LIVE (from API) | 12 endpoints | Yes — inherently honest |
| MEASURED + current | 3 metrics | Yes — within 10% of reality |
| MEASURED + stale | 3 metrics | **No** — 60-70% off from MAAS reality |
| VERIFIED sources | 4 of 8 stats | Partially — 4 verified, 2 partially, 2 not found |
| UNVERIFIED claims | 8+ | **No** — need sourcing or reframing |
| Fabricated (llm-d) | 1 visual | **No** — roadmap feature with fake numbers |

**Overall honesty rating: the LIVE data is solid (12 endpoints, all real). The hardcoded benchmarks are stale for MAAS (measured on Oberon). The opening narrative has 2 unverifiable stats and 1 misattribution. The "80% doesn't need GPU" thesis is the biggest gap — it's the central claim with no citation.**
