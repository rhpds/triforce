-- Triforce shared PostgreSQL schema
-- All CREATE statements are idempotent (IF NOT EXISTS)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- pgvector loaded if available (arm64 dev may not have it)
DO $$ BEGIN
    CREATE EXTENSION IF NOT EXISTS "pgvector";
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pgvector not available — skipping (vector search disabled)';
END $$;

-- Agent registry — tracks all agents and their A2A endpoints
CREATE TABLE IF NOT EXISTS agent_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    agent_type TEXT NOT NULL CHECK (agent_type IN ('healthcare', 'finserv', 'orchestrator')),
    a2a_url TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    last_heartbeat TIMESTAMPTZ,
    capabilities JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workflow runs — tracks multi-agent workflow executions
CREATE TABLE IF NOT EXISTS workflow_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    input JSONB NOT NULL,
    output JSONB,
    agents_involved TEXT[],
    steps JSONB DEFAULT '[]',
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    error TEXT
);

-- Inference log — tracks every LLM call for cost/latency analysis
CREATE TABLE IF NOT EXISTS inference_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL,
    model TEXT NOT NULL,
    task_type TEXT NOT NULL,
    input_tokens INTEGER,
    output_tokens INTEGER,
    latency_ms INTEGER,
    accelerator TEXT DEFAULT 'cpu' CHECK (accelerator IN ('cpu', 'gpu')),
    cost_estimate NUMERIC(10,6),
    kv_cache_hit BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit trail — governance and compliance logging
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_inference_log_agent_created
    ON inference_log (agent_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inference_log_model_created
    ON inference_log (model, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inference_log_accelerator
    ON inference_log (accelerator, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status
    ON workflow_runs (status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trail_agent
    ON audit_trail (agent_name, created_at DESC);

-- Migration tracking
CREATE TABLE IF NOT EXISTS applied_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO applied_migrations (name) VALUES ('001_initial_schema')
ON CONFLICT (name) DO NOTHING;
