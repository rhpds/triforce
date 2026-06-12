package workflow

import (
	"fmt"
	"sync"
	"time"

	"github.com/triforce/orchestrator/internal/a2a"
)

type StartRequest struct {
	WorkflowType string                 `json:"workflow_type"`
	Input        map[string]interface{} `json:"input"`
}

type WorkflowStep struct {
	Agent       string    `json:"agent"`
	Skill       string    `json:"skill"`
	Status      string    `json:"status"`
	InferenceMs int       `json:"inference_ms,omitempty"`
	StartedAt   time.Time `json:"started_at,omitempty"`
}

type WorkflowRun struct {
	ID             string                 `json:"id"`
	WorkflowType   string                 `json:"workflow_type"`
	Status         string                 `json:"status"`
	Input          map[string]interface{} `json:"input"`
	Output         map[string]interface{} `json:"output,omitempty"`
	AgentsInvolved []string               `json:"agents_involved,omitempty"`
	Steps          []WorkflowStep         `json:"steps,omitempty"`
	StartedAt      time.Time              `json:"started_at"`
	CompletedAt    *time.Time             `json:"completed_at,omitempty"`
	DurationMs     int                    `json:"duration_ms,omitempty"`
}

type PlatformMetrics struct {
	Agents    AgentMetrics     `json:"agents"`
	Inference InferenceMetrics `json:"inference"`
	Kafka     KafkaMetrics     `json:"kafka"`
}

type AgentMetrics struct {
	Total              int `json:"total"`
	Active             int `json:"active"`
	WorkflowsCompleted int `json:"workflows_completed"`
	WorkflowsFailed    int `json:"workflows_failed"`
}

type InferenceMetrics struct {
	TotalRequests  int     `json:"total_requests"`
	AvgLatencyMs   float64 `json:"avg_latency_ms"`
	P95LatencyMs   float64 `json:"p95_latency_ms"`
	CpuRequests    int     `json:"cpu_requests"`
	GpuRequests    int     `json:"gpu_requests"`
	CostSavedVsGpu float64 `json:"cost_saved_vs_gpu"`
	KvCacheHitRate float64 `json:"kv_cache_hit_rate"`
}

type KafkaMetrics struct {
	MessagesProduced int `json:"messages_produced"`
	MessagesConsumed int `json:"messages_consumed"`
	ConsumerLag      int `json:"consumer_lag"`
}

type Engine struct {
	mu        sync.RWMutex
	runs      map[string]*WorkflowRun
	a2aClient *a2a.Client
	counter   int
}

func NewEngine(client *a2a.Client) *Engine {
	return &Engine{
		runs:      make(map[string]*WorkflowRun),
		a2aClient: client,
	}
}

func (e *Engine) Start(req StartRequest) (*WorkflowRun, error) {
	e.mu.Lock()
	defer e.mu.Unlock()

	e.counter++
	run := &WorkflowRun{
		ID:           fmt.Sprintf("wf-%s-%04d", time.Now().Format("20060102"), e.counter),
		WorkflowType: req.WorkflowType,
		Status:       "pending",
		Input:        req.Input,
		StartedAt:    time.Now(),
	}
	e.runs[run.ID] = run
	return run, nil
}

func (e *Engine) List() []WorkflowRun {
	e.mu.RLock()
	defer e.mu.RUnlock()

	runs := make([]WorkflowRun, 0, len(e.runs))
	for _, r := range e.runs {
		runs = append(runs, *r)
	}
	return runs
}

func (e *Engine) Get(id string) (*WorkflowRun, bool) {
	e.mu.RLock()
	defer e.mu.RUnlock()
	r, ok := e.runs[id]
	return r, ok
}

func (e *Engine) Metrics() PlatformMetrics {
	e.mu.RLock()
	defer e.mu.RUnlock()

	agents := e.a2aClient.ListAgents()
	active := 0
	for _, a := range agents {
		if a.Status == "active" {
			active++
		}
	}

	completed := 0
	failed := 0
	for _, r := range e.runs {
		switch r.Status {
		case "completed":
			completed++
		case "failed":
			failed++
		}
	}

	return PlatformMetrics{
		Agents: AgentMetrics{
			Total:              len(agents),
			Active:             active,
			WorkflowsCompleted: completed,
			WorkflowsFailed:    failed,
		},
		Inference: InferenceMetrics{},
		Kafka:     KafkaMetrics{},
	}
}
