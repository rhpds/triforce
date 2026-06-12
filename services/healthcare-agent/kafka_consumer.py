"""Kafka consumer for synthetic patient records.

Consumes from healthcare.patients.synthetic, runs clinical NLP pipeline,
and produces results to healthcare.analysis.results and healthcare.alerts.
"""

import asyncio
import json
import logging
import os
import uuid
from datetime import datetime, timezone

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer

import models

logger = logging.getLogger("healthcare.kafka")

KAFKA_BOOTSTRAP = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "localhost:19092")
CONSUMER_GROUP = "healthcare-agent"

TOPIC_PATIENTS = "healthcare.patients.synthetic"
TOPIC_RESULTS = "healthcare.analysis.results"
TOPIC_ALERTS = "healthcare.alerts"


class HealthcareKafkaPipeline:
    def __init__(self, classify_fn, extract_fn):
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
            classify_req = models.ClassifyRequest(text=text[:50000])
            classify_result = await self.classify_fn(classify_req)

            analysis_event = {
                "patient_id": patient_id,
                "analysis_type": "classification",
                "result": {
                    "classification": classify_result.classification.value,
                    "confidence": classify_result.confidence,
                },
                "model": classify_result.model,
                "accelerator": classify_result.accelerator,
                "inference_ms": classify_result.inference_ms,
                "kv_cache_hit": False,
                "processed_at": datetime.now(timezone.utc).isoformat(),
            }
            await self.producer.send(TOPIC_RESULTS, analysis_event)

            extract_req = models.ExtractEntitiesRequest(text=text[:50000])
            extract_result = await self.extract_fn(extract_req)

            ner_event = {
                "patient_id": patient_id,
                "analysis_type": "ner",
                "result": {
                    "entities": [
                        {"text": e.text, "type": e.type.value}
                        for e in extract_result.entities
                    ],
                    "count": len(extract_result.entities),
                },
                "model": extract_result.model,
                "accelerator": extract_result.accelerator,
                "inference_ms": extract_result.inference_ms,
                "kv_cache_hit": False,
                "processed_at": datetime.now(timezone.utc).isoformat(),
            }
            await self.producer.send(TOPIC_RESULTS, ner_event)

            critical_entities = [
                e for e in extract_result.entities
                if e.type in (models.EntityType.condition, models.EntityType.medication)
            ]
            if len(critical_entities) >= 3:
                alert = {
                    "alert_id": str(uuid.uuid4()),
                    "patient_id": patient_id,
                    "severity": "warning",
                    "type": "critical_condition",
                    "description": f"Multiple critical entities ({len(critical_entities)}) detected in {record_type}",
                    "entities": [
                        {"text": e.text, "type": e.type.value}
                        for e in critical_entities[:5]
                    ],
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
                await self.producer.send(TOPIC_ALERTS, alert)

            logger.info(
                "Processed patient %s: classification=%s, entities=%d",
                patient_id, classify_result.classification.value, len(extract_result.entities),
            )

        except Exception as e:
            logger.error("Failed to process patient %s: %s", patient_id, e)
