"""Triforce Scale Test — Push synthetic data through both agents and measure performance.

Tests the full pipeline: generate → classify/score → measure latency on Xeon 6 CPU.
"""

import asyncio
import json
import sys
import time
from dataclasses import dataclass, field

import httpx

sys.path.insert(0, ".")
from synthetic.healthcare_generator import generate_patient_record
from synthetic.finserv_generator import generate_transaction

HEALTHCARE_URL = "http://localhost:8081"
FINSERV_URL = "http://localhost:8082"
ORCHESTRATOR_URL = "http://localhost:8083"


@dataclass
class Stats:
    total: int = 0
    passed: int = 0
    failed: int = 0
    latencies: list = field(default_factory=list)

    @property
    def avg_ms(self):
        return sum(self.latencies) / len(self.latencies) if self.latencies else 0

    @property
    def p95_ms(self):
        if not self.latencies:
            return 0
        s = sorted(self.latencies)
        idx = int(len(s) * 0.95)
        return s[min(idx, len(s) - 1)]


async def test_healthcare_classify(client, stats):
    record = generate_patient_record()
    start = time.monotonic()
    try:
        resp = await client.post(f"{HEALTHCARE_URL}/api/v1/classify",
                                 json={"text": record["text"]}, timeout=30.0)
        latency = int((time.monotonic() - start) * 1000)
        stats.total += 1
        if resp.status_code == 200:
            data = resp.json()
            stats.passed += 1
            stats.latencies.append(latency)
            return data["classification"], latency, data.get("model", "")
        else:
            stats.failed += 1
            return "ERROR", latency, ""
    except Exception as e:
        stats.total += 1
        stats.failed += 1
        return f"FAIL:{e}", 0, ""


async def test_finserv_score(client, stats, suspicious=False):
    tx = generate_transaction(suspicious=suspicious)
    start = time.monotonic()
    try:
        resp = await client.post(f"{FINSERV_URL}/api/v1/score-transaction",
                                 json={"transaction": tx}, timeout=10.0)
        latency = int((time.monotonic() - start) * 1000)
        stats.total += 1
        if resp.status_code == 200:
            data = resp.json()
            stats.passed += 1
            stats.latencies.append(latency)
            return data["risk_level"], data["risk_score"], latency
        else:
            stats.failed += 1
            return "ERROR", 0, latency
    except Exception as e:
        stats.total += 1
        stats.failed += 1
        return f"FAIL:{e}", 0, 0


async def test_a2a_discovery(client):
    agents = []
    for url in [HEALTHCARE_URL, FINSERV_URL]:
        resp = await client.get(f"{url}/.well-known/agent-card.json", timeout=5.0)
        card = resp.json()
        agents.append(card["name"])
    return agents


async def main():
    hc_count = 10
    fs_count = 20

    print("=" * 70)
    print("  TRIFORCE SCALE TEST")
    print("  Red Hat (OpenShift) + IBM (Kagenti) + Intel (Xeon 6)")
    print("=" * 70)

    async with httpx.AsyncClient() as client:
        # Phase 1: A2A Discovery
        print("\n[Phase 1] A2A Agent Discovery")
        agents = await test_a2a_discovery(client)
        for a in agents:
            print(f"  ✓ Discovered: {a}")

        # Phase 2: Healthcare — Clinical NLP on Xeon 6
        print(f"\n[Phase 2] Healthcare Agent — {hc_count} clinical documents on Xeon 6 CPU")
        hc_stats = Stats()
        for i in range(hc_count):
            classification, latency, model = await test_healthcare_classify(client, hc_stats)
            status = "✓" if classification != "ERROR" else "✗"
            print(f"  {status} [{i+1:>2}/{hc_count}] {classification:20s} {latency:>5d}ms  ({model})")

        # Phase 3: FinServ — Fraud Scoring on Xeon 6
        print(f"\n[Phase 3] FinServ Agent — {fs_count} transactions on Xeon 6 CPU")
        fs_stats = Stats()
        for i in range(fs_count):
            suspicious = i % 5 == 0
            risk_level, score, latency = await test_finserv_score(client, fs_stats, suspicious)
            flag = "⚠" if score > 30 else "✓"
            print(f"  {flag} [{i+1:>2}/{fs_count}] risk={score:>5.1f} {risk_level:8s} {latency:>5d}ms"
                  + (" [SUSPICIOUS]" if suspicious else ""))

        # Phase 4: Cross-agent workflow via orchestrator
        print("\n[Phase 4] Cross-Agent Workflow via Orchestrator")
        resp = await client.post(f"{ORCHESTRATOR_URL}/api/v1/workflows", json={
            "workflow_type": "patient_financial_risk",
            "input": {"patient_id": "scale-test-001", "customer_id": "cust-1234"},
        }, timeout=10.0)
        if resp.status_code == 202:
            wf = resp.json()
            print(f"  ✓ Workflow started: {wf['id']} (type={wf['workflow_type']}, status={wf['status']})")
        else:
            print(f"  ✗ Workflow failed: {resp.status_code}")

        # Phase 5: Metrics
        print("\n[Phase 5] Platform Metrics")
        resp = await client.get(f"{ORCHESTRATOR_URL}/api/v1/metrics", timeout=5.0)
        if resp.status_code == 200:
            metrics = resp.json()
            print(f"  Agents: {metrics['agents']['total']} total, {metrics['agents']['active']} active")

    # Summary
    print("\n" + "=" * 70)
    print("  RESULTS")
    print("=" * 70)
    print(f"\n  Healthcare (Intel Xeon 6 / granite-2b-cpu):")
    print(f"    Requests:  {hc_stats.total} total, {hc_stats.passed} passed, {hc_stats.failed} failed")
    print(f"    Latency:   avg={hc_stats.avg_ms:.0f}ms, p95={hc_stats.p95_ms:.0f}ms")

    print(f"\n  FinServ (Intel Xeon 6 / granite-2b-cpu):")
    print(f"    Requests:  {fs_stats.total} total, {fs_stats.passed} passed, {fs_stats.failed} failed")
    print(f"    Latency:   avg={fs_stats.avg_ms:.0f}ms, p95={fs_stats.p95_ms:.0f}ms")

    total_passed = hc_stats.passed + fs_stats.passed
    total = hc_stats.total + fs_stats.total
    print(f"\n  Total:  {total_passed}/{total} passed across 2 verticals")
    print(f"  Stack:  PostgreSQL + Redpanda + 3 polyglot agents (Python/Java/Go)")
    print(f"  Infra:  All inference on Intel Xeon 6 CPU — zero GPU required")
    print("=" * 70)

    return 0 if hc_stats.failed == 0 and fs_stats.failed == 0 else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
