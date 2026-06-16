"""Kafka consumer for synthetic patient records.

Consumes from healthcare.patients.synthetic, runs the full LangGraph
pipeline (classify → extract → check interactions → summarize),
and produces results to healthcare.analysis.results and healthcare.alerts.
"""

import asyncio
import json
import logging
import os
import uuid
from datetime import datetime, timezone

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer

logger = logging.getLogger("healthcare.kafka")

KAFKA_BOOTSTRAP = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "localhost:19092")
CONSUMER_GROUP = "healthcare-agent"

TOPIC_PATIENTS = "healthcare.patients.synthetic"
TOPIC_RESULTS = "healthcare.analysis.results"
TOPIC_ALERTS = "healthcare.alerts"


class HealthcareKafkaPipeline:
    def __init__(self, graph_fn=None, classify_fn=None, extract_fn=None):
        self.graph_fn = graph_fn
        self.classify_fn = classify_fn
        self.extract_fn = extract_fn
        self.consumer = None
        self.producer = None
        self._running = False

    async def start(self):
        self.consumer = AIOKafkaConsumer(
            TOPIC_PATIENTS,
            bootstrap_servers=KAFKA_BOOTSTRAP,
            group_id=CONSUMER_GROUP,
            value_deserializer=lambda v: json.loads(v.decode("utf-8")),
            auto_offset_reset="earliest",
        )
        self.producer = AIOKafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )
        await self.consumer.start()
        await self.producer.start()
        self._running = True
        logger.info("Healthcare Kafka pipeline started")

    async def stop(self):
        self._running = False
        if self.consumer:
            await self.consumer.stop()
        if self.producer:
            await self.producer.stop()
        logger.info("Healthcare Kafka pipeline stopped")

    async def run(self):
        await self.start()
        try:
            async for msg in self.consumer:
                if not self._running:
                    break
                await self._process_record(msg.value)
        finally:
            await self.stop()

    async def _process_record(self, record: dict):
        patient_id = record.get("patient_id", str(uuid.uuid4()))
        text = record.get("text", "")
        record_type = record.get("record_type", "unknown")

        try:
            if self.graph_fn:
                result = await self.graph_fn(text, patient_id)
                await self._publish_graph_results(patient_id, record_type, result)
            else:
                await self._process_legacy(patient_id, text, record_type)

        except Exception as e:
            logger.error("Failed to process patient %s: %s", patient_id, e)

    async def _publish_graph_results(self, patient_id: str, record_type: str, result: dict):
        """Publish results from a full LangGraph execution."""
        now = datetime.now(timezone.utc).isoformat()
        inference_log = result.get("inference_log", [])

        classify_ms = sum(e.get("latency_ms", 0) for e in inference_log if e.get("node") == "classify")
        await self.producer.send(TOPIC_RESULTS, {
            "patient_id": patient_id,
            "analysis_type": "classification",
            "result": {"classification": result.get("classification", "unknown")},
            "model": "granite-2b-cpu",
            "accelerator": "cpu",
            "inference_ms": classify_ms,
            "kv_cache_hit": False,
            "processed_at": now,
        })

        entities = result.get("entities", [])
        ner_ms = sum(e.get("latency_ms", 0) for e in inference_log if e.get("node") == "extract_entities")
        await self.producer.send(TOPIC_RESULTS, {
            "patient_id": patient_id,
            "analysis_type": "ner",
            "result": {
                "entities": [{"text": e.get("text"), "type": e.get("type")} for e in entities],
                "count": len(entities),
            },
            "model": "granite-2b-cpu",
            "accelerator": "cpu",
            "inference_ms": ner_ms,
            "kv_cache_hit": False,
            "processed_at": now,
        })

        interactions = result.get("drug_interactions", [])
        if interactions:
            await self.producer.send(TOPIC_RESULTS, {
                "patient_id": patient_id,
                "analysis_type": "drug_interactions",
                "result": {"interactions": interactions, "count": len(interactions)},
                "model": "mcp-tool",
                "accelerator": "cpu",
                "inference_ms": sum(e.get("latency_ms", 0) for e in inference_log if e.get("node") == "check_interactions"),
                "kv_cache_hit": False,
                "processed_at": now,
            })

        summary = result.get("summary")
        if summary:
            summ_ms = sum(e.get("latency_ms", 0) for e in inference_log if e.get("node") == "summarize")
            await self.producer.send(TOPIC_RESULTS, {
                "patient_id": patient_id,
                "analysis_type": "summarization",
                "result": {"summary": summary[:500]},
                "model": "granite-2b-cpu",
                "accelerator": "cpu",
                "inference_ms": summ_ms,
                "kv_cache_hit": False,
                "processed_at": now,
            })

        med_count = sum(1 for e in entities if e.get("type") == "medication")
        cond_count = sum(1 for e in entities if e.get("type") == "condition")
        if med_count + cond_count >= 3 or interactions:
            severity = "critical" if interactions else "warning"
            await self.producer.send(TOPIC_ALERTS, {
                "alert_id": str(uuid.uuid4()),
                "patient_id": patient_id,
                "severity": severity,
                "type": "drug_interaction" if interactions else "critical_condition",
                "description": (
                    f"Drug interactions detected: {len(interactions)}" if interactions
                    else f"Multiple clinical entities ({med_count + cond_count}) in {record_type}"
                ),
                "entities": [{"text": e.get("text"), "type": e.get("type")} for e in entities[:5]],
                "created_at": now,
            })

        total_ms = sum(e.get("latency_ms", 0) for e in inference_log)
        steps = len(inference_log)
        logger.info(
            "Processed patient %s: classification=%s, entities=%d, interactions=%d, steps=%d, total=%dms",
            patient_id, result.get("classification"), len(entities), len(interactions), steps, total_ms,
        )

    async def _process_legacy(self, patient_id, text, record_type):
        """Fallback: process using individual functions (pre-LangGraph)."""
        import models
        if self.classify_fn:
            req = models.ClassifyRequest(text=text[:50000])
            classify_result = await self.classify_fn(req)
            await self.producer.send(TOPIC_RESULTS, {
                "patient_id": patient_id,
                "analysis_type": "classification",
                "result": {"classification": classify_result.classification.value},
                "model": classify_result.model,
                "accelerator": classify_result.accelerator,
                "inference_ms": classify_result.inference_ms,
                "kv_cache_hit": False,
                "processed_at": datetime.now(timezone.utc).isoformat(),
            })
