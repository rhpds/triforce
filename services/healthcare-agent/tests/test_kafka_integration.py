"""Tests for healthcare agent Kafka integration with LangGraph pipeline.

Tests the pipeline logic without requiring a running Kafka broker.
Integration tests that use real Kafka are in tests/e2e/.
"""

import json
from unittest.mock import AsyncMock

import pytest

from kafka_consumer import HealthcareKafkaPipeline


@pytest.fixture
def mock_graph_fn():
    async def graph_fn(text, patient_id):
        return {
            "classification": "discharge_summary",
            "entities": [
                {"text": "Type 2 Diabetes", "type": "condition"},
                {"text": "Metformin", "type": "medication"},
                {"text": "Lisinopril", "type": "medication"},
                {"text": "Hypertension", "type": "condition"},
            ],
            "drug_interactions": [
                {"drug_a": "Metformin", "drug_b": "Lisinopril", "severity": "moderate",
                 "description": "Monitor renal function"}
            ],
            "summary": "65yo male with diabetes and hypertension, stable on current medications.",
            "inference_log": [
                {"node": "classify", "model": "granite-2b-cpu", "latency_ms": 800, "accelerator": "cpu"},
                {"node": "extract_entities", "model": "granite-2b-cpu", "latency_ms": 5000, "accelerator": "cpu"},
                {"node": "check_interactions", "tool": "drug_interaction_check", "latency_ms": 50},
                {"node": "summarize", "model": "granite-2b-cpu", "latency_ms": 2000, "accelerator": "cpu"},
            ],
        }
    return graph_fn


class TestHealthcareKafkaPipeline:
    def test_pipeline_creates(self, mock_graph_fn):
        pipeline = HealthcareKafkaPipeline(graph_fn=mock_graph_fn)
        assert pipeline is not None
        assert pipeline._running is False

    @pytest.mark.asyncio
    async def test_process_record_produces_results(self, mock_graph_fn):
        pipeline = HealthcareKafkaPipeline(graph_fn=mock_graph_fn)
        pipeline.producer = AsyncMock()
        pipeline.producer.send = AsyncMock()

        record = {
            "patient_id": "test-patient-1",
            "record_type": "discharge_summary",
            "text": "Patient is a 65-year-old male with Type 2 Diabetes on Metformin.",
            "generated_at": "2026-06-12T00:00:00Z",
        }

        await pipeline._process_record(record)

        calls = pipeline.producer.send.call_args_list
        topics_sent = [c[0][0] for c in calls]

        assert "healthcare.analysis.results" in topics_sent
        result_count = topics_sent.count("healthcare.analysis.results")
        assert result_count >= 3  # classification + NER + drug_interactions + summarization

    @pytest.mark.asyncio
    async def test_process_record_sends_alert_on_interactions(self, mock_graph_fn):
        pipeline = HealthcareKafkaPipeline(graph_fn=mock_graph_fn)
        pipeline.producer = AsyncMock()
        pipeline.producer.send = AsyncMock()

        record = {
            "patient_id": "test-patient-2",
            "record_type": "progress_note",
            "text": "Multiple medications detected.",
        }

        await pipeline._process_record(record)

        calls = pipeline.producer.send.call_args_list
        topics_sent = [c[0][0] for c in calls]
        assert "healthcare.alerts" in topics_sent

        alert_calls = [c for c in calls if c[0][0] == "healthcare.alerts"]
        alert_data = alert_calls[0][0][1]
        assert alert_data["severity"] == "critical"
        assert alert_data["type"] == "drug_interaction"

    @pytest.mark.asyncio
    async def test_process_record_result_format(self, mock_graph_fn):
        pipeline = HealthcareKafkaPipeline(graph_fn=mock_graph_fn)
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
    async def test_process_record_logs_all_graph_steps(self, mock_graph_fn):
        pipeline = HealthcareKafkaPipeline(graph_fn=mock_graph_fn)
        pipeline.producer = AsyncMock()
        pipeline.producer.send = AsyncMock()

        record = {"patient_id": "test-patient-4", "text": "test", "record_type": "unknown"}
        await pipeline._process_record(record)

        calls = pipeline.producer.send.call_args_list
        result_calls = [c for c in calls if c[0][0] == "healthcare.analysis.results"]
        analysis_types = [c[0][1]["analysis_type"] for c in result_calls]

        assert "classification" in analysis_types
        assert "ner" in analysis_types
        assert "summarization" in analysis_types
        assert "drug_interactions" in analysis_types

    @pytest.mark.asyncio
    async def test_process_record_handles_errors(self):
        async def failing_graph(text, patient_id):
            raise Exception("LiteLLM timeout")

        pipeline = HealthcareKafkaPipeline(graph_fn=failing_graph)
        pipeline.producer = AsyncMock()
        pipeline.producer.send = AsyncMock()

        record = {"patient_id": "test-err", "text": "test", "record_type": "unknown"}
        await pipeline._process_record(record)
        # Should not raise, just log the error
