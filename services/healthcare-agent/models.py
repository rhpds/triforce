"""Pydantic models for the Healthcare Agent — derived from OpenAPI contract."""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class HealthStatus(str, Enum):
    healthy = "healthy"
    degraded = "degraded"
    unhealthy = "unhealthy"


class DependencyStatus(str, Enum):
    up = "up"
    down = "down"


class Dependencies(BaseModel):
    postgres: DependencyStatus = DependencyStatus.down
    kafka: DependencyStatus = DependencyStatus.down
    litellm: DependencyStatus = DependencyStatus.down


class HealthResponse(BaseModel):
    status: HealthStatus
    service: str = "healthcare-agent"
    version: str = "0.1.0"
    dependencies: Optional[Dependencies] = None


class DocumentType(str, Enum):
    discharge_summary = "discharge_summary"
    progress_note = "progress_note"
    lab_report = "lab_report"
    radiology_report = "radiology_report"
    pathology_report = "pathology_report"
    surgical_note = "surgical_note"
    consultation = "consultation"
    prescription = "prescription"
    unknown = "unknown"


class ClassifyRequest(BaseModel):
    text: str = Field(min_length=1, max_length=50000)
    document_type_hint: Optional[str] = None


class ClassifyResponse(BaseModel):
    classification: DocumentType
    confidence: float = Field(ge=0, le=1)
    model: str
    accelerator: str = "cpu"
    inference_ms: int = Field(ge=0)


class EntityType(str, Enum):
    condition = "condition"
    medication = "medication"
    procedure = "procedure"
    lab_test = "lab_test"
    anatomy = "anatomy"
    dosage = "dosage"


class MedicalEntity(BaseModel):
    text: str
    type: EntityType
    start: int = Field(ge=0)
    end: int = Field(ge=0)
    icd10_code: Optional[str] = None
    confidence: Optional[float] = Field(None, ge=0, le=1)


class ExtractEntitiesRequest(BaseModel):
    text: str = Field(min_length=1, max_length=50000)
    entity_types: Optional[list[str]] = None


class ExtractEntitiesResponse(BaseModel):
    entities: list[MedicalEntity]
    model: str
    accelerator: str = "cpu"
    inference_ms: int = Field(ge=0)


class SummarizeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=100000)
    max_length: int = Field(500, ge=50, le=2000)


class SummarizeResponse(BaseModel):
    summary: str
    key_findings: Optional[list[str]] = None
    model: str
    accelerator: str = "cpu"
    inference_ms: int = Field(ge=0)
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None


class PipelineStepLog(BaseModel):
    node: str
    model: Optional[str] = None
    tool: Optional[str] = None
    latency_ms: int = Field(ge=0)
    accelerator: Optional[str] = "cpu"
    kv_cache_hit: Optional[bool] = None


class PipelineRequest(BaseModel):
    text: str = Field(min_length=1, max_length=50000)
    patient_id: Optional[str] = None
    classify_model: Optional[str] = None
    ner_model: Optional[str] = None
    summarize_model: Optional[str] = None


class PipelineResponse(BaseModel):
    classification: str
    entities: list[MedicalEntity]
    drug_interactions: list[dict]
    summary: str
    inference_log: list[PipelineStepLog]
    total_ms: int = Field(ge=0)


class PipelineCompareResponse(BaseModel):
    baseline: PipelineResponse
    optimized: PipelineResponse
    delta_ms: int
    speedup: str


# A2A Protocol models

class AgentCapabilities(BaseModel):
    streaming: bool = False
    pushNotifications: bool = False
    stateTransitionHistory: bool = True


class AgentSkill(BaseModel):
    id: str
    name: str
    description: str
    tags: Optional[list[str]] = None
    examples: Optional[list[str]] = None


class AgentCard(BaseModel):
    name: str = "Healthcare Agent"
    description: str = "Clinical NLP agent for medical document classification, entity extraction, and patient record summarization. Runs on Intel Xeon 6 CPU."
    version: str = "0.1.0"
    url: str = "http://localhost:8081"
    protocolVersion: str = "0.2.6"
    provider: str = "Red Hat / IBM / Intel"
    capabilities: AgentCapabilities = AgentCapabilities()
    defaultInputModes: list[str] = ["text"]
    defaultOutputModes: list[str] = ["text"]
    skills: list[AgentSkill] = [
        AgentSkill(
            id="classify-document",
            name="Classify Document",
            description="Classify a clinical document by type (discharge summary, lab report, etc.)",
            tags=["healthcare", "nlp", "classification"],
            examples=["Classify this clinical note", "What type of medical document is this?"],
        ),
        AgentSkill(
            id="extract-entities",
            name="Extract Entities",
            description="Extract medical entities (conditions, medications, procedures) from clinical text",
            tags=["healthcare", "nlp", "ner"],
            examples=["Extract medical entities from this text", "Find conditions and medications in this note"],
        ),
        AgentSkill(
            id="summarize-record",
            name="Summarize Record",
            description="Generate a concise summary of a patient record",
            tags=["healthcare", "nlp", "summarization"],
            examples=["Summarize this patient record", "Give me a brief overview of this clinical note"],
        ),
    ]


class Part(BaseModel):
    kind: str = "text"
    text: Optional[str] = None


class Message(BaseModel):
    messageId: str
    kind: str = "message"
    role: str = "user"
    parts: list[Part]


class TaskSendParams(BaseModel):
    id: str
    message: Message


class JsonRpcRequest(BaseModel):
    jsonrpc: str = "2.0"
    id: str
    method: str
    params: Optional[dict] = None


class TaskStatus(BaseModel):
    state: str = "completed"
    timestamp: Optional[str] = None


class Artifact(BaseModel):
    artifactId: str = Field(default_factory=lambda: str(uuid.uuid4()))
    parts: list[Part]


class Task(BaseModel):
    id: str
    contextId: Optional[str] = None
    status: TaskStatus
    artifacts: Optional[list[Artifact]] = None
    kind: str = "task"


class JsonRpcResponse(BaseModel):
    jsonrpc: str = "2.0"
    id: str
    result: Optional[Task] = None
    error: Optional[dict] = None
