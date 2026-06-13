"""Triforce Inference Race — Live benchmark visualization.

Races Xeon 6 (real inference) against GPU cloud and API models (calculated)
at increasing scale to show the cost crossover point.

Usage:
  python3 demo/engineer/inference_race.py --scale 10     # Quick (30s)
  python3 demo/engineer/inference_race.py --scale 100    # Medium (2 min)
  python3 demo/engineer/inference_race.py --scale all    # Full story arc
"""

import argparse
import asyncio
import os
import sys
import time

import httpx
from rich.console import Console
from rich.live import Live
from rich.panel import Panel
from rich.progress import BarColumn, Progress, SpinnerColumn, TextColumn, TimeElapsedColumn
from rich.table import Table
from rich.text import Text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
from synthetic.healthcare_generator import generate_patient_record

console = Console()

HEALTHCARE_URL = os.environ.get("HEALTHCARE_URL", "http://localhost:8081")
FINSERV_URL = os.environ.get("FINSERV_URL", "http://localhost:8082")

TRIFORCE_LOGO = """
[bold cyan]            ▲[/]
[bold cyan]           ╱ ╲[/]
[bold cyan]          ╱   ╲[/]
[bold red]         ╱ RED ╲[/]
[bold red]        ╱  HAT  ╲[/]
[bold red]       ╱ COURAGE ╲[/]
[bold cyan]      ╱───────────╲[/]
[bold cyan]     ╱ ╲         ╱ ╲[/]
[bold blue]    ╱   ╲       ╱   ╲[/]
[bold blue]   ╱     ╲     ╱     ╲[/]
[bold blue]  ╱ INTEL ╲   ╱  IBM  ╲[/]
[bold blue] ╱  POWER  ╲ ╱ WISDOM  ╲[/]
[bold cyan]╱───────────╳───────────╲[/]
"""

RUNNERS = [
    {"name": "Xeon 6 Healthcare", "type": "live-hc", "color": "cyan", "cost_per_record": 0.0, "est_latency_ms": 650, "throughput_factor": 1.0},
    {"name": "Xeon 6 FinServ", "type": "live-fs", "color": "bright_cyan", "cost_per_record": 0.0, "est_latency_ms": 5, "throughput_factor": 1.0},
    {"name": "NVIDIA H100 (cloud)", "type": "calculated", "color": "green", "cost_per_record": 0.0021, "est_latency_ms": 180, "throughput_factor": 3.5},
    {"name": "AMD MI300X (cloud)", "type": "calculated", "color": "red", "cost_per_record": 0.0018, "est_latency_ms": 200, "throughput_factor": 3.2},
    {"name": "Claude Haiku (API)", "type": "calculated", "color": "yellow", "cost_per_record": 0.0084, "est_latency_ms": 400, "throughput_factor": 1.8},
    {"name": "Claude Opus (API)", "type": "calculated", "color": "magenta", "cost_per_record": 0.042, "est_latency_ms": 800, "throughput_factor": 0.9},
]


async def run_xeon_healthcare(client, record):
    start = time.monotonic()
    try:
        resp = await client.post(f"{HEALTHCARE_URL}/api/v1/classify",
                                 json={"text": record["text"]}, timeout=30.0)
        latency = time.monotonic() - start
        return resp.status_code == 200, latency
    except Exception:
        return False, time.monotonic() - start


async def run_xeon_finserv(client, tx):
    start = time.monotonic()
    try:
        resp = await client.post(f"{FINSERV_URL}/api/v1/score-transaction",
                                 json={"transaction": tx}, timeout=10.0)
        latency = time.monotonic() - start
        return resp.status_code == 200, latency
    except Exception:
        return False, time.monotonic() - start


async def run_race(scale: int, theme: str = "intel"):
    from synthetic.finserv_generator import generate_transaction
    records = [generate_patient_record() for _ in range(scale)]
    transactions = [generate_transaction(suspicious=i % 5 == 0) for i in range(scale)]

    console.print(Panel(TRIFORCE_LOGO, title="[bold]TRIFORCE[/]", subtitle="Enterprise AI at Scale", border_style="cyan", width=50, padding=(0, 4)))
    console.print()
    console.rule(f"[bold]INFERENCE RACE — {scale:,} Records per vertical[/]")
    console.print(f"[dim]Xeon 6 runs LIVE inference (healthcare + finserv concurrent). Others calculated.[/]\n")

    runner_state = []
    for r in RUNNERS:
        runner_state.append({
            "name": r["name"],
            "color": r["color"],
            "processed": 0,
            "cost": 0.0,
            "latencies": [],
            "cost_per_record": r["cost_per_record"],
            "est_latency_ms": r["est_latency_ms"],
            "throughput_factor": r["throughput_factor"],
            "type": r["type"],
        })

    def build_display():
        table = Table(show_header=True, header_style="bold", box=None, padding=(0, 1))
        table.add_column("Runner", width=24)
        table.add_column("Progress", width=32)
        table.add_column("Done", justify="right", width=8)
        table.add_column("Cost", justify="right", width=10)
        table.add_column("Avg ms", justify="right", width=8)

        for rs in runner_state:
            pct = rs["processed"] / scale if scale > 0 else 0
            bar_width = 28
            filled = int(pct * bar_width)
            bar = f"[{rs['color']}]{'█' * filled}[/][dim]{'░' * (bar_width - filled)}[/]"

            cost_str = f"${rs['cost']:,.2f}" if rs["cost"] > 0 else "[green]$0.00[/]"
            avg_ms = f"{sum(rs['latencies']) / len(rs['latencies']) * 1000:.0f}" if rs["latencies"] else "—"
            done_str = f"{rs['processed']}/{scale}"

            label = rs["name"]
            if rs["type"] == "live":
                label = f"[bold {rs['color']}]⚡ {rs['name']}[/]"
            else:
                label = f"[{rs['color']}]  {rs['name']}[/]"

            table.add_row(label, bar, done_str, cost_str, avg_ms)

        return table

    concurrency = min(scale, 5)
    semaphore = asyncio.Semaphore(concurrency)
    xeon_done = asyncio.Event()
    start_time = time.monotonic()

    async def xeon_hc_worker(client, record):
        async with semaphore:
            success, latency = await run_xeon_healthcare(client, record)
            if success:
                runner_state[0]["processed"] += 1
                runner_state[0]["latencies"].append(latency)

    async def xeon_fs_worker(client, tx):
        async with semaphore:
            success, latency = await run_xeon_finserv(client, tx)
            if success:
                runner_state[1]["processed"] += 1
                runner_state[1]["latencies"].append(latency)

    async def update_calculated():
        while not xeon_done.is_set():
            elapsed = time.monotonic() - start_time
            for rs in runner_state[1:]:
                est = min(int(elapsed * rs["throughput_factor"] / (rs["est_latency_ms"] / 1000)), scale)
                if est > rs["processed"]:
                    delta = est - rs["processed"]
                    rs["processed"] = est
                    rs["cost"] += delta * rs["cost_per_record"]
                    rs["latencies"].extend([rs["est_latency_ms"] / 1000] * delta)
            await asyncio.sleep(0.1)
        for rs in runner_state[1:]:
            rem = scale - rs["processed"]
            if rem > 0:
                rs["processed"] = scale
                rs["cost"] += rem * rs["cost_per_record"]
                rs["latencies"].extend([rs["est_latency_ms"] / 1000] * rem)

    async def refresh_display(live):
        while not xeon_done.is_set():
            live.update(build_display())
            await asyncio.sleep(0.12)
        live.update(build_display())

    with Live(build_display(), refresh_per_second=8, console=console) as live:
        async with httpx.AsyncClient(timeout=30.0) as client:
            calc = asyncio.create_task(update_calculated())
            disp = asyncio.create_task(refresh_display(live))
            hc_tasks = [xeon_hc_worker(client, r) for r in records]
            fs_tasks = [xeon_fs_worker(client, t) for t in transactions]
            await asyncio.gather(*hc_tasks, *fs_tasks)
            xeon_done.set()
            await calc
            await disp

    total_time = time.monotonic() - start_time
    console.print()

    # Results
    console.rule("[bold]RESULTS[/]")

    results = Table(show_header=True, header_style="bold", title=f"Race Complete — {scale:,} records in {total_time:.1f}s")
    results.add_column("Runner", width=24)
    results.add_column("Throughput", justify="right")
    results.add_column("Avg Latency", justify="right")
    results.add_column("Total Cost", justify="right")
    results.add_column("Annual @ 100K/mo", justify="right")

    for rs in runner_state:
        throughput = rs["processed"] / total_time if total_time > 0 else 0
        avg_lat = sum(rs["latencies"]) / len(rs["latencies"]) * 1000 if rs["latencies"] else 0
        annual = rs["cost_per_record"] * 100_000 * 12

        cost_style = "green" if rs["cost"] == 0 else ("yellow" if rs["cost"] < 10 else "red")
        annual_style = "green" if annual == 0 else ("yellow" if annual < 5000 else "red")

        results.add_row(
            f"[{rs['color']}]{rs['name']}[/]",
            f"{throughput:.1f} rec/s",
            f"{avg_lat:.0f}ms",
            f"[{cost_style}]${rs['cost']:,.2f}[/]",
            f"[{annual_style}]${annual:,.0f}[/]",
        )

    console.print(results)
    console.print()

    # The honest take
    xeon_cost = runner_state[0]["cost"]
    cheapest_api = min(rs["cost"] for rs in runner_state if rs["type"] == "calculated")
    most_expensive = max(rs["cost"] for rs in runner_state)

    if scale <= 20:
        console.print(Panel(
            f"[yellow]At {scale} records, API models are faster per-request.\n"
            f"Cost difference is negligible (${most_expensive:.2f} total).\n"
            f"For low volume, pay-per-token APIs make sense.[/]\n\n"
            f"[bold]But watch what happens at scale...[/]",
            title="[yellow]Honest Take[/]", border_style="yellow",
        ))
    else:
        savings = most_expensive - xeon_cost
        console.print(Panel(
            f"[green]Xeon 6 processed {scale:,} records at [bold]$0.00[/bold].\n"
            f"Most expensive alternative: [bold]${most_expensive:,.2f}[/bold] for the same work.\n"
            f"Annual projection at 100K records/month:\n"
            f"  Xeon 6: [bold green]$15,000/yr[/] (infrastructure only)\n"
            f"  Claude Opus: [bold red]${runner_state[-1]['cost_per_record'] * 100_000 * 12:,.0f}/yr[/][/]\n\n"
            f"[bold]At enterprise scale, there's no contest.[/]",
            title="[green]The Xeon 6 Advantage[/]", border_style="green",
        ))

    console.print()
    console.print("[dim]Xeon 6: live inference via MAAS/LiteLLM on granite-4-0-h-tiny[/]")
    console.print("[dim]GPU/API costs: sourced from Spheron, Thunder Compute, GridStackHub, Google Vertex AI (June 2026)[/]")


async def run_progressive():
    for scale in [10, 100]:
        await run_race(scale)
        console.print()
        console.input("[dim]Press Enter to increase scale...[/]")
        console.print()


def main():
    parser = argparse.ArgumentParser(description="Triforce Inference Race")
    parser.add_argument("--scale", default="10", help="Number of records: 10, 100, 1000, or 'all' for progressive")
    parser.add_argument("--theme", default="intel", choices=["intel", "redhat", "ibm"])
    args = parser.parse_args()

    if args.scale == "all":
        asyncio.run(run_progressive())
    else:
        asyncio.run(run_race(int(args.scale), args.theme))


if __name__ == "__main__":
    main()
