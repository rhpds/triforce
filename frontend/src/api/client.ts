import type {
  HealthResponse, ClassifyResponse, ExtractEntitiesResponse,
  SummarizeResponse, ScoreTransactionResponse,
  AgentCard, DiscoveredAgent, WorkflowResponse, PlatformMetrics,
} from './types'

const HEALTHCARE_URL = import.meta.env.VITE_HEALTHCARE_URL || 'http://localhost:8081'
const FINSERV_URL = import.meta.env.VITE_FINSERV_URL || 'http://localhost:8082'
const ORCHESTRATOR_URL = import.meta.env.VITE_ORCHESTRATOR_URL || 'http://localhost:8083'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`)
  return resp.json()
}

export const getHealthcareHealth = () => fetchJson<HealthResponse>(`${HEALTHCARE_URL}/health`)
export const getHealthcareAgentCard = () => fetchJson<AgentCard>(`${HEALTHCARE_URL}/.well-known/agent-card.json`)
export const getHealthcareStats = () => fetchJson<Record<string, number>>(`${HEALTHCARE_URL}/api/v1/stats`)
export const classifyDocument = (text: string) =>
  fetchJson<ClassifyResponse>(`${HEALTHCARE_URL}/api/v1/classify`, { method: 'POST', body: JSON.stringify({ text }) })
export const extractEntities = (text: string) =>
  fetchJson<ExtractEntitiesResponse>(`${HEALTHCARE_URL}/api/v1/extract-entities`, { method: 'POST', body: JSON.stringify({ text }) })
export const summarizeRecord = (text: string, maxLength = 500) =>
  fetchJson<SummarizeResponse>(`${HEALTHCARE_URL}/api/v1/summarize`, { method: 'POST', body: JSON.stringify({ text, max_length: maxLength }) })

export const scoreTransaction = (transaction: Record<string, unknown>) =>
  fetchJson<ScoreTransactionResponse>(`${FINSERV_URL}/api/v1/score-transaction`, { method: 'POST', body: JSON.stringify({ transaction }) })
export const checkCompliance = (transaction: Record<string, unknown>, regulations?: string[]) =>
  fetchJson<ScoreTransactionResponse>(`${FINSERV_URL}/api/v1/check-compliance`, { method: 'POST', body: JSON.stringify({ transaction, regulations }) })
export const assessRisk = (customerId: string) =>
  fetchJson<ScoreTransactionResponse>(`${FINSERV_URL}/api/v1/assess-risk`, { method: 'POST', body: JSON.stringify({ customer_id: customerId }) })

export const listAgents = () => fetchJson<{ agents: DiscoveredAgent[] }>(`${ORCHESTRATOR_URL}/api/v1/agents`)
export const startWorkflow = (workflowType: string, input: Record<string, unknown>) =>
  fetchJson<WorkflowResponse>(`${ORCHESTRATOR_URL}/api/v1/workflows`, { method: 'POST', body: JSON.stringify({ workflow_type: workflowType, input }) })
export const listWorkflows = () => fetchJson<WorkflowResponse[]>(`${ORCHESTRATOR_URL}/api/v1/workflows`)
export const getMetrics = () => fetchJson<PlatformMetrics>(`${ORCHESTRATOR_URL}/api/v1/metrics`)
export const startSyntheticLoad = (target: string, ratePerSecond = 10, durationSeconds = 60) =>
  fetchJson<{ status: string }>(`${ORCHESTRATOR_URL}/api/v1/synthetic/start`, { method: 'POST', body: JSON.stringify({ target, rate_per_second: ratePerSecond, duration_seconds: durationSeconds }) })
export const stopSyntheticLoad = () =>
  fetchJson<{ status: string }>(`${ORCHESTRATOR_URL}/api/v1/synthetic/stop`, { method: 'POST' })
