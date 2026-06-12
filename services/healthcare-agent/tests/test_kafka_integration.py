"""Tests for healthcare agent Kafka integration.

These test the pipeline logic without requiring a running Kafka broker.
Integration tests that use real Kafka are in tests/e2e/.
"""

import asyncio
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from kafka_consumer import HealthcareKafkaPipeline
import models


@pytest.fixture
def mock_classify():
    async def classify(req):
        return models.ClassifyResponse(
            classification=models.DocumentType.discharge_summary,
            confidence=0.92,
            model="granite-2b-cpu",
            accelerator="cpu",
            inference_ms=150,
        )
    return classify


@pytest.fixture
def mock_extract():
    async def extract(req):
        return models.ExtractEntitiesResponse(
            entities=[
                models.MedicalEntity(text="Type 2 Diabetes", type=models.EntityType.condition, start=0, end=16),
                models.MedicalEntity(text="Metformin", type=models.EntityType.medication, start=20, end=29),
                models.MedicalEntity(text="Hypertension", type=models.EntityType.condition, start=35, end=47),
            ],
            model="granite-2b-cpu",
            accelerator="cpu",
            inference_ms=200,
        )
    return extract


class TestHealthcareKafkaPipeline:
    def test_pipeline_creates(self, mock_classify, mock_extract):
        pipeline = HealthcareKafkaPipeline(mock_classify, mock_extract)
        assert pipeline is not None
        assert pipeline._running is False

    @pytest.mark.asyncio
    async def test_process_record_produces_results(self, mock_classify, mock_extract):
        pipeline = HealthcareKafkaPipeline(mock_classify, mock_extract)
        pipeline.producer = AsyncMock()
        pipeline.producer.send = AsyncMock()

        record = {
            "patient_id": "test-patient-1",
            "record_type": "discharge_summary",
            "text": "Patient is a 65-year-old male with Type 2 Diabetes on Metformin, history of Hypertension.",
            "generated_at": "2026-06-12T00:00:00Z",
        }

        await pipeline._process_record(record)

        calls = pipeline.producer.send.call_args_list
        topics_sent = [c[0][0] for c in calls]

        assert "healthcare.analysis.results" in topics_sent
        assert topics_sent.count("healthcare.analysis.results") == 2  # classification + NER

    @pytest.mark.asyncio
    async def test_process_record_sends_alert_on_critical(self, mock_classify, mock_extract):
        pipeline = HealthcareKafkaPipeline(mock_classify, mock_extract)
        pipeline.producer = AsyncMock()
        pipeline.producer.send = AsyncMock()

        record = {
            "patient_id": "test-patient-2",
            "record_type": "progress_note",
            "text": "Multiple conditions found.",
        }

        await pipeline._process_record(record)

        calls = pipeline.producer.send.call_args_list
        topics_sent = [c[0][0] for c in calls]
        assert "healthcare.alerts" in topics_sent

        alert_calls = [c for c in calls if c[0][0] == "healthcare.alerts"]
        alert_data = alert_calls[0][0][1]
        assert alert_data["severity"] == "warning"
        assert alert_data["patient_id"] == "test-patient-2"

    @pytest.mark.asyncio
    async def test_process_record_result_format(self, mock_classify, mock_extract):
        pipeline = HealthcareKafkaPipeline(mock_classify, mock_extract)
        pipeline.producer = AsyncMock()
        pipeline.producer.send = AsyncMock()

        record = {
            "patient_id": "test-patient-3",
            "record_type": "lab_report",
            "text": "Lab results normal.",
        }

        await pipeline._process_record(record)

        calls = pipeline.producer.send.call_args_list
        result_calls = [c for c in calls if c[0][0] == "healthcare.analysis.results"]
        result_data = result_calls[0][0][1]

        assert "patient_id" in result_data
        assert "analysis_type" in result_data
        assert "model" in result_data
        assert "accelerator" in result_data
        assert "inference_ms" in result_data
        assert "kv_cache_hit" in result_data
        assert "processed_at" in result_data

    @pytest.mark.asyncio
    async def test_process_record_handles_errors(self, mock_extract):
        async def failing_classify(req):
            raise Exception("LiteLLM timeout")

        pipeline = HealthcareKafkaPipeline(failing_classify, mock_extract)
        pipeline.producer = AsyncMock()
        pipeline.producer.send = AsyncMock()

        record = {"patient_id": "test-err", "text": "test", "record_type": "unknown"}
        await pipeline._process_record(record)
        # Should not raise, just log the error
