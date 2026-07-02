"""SCADA sensor data simulator for edge inference demo.

Generates realistic compressor station sensor readings with
configurable anomaly injection. Outputs JSON lines that can
be piped to the BitNet anomaly agent.
"""

import json
import random
import sys
import time
from datetime import datetime, timezone

STATION = {
    "id": "COMP-B-DFW",
    "name": "Compressor Station B - Dallas",
    "pipeline": "Permian Basin Lateral 42",
}

SENSORS = [
    {"id": "VIB-X", "name": "vibration_x", "unit": "mm/s", "baseline": 4.2, "noise": 0.3},
    {"id": "VIB-Y", "name": "vibration_y", "unit": "mm/s", "baseline": 3.8, "noise": 0.25},
    {"id": "PRESS-IN", "name": "pressure_inlet", "unit": "psi", "baseline": 850, "noise": 15},
    {"id": "PRESS-OUT", "name": "pressure_outlet", "unit": "psi", "baseline": 1200, "noise": 20},
    {"id": "TEMP", "name": "bearing_temp", "unit": "F", "baseline": 185, "noise": 3},
    {"id": "FLOW", "name": "flow_rate", "unit": "MMSCFD", "baseline": 45.2, "noise": 1.5},
]

ANOMALY_SCENARIOS = [
    {
        "name": "bearing_wear",
        "description": "Bearing wear — vibration trending up",
        "affected": ["VIB-X", "VIB-Y", "TEMP"],
        "drift": {"VIB-X": 0.05, "VIB-Y": 0.04, "TEMP": 0.02},
    },
    {
        "name": "pressure_buildup",
        "description": "Outlet pressure buildup — possible blockage",
        "affected": ["PRESS-OUT", "FLOW"],
        "drift": {"PRESS-OUT": 0.03, "FLOW": -0.02},
    },
]


def generate_reading(tick: int, anomaly: dict | None = None) -> dict:
    readings = {}
    for s in SENSORS:
        value = s["baseline"] + random.gauss(0, s["noise"])
        if anomaly and s["id"] in anomaly.get("drift", {}):
            drift = anomaly["drift"][s["id"]]
            value += s["baseline"] * drift * tick
        readings[s["id"]] = {
            "value": round(value, 2),
            "unit": s["unit"],
            "baseline": s["baseline"],
            "pct_deviation": round((value - s["baseline"]) / s["baseline"] * 100, 1),
        }
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "station": STATION,
        "readings": readings,
        "tick": tick,
        "anomaly_injected": anomaly["name"] if anomaly else None,
    }


def format_for_llm(reading: dict) -> str:
    """Format a sensor reading as a natural language prompt for the anomaly agent."""
    lines = [f"Station: {reading['station']['name']}"]
    for sid, r in reading["readings"].items():
        sensor = next(s for s in SENSORS if s["id"] == sid)
        deviation = f" ({'+' if r['pct_deviation'] > 0 else ''}{r['pct_deviation']}%)" if abs(r["pct_deviation"]) > 5 else ""
        lines.append(f"  {sensor['name']}: {r['value']} {r['unit']} (baseline {r['baseline']}){deviation}")
    return "\n".join(lines)


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "stream"
    anomaly = random.choice(ANOMALY_SCENARIOS) if "--anomaly" in sys.argv else None

    if mode == "single":
        reading = generate_reading(20, anomaly)
        print(json.dumps(reading, indent=2))
        print("\n--- LLM Prompt ---")
        print(format_for_llm(reading))
    else:
        tick = 0
        if anomaly:
            print(f"Injecting anomaly: {anomaly['description']}", file=sys.stderr)
        while True:
            reading = generate_reading(tick, anomaly)
            print(json.dumps(reading))
            sys.stdout.flush()
            tick += 1
            time.sleep(5)
