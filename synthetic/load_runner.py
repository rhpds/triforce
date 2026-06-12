"""Scale test harness for Triforce.

Pushes synthetic data through Kafka at configurable rates to validate
throughput, latency SLOs, and system behavior under load.
"""

import argparse
import asyncio
import json
import logging
import time

from aiokafka import AIOKafkaProducer

from healthcare_generator import generate_patient_record
from finserv_generator import generate_transaction

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("load-runner")


async def run_load(
    bootstrap_servers: str,
    target: str,
    rate_per_second: float,
    duration_seconds: int,
):
    producer = AIOKafkaProducer(
        bootstrap_servers=bootstrap_servers,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
    )
    await producer.start()

    interval = 1.0 / rate_per_second
    total_sent = 0
    start_time = time.monotonic()
    end_time = start_time + duration_seconds

    logger.info(
        "Starting load: target=%s, rate=%.1f/sec, duration=%ds",
        target, rate_per_second, duration_seconds,
    )

    try:
        while time.monotonic() < end_time:
            loop_start = time.monotonic()

            if target in ("healthcare", "both"):
                record = generate_patient_record()
                await producer.send("healthcare.patients.synthetic", record)
                total_sent += 1

            if target in ("finserv", "both"):
                tx = generate_transaction(suspicious=total_sent % 20 == 0)
                await producer.send("finserv.transactions.synthetic", tx)
                total_sent += 1

            elapsed = time.monotonic() - loop_start
            if elapsed < interval:
                await asyncio.sleep(interval - elapsed)

            if total_sent % 100 == 0:
                elapsed_total = time.monotonic() - start_time
                actual_rate = total_sent / elapsed_total if elapsed_total > 0 else 0
                logger.info(
                    "Progress: %d messages sent (%.1f/sec actual)",
                    total_sent, actual_rate,
                )

    finally:
        await producer.stop()

    elapsed_total = time.monotonic() - start_time
    actual_rate = total_sent / elapsed_total if elapsed_total > 0 else 0
    logger.info(
        "Load complete: %d messages in %.1fs (%.1f/sec)",
        total_sent, elapsed_total, actual_rate,
    )
    return {"messages_sent": total_sent, "duration_seconds": elapsed_total, "actual_rate": actual_rate}


def main():
    parser = argparse.ArgumentParser(description="Triforce synthetic load runner")
    parser.add_argument("--bootstrap-servers", default="localhost:19092")
    parser.add_argument("--target", choices=["healthcare", "finserv", "both"], default="both")
    parser.add_argument("--rate", type=float, default=10.0, help="Messages per second")
    parser.add_argument("--duration", type=int, default=60, help="Duration in seconds")
    args = parser.parse_args()

    asyncio.run(run_load(
        bootstrap_servers=args.bootstrap_servers,
        target=args.target,
        rate_per_second=args.rate,
        duration_seconds=args.duration,
    ))


if __name__ == "__main__":
    main()
