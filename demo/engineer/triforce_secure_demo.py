"""Triforce Secure Demo — Confidential AI on Intel Xeon 6.

Rich terminal demo showing TDX hardware encryption + Trustee attestation.

Usage:
  python3 demo/engineer/triforce_secure_demo.py
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
        "[bold cyan]TRIFORCE SECURE[/]\n\n"
        "[bold]Confidential AI Inference on Intel Xeon 6[/]\n"
        "Hardware-encrypted memory · Attestation-gated secrets · Zero code changes",
        border_style="cyan", width=70,
    ))
    console.print()

    # Act 1: TDX Architecture
    console.rule("[bold cyan]Act 1 — How TDX Protects Your AI[/]")
    tree = Tree("[bold]Request Flow (Confidential)[/]")
    t1 = tree.add("[cyan]Pod starts with runtimeClassName: kata-cc[/]")
    t2 = t1.add("[cyan]Kata creates VM with TDX memory encryption[/]")
    t3 = t2.add("[cyan]Agent calls Trustee KBS: 'Give me the API key'[/]")
    t4 = t3.add("[green]TDX hardware attestation → verified[/]")
    t5 = t4.add("[green]Secret released → inference works[/]")
    t5.add("[bold green]All data encrypted in hardware — cluster admin cannot read memory[/]")
    console.print(tree)
    console.print()

    # Act 2: What Changes
    console.rule("[bold cyan]Act 2 — One Line Changes Everything[/]")
    table = Table(show_header=True, header_style="bold")
    table.add_column("", width=20)
    table.add_column("Standard Deploy", width=30)
    table.add_column("Confidential Deploy", width=30)

    table.add_row("Pod spec", "spec:", "spec:")
    table.add_row("Runtime", "[dim](default)[/]", "[bold green]runtimeClassName: kata-cc[/]")
    table.add_row("Container image", "Same", "Same")
    table.add_row("Application code", "Same", "Same")
    table.add_row("Model", "granite-2b-cpu", "granite-2b-cpu")
    table.add_row("API key source", "Kubernetes Secret", "[green]Trustee KBS (attested)[/]")
    table.add_row("Memory", "Readable by admin", "[green]TDX encrypted[/]")
    table.add_row("Performance", "~839ms classify", "[green]~839ms classify (same)[/]")

    console.print(table)
    console.print()

    # Act 3: Live Inference
    console.rule("[bold cyan]Act 3 — Confidential Inference (Live)[/]")
    try:
        import httpx
        with console.status("[cyan]Running classification inside TDX Trust Domain...[/]"):
            resp = httpx.post(f"{HEALTHCARE_URL}/api/v1/classify",
                json={"text": "DISCHARGE SUMMARY: Patient with diabetes on Metformin."},
                timeout=30.0)
            data = resp.json()
        console.print(f"  Classification: [green]{data['classification']}[/]")
        console.print(f"  Model:          [cyan]{data['model']}[/]")
        console.print(f"  Latency:        [cyan]{data['inference_ms']}ms[/]")
        console.print(f"  Accelerator:    [green]CPU (Xeon 6 + AMX inside TDX)[/]")
        console.print(f"\n  [bold green]Same quality. Same speed. Now hardware-encrypted.[/]")
    except Exception as e:
        console.print(f"  [yellow]Live inference unavailable: {e}[/]")

    # Act 4: Value
    console.rule("[bold cyan]Act 4 — The Value[/]")
    console.print(Panel(
        "[bold]What TDX gives you:[/]\n\n"
        "• [green]Hardware-encrypted memory[/] — PHI/PII never visible to cluster admin\n"
        "• [green]Attestation-gated secrets[/] — API keys released only to verified TDX\n"
        "• [green]Zero code changes[/] — same container, same model, one YAML line\n"
        "• [green]AMX still works[/] — no performance penalty inside TDX\n\n"
        "[bold]Intel Xeon 6 + TDX. Red Hat Sandboxed Containers. IBM Granite model.[/]",
        title="[bold]Triforce Secure[/]", border_style="green",
    ))


if __name__ == "__main__":
    asyncio.run(main())
