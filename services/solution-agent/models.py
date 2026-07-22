"""Pydantic models for the Solution Architect Agent."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class HealthStatus(str, Enum):
    healthy = "healthy"
    degraded = "degraded"
    unhealthy = "unhealthy"


class HealthResponse(BaseModel):
    status: HealthStatus
    service: str = "solution-agent"
    version: str = "0.1.0"


class AdviseRequest(BaseModel):
    query: str = Field(min_length=1, max_length=50000)


class InferenceLogEntry(BaseModel):
    node: str
    model: Optional[str] = None
    tool: Optional[str] = None
    latency_ms: int = Field(ge=0)
    accelerator: Optional[str] = "cpu"


class AdviseResponse(BaseModel):
    brief: str
    requirements: dict
    hardware_options: list
    platform_capabilities: list
    architecture: dict
    inference_log: list[InferenceLogEntry]
    total_ms: int = Field(ge=0)
