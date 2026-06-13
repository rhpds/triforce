export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  service: string
  version: string
}

export interface ClassifyResponse {
  classification: string
  confidence: number
  model: string
  accelerator: string
  inference_ms: number
}

export interface MedicalEntity {
  text: string
  type: string
  start: number
  end: number
}

export interface ExtractEntitiesResponse {
  entities: MedicalEntity[]
  model: string
  accelerator: string
  inference_ms: number
}

export interface SummarizeResponse {
  summary: string
  key_findings?: string[]
  model: string
  accelerator: string
  inference_ms: number
}

export interface FraudSignal {
  type: string
  severity: string
  description: string
  confidence?: number
}

export interface ScoreTransactionResponse {
  transaction_id: string
  risk_score: number
  risk_level: string
  signals: FraudSignal[]
  recommendation: string
  model: string
  accelerator: string
  inference_ms: number
}

export interface AgentSkill {
  id: string
  name: string
  description: string
  tags?: string[]
}

export interface AgentCard {
  name: string
  description: string
  version: string
  url: string
  protocolVersion: string
  skills: AgentSkill[]
}

export interface DiscoveredAgent {
  name: string
  url: string
  status: string
  skills: AgentSkill[]
}

export interface WorkflowStep {
  agent: string
  skill: string
  status: string
  inference_ms?: number
}

export interface WorkflowResponse {
  id: string
  workflow_type: string
  status: string
  agents_involved?: string[]
  steps?: WorkflowStep[]
  started_at: string
  completed_at?: string
  duration_ms?: number
}

export interface PlatformMetrics {
  agents: { total: number; active: number; workflows_completed: number; workflows_failed: number }
  inference: { total_requests: number; avg_latency_ms: number; p95_latency_ms: number; cpu_requests: number; gpu_requests: number; kv_cache_hit_rate: number }
  kafka: { messages_produced: number; messages_consumed: number; consumer_lag: number }
}
