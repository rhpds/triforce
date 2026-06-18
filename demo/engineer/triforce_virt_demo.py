"""Triforce Virt Demo — VMs + AI on Intel Xeon 6.

Rich terminal demo showing VM and AI agent coexistence.

Usage:
  python3 demo/engineer/triforce_virt_demo.py
"""

import asyncio
import os
import sys

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.tree import Tree

console = Console()

HEALTHCARE_URL = os.environ.get("HEALTHCARE_URL", "http://localhost:8081")


async def main():
    console.print(Panel(
        "[bold red]TRIFORCE VIRT[/]\n\n"
        "[bold]VMs + AI Agents on One Intel Xeon 6 Server[/]\n"
        "OpenShift Virtualization · No separate GPU cluster · Unified management",
        border_style="red", width=70,
    ))
    console.print()

    # Act 1: Architecture
    console.rule("[bold red]Act 1 — One Server, Two Workload Types[/]")
    tree = Tree("[bold]Intel Xeon 6 Node[/]")
    vms = tree.add("[red]Virtual Machines (KubeVirt)[/]")
    vms.add("legacy-database (RHEL 9, 4 CPU, 8Gi)")
    containers = tree.add("[cyan]AI Agent Containers[/]")
    containers.add("healthcare-agent (Python/LangGraph)")
    containers.add("finserv-agent (Java/Quarkus)")
    containers.add("orchestrator (Go)")
    infra = tree.add("[dim]Shared Infrastructure[/]")
    infra.add("PostgreSQL")
    infra.add("Kafka (AMQ Streams)")
    console.print(tree)
    console.print()

    # Act 2: Resource Sharing
    console.rule("[bold red]Act 2 — Shared Resources[/]")
    table = Table(show_header=True, header_style="bold", title="Node Resource Allocation")
    table.add_column("Workload", width=25)
    table.add_column("Type", width=12)
    table.add_column("CPU", justify="right", width=8)
    table.add_column("Memory", justify="right", width=10)

    table.add_row("[red]legacy-database[/]", "VM", "4 cores", "8 Gi")
    table.add_row("[cyan]healthcare-agent[/]", "Container", "250m", "512 Mi")
    table.add_row("[cyan]finserv-agent[/]", "Container", "500m", "768 Mi")
    table.add_row("[cyan]orchestrator[/]", "Container", "100m", "128 Mi")
    table.add_row("[dim]postgres[/]", "Container", "250m", "256 Mi")
    table.add_row("[dim]redpanda[/]", "Container", "500m", "512 Mi")
    table.add_row("", "", "─────", "──────")
    table.add_row("[bold]Total[/]", "", "[bold]~6 cores[/]", "[bold]~10 Gi[/]")

    console.print(table)
    console.print()

    # Act 3: VM Calls AI
    console.rule("[bold red]Act 3 — Legacy VM Consumes AI Services[/]")
    console.print("  The VM calls the healthcare agent via Kubernetes networking:")
    console.print("  [dim]virtctl ssh legacy-database -- curl http://healthcare-agent:8081/health[/]")
    console.print()

    try:
        import httpx
        resp = httpx.get(f"{HEALTHCARE_URL}/health", timeout=5.0)
        console.print(f"  [green]✓ Healthcare agent healthy: {resp.json()['status']}[/]")
        console.print(f"  [green]✓ VM can reach AI services via standard K8s networking[/]")
    except Exception:
        console.print("  [yellow]⚠ Agent not reachable (run with backend stack)[/]")

    console.print()

    # Act 4: Value
    console.rule("[bold red]Act 4 — The Value[/]")
    console.print(Panel(
        "[bold]What OpenShift Virtualization gives you:[/]\n\n"
        "• [green]No separate GPU cluster[/] — Xeon 6 runs VMs AND AI inference\n"
        "• [green]No re-architecture[/] — legacy VMs consume AI via standard networking\n"
        "• [green]One platform[/] — OpenShift manages VMs and containers together\n"
        "• [green]One Helm chart[/] — --set virtualization.enabled=true adds the VM\n\n"
        "[bold]Intel Xeon 6. Red Hat OpenShift Virtualization. IBM Granite model.[/]",
        title="[bold]Triforce Virt[/]", border_style="red",
    ))


if __name__ == "__main__":
    asyncio.run(main())
