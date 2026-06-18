"""Triforce Govern Demo — AI Agent Governance with Kagenti.

Rich terminal demo showing A2A lifecycle, SPIFFE identity, MCP tools, audit.

Usage:
  python3 demo/engineer/triforce_govern_demo.py
"""

import asyncio
import json
import os
import sys

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.tree import Tree
from rich.syntax import Syntax

console = Console()

ORCHESTRATOR_URL = os.environ.get("ORCHESTRATOR_URL", "http://localhost:8083")
HEALTHCARE_URL = os.environ.get("HEALTHCARE_URL", "http://localhost:8081")


async def main():
    console.print(Panel(
        "[bold blue]TRIFORCE GOVERN[/]\n\n"
        "[bold]AI Agent Governance with IBM Kagenti[/]\n"
        "A2A Lifecycle · SPIFFE Identity · MCP Tools · Audit Trail",
        border_style="blue", width=70,
    ))
    console.print()

    # Act 1: Agent Discovery
    console.rule("[bold blue]Act 1 — A2A Agent Discovery[/]")
    console.print("[dim]Kagenti discovers agents via /.well-known/agent-card.json[/]\n")

    try:
        import httpx
        agents = httpx.get(f"{ORCHESTRATOR_URL}/api/v1/agents", timeout=5.0).json().get("agents", [])
        tree = Tree("[bold]Kagenti Agent Registry[/]")
        for agent in agents:
            color = "green" if agent["status"] == "active" else "red"
            branch = tree.add(f"[{color}]● {agent['name']}[/] [dim]AgentRuntime enrolled[/]")
            branch.add(f"[dim]URL: {agent['url']}[/]")
            branch.add(f"[dim]SPIFFE ID: spiffe://triforce/ns/triforce/sa/{agent['name'].lower().replace(' ', '-')}[/]")
            for skill in agent.get("skills", []):
                branch.add(f"[dim]⚙ {skill['name']}[/]")
        console.print(tree)
    except Exception:
        console.print("  [yellow]⚠ Orchestrator not reachable[/]")

    console.print()

    # Act 2: SPIFFE Identity
    console.rule("[bold blue]Act 2 — Zero-Trust Identity (SPIFFE)[/]")
    table = Table(show_header=True, header_style="bold")
    table.add_column("Agent", width=25)
    table.add_column("SPIFFE Identity", width=50)

    table.add_row("Healthcare Agent", "[cyan]spiffe://triforce/ns/triforce/sa/healthcare-agent[/]")
    table.add_row("FinServ Agent", "[cyan]spiffe://triforce/ns/triforce/sa/finserv-agent[/]")
    table.add_row("Orchestrator", "[cyan]spiffe://triforce/ns/triforce/sa/orchestrator[/]")

    console.print(table)
    console.print("\n  [dim]Every agent-to-agent call authenticated with crypto workload identity.[/]")
    console.print("  [dim]No static credentials. No API keys between agents. mTLS everywhere.[/]")
    console.print()

    # Act 3: MCP Tool Federation
    console.rule("[bold blue]Act 3 — MCP Tool Governance[/]")
    tool_table = Table(show_header=True, header_style="bold", title="Federated Tools (via MCP Gateway)")
    tool_table.add_column("Tool", width=25)
    tool_table.add_column("Server", width=20)
    tool_table.add_column("Policy", width=20)

    tool_table.add_row("fhir_patient_lookup", "Healthcare Agent", "[green]Allow all[/]")
    tool_table.add_row("drug_interaction_check", "Healthcare Agent", "[green]Allow all[/]")
    tool_table.add_row("clinical_code_search", "Healthcare Agent", "[green]Allow all[/]")
    tool_table.add_row("risk_profile_lookup", "FinServ Agent", "[yellow]FinServ only[/]")
    tool_table.add_row("regulatory_rule_check", "FinServ Agent", "[yellow]FinServ only[/]")
    tool_table.add_row("sanction_list_search", "FinServ Agent", "[red]Restricted[/]")

    console.print(tool_table)
    console.print()

    # Act 4: Audit Trail
    console.rule("[bold blue]Act 4 — Complete Audit Trail[/]")

    try:
        import httpx
        stats = httpx.get(f"{HEALTHCARE_URL}/api/v1/stats", timeout=5.0).json()
        audit_table = Table(show_header=True, header_style="bold")
        audit_table.add_column("Metric", width=25)
        audit_table.add_column("Value", justify="right", width=15)

        audit_table.add_row("Total inference calls", f"[bold]{stats.get('total_requests', 0)}[/]")
        audit_table.add_row("Avg latency", f"{stats.get('avg_latency_ms', 0):.0f}ms")
        audit_table.add_row("CPU inference", f"[green]{stats.get('cpu_requests', 0)} (100%)[/]")
        audit_table.add_row("GPU inference", f"{stats.get('gpu_requests', 0)} (0%)")

        console.print(audit_table)
    except Exception:
        console.print("  [yellow]⚠ Stats not available[/]")

    console.print("\n  [dim]Every inference call, every tool invocation, every workflow decision[/]")
    console.print("  [dim]logged to PostgreSQL with agent name, model, latency, accelerator.[/]")
    console.print()

    # Value
    console.rule("[bold blue]Act 5 — The Value[/]")
    console.print(Panel(
        "[bold]What Kagenti governance gives you:[/]\n\n"
        "• [green]Agent lifecycle as code[/] — AgentRuntime CRDs, not scripts\n"
        "• [green]Zero-trust by default[/] — SPIFFE identity, no static credentials\n"
        "• [green]Tool governance[/] — control which agents call which tools\n"
        "• [green]Complete audit[/] — every action logged, queryable, exportable\n"
        "• [green]Framework-neutral[/] — LangGraph, CrewAI, AG2 — Kagenti doesn't care\n\n"
        "[bold]IBM Kagenti. Intel Xeon 6. Red Hat OpenShift. That's Triforce Govern.[/]",
        title="[bold]Triforce Govern[/]", border_style="blue",
    ))


if __name__ == "__main__":
    asyncio.run(main())
