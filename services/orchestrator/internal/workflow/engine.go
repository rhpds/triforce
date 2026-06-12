package workflow

import (
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/triforce/orchestrator/internal/a2a"
)

type StartRequest struct {
	WorkflowType string                 `json:"workflow_type"`
	Input        map[string]interface{} `json:"input"`
}

type WorkflowStep struct {
	Agent       string                 `json:"agent"`
	Skill       string                 `json:"skill"`
	Status      string                 `json:"status"`
	Output      map[string]interface{} `json:"output,omitempty"`
	InferenceMs int                    `json:"inference_ms,omitempty"`
	StartedAt   time.Time              `json:"started_at,omitempty"`
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
	mu             sync.RWMutex
	runs           map[string]*WorkflowRun
	a2aClient      *a2a.Client
	counter        int
	totalLatencyMs int
	totalRequests  int
}

func NewEngine(client *a2a.Client) *Engine {
	return &Engine{
		runs:      make(map[string]*WorkflowRun),
		a2aClient: client,
	}
}

func (e *Engine) Start(req StartRequest) (*WorkflowRun, error) {
	e.mu.Lock()
	e.counter++
	run := &WorkflowRun{
		ID:           fmt.Sprintf("wf-%s-%04d", time.Now().Format("20060102"), e.counter),
		WorkflowType: req.WorkflowType,
		Status:       "running",
		Input:        req.Input,
		StartedAt:    time.Now(),
	}
	e.runs[run.ID] = run
	e.mu.Unlock()

	go e.execute(run)

	return run, nil
}

func (e *Engine) execute(run *WorkflowRun) {
	switch run.WorkflowType {
	case "patient_financial_risk":
		e.executePatientFinancialRisk(run)
	case "batch_classification":
		e.executeBatchClassification(run)
	case "compliance_sweep":
		e.executeComplianceSweep(run)
	default:
		e.executeGeneric(run)
	}
}

func (e *Engine) executePatientFinancialRisk(run *WorkflowRun) {
	patientText, _ := run.Input["text"].(string)
	if patientText == "" {
		patientText = "Patient record for risk assessment"
	}
	customerID, _ := run.Input["customer_id"].(string)
	if customerID == "" {
		customerID = "cust-unknown"
	}

	agents := e.a2aClient.ListAgents()
	var healthcareURL, finservURL string
	for _, ag := range agents {
		for _, s := range ag.Skills {
			if s.ID == "classify-document" {
				healthcareURL = ag.URL
			}
			if s.ID == "score-transaction" {
				finservURL = ag.URL
			}
		}
	}

	involved := []string{}

	// Step 1: Healthcare agent — classify the patient record
	if healthcareURL != "" {
		taskID := fmt.Sprintf("%s-hc", run.ID)
		result, latencyMs, err := e.a2aClient.SendTask(healthcareURL, taskID, patientText)

		step := WorkflowStep{
			Agent:       "Healthcare Agent",
			Skill:       "classify-document",
			InferenceMs: latencyMs,
			StartedAt:   time.Now(),
		}

		if err != nil {
			step.Status = "failed"
			step.Output = map[string]interface{}{"error": err.Error()}
			log.Printf("Workflow %s: healthcare step failed: %v", run.ID, err)
		} else {
			step.Status = "completed"
			step.Output = map[string]interface{}{"response": result.GetText(), "state": result.Status.State}
			involved = append(involved, "Healthcare Agent")
		}

		e.mu.Lock()
		run.Steps = append(run.Steps, step)
		e.totalRequests++
		e.totalLatencyMs += latencyMs
		e.mu.Unlock()
	}

	// Step 2: FinServ agent — assess risk
	if finservURL != "" {
		taskID := fmt.Sprintf("%s-fs", run.ID)
		prompt := fmt.Sprintf("Assess risk for customer %s based on patient data", customerID)
		result, latencyMs, err := e.a2aClient.SendTask(finservURL, taskID, prompt)

		step := WorkflowStep{
			Agent:       "Financial Services Agent",
			Skill:       "assess-risk",
			InferenceMs: latencyMs,
			StartedAt:   time.Now(),
		}

		if err != nil {
			step.Status = "failed"
			step.Output = map[string]interface{}{"error": err.Error()}
			log.Printf("Workflow %s: finserv step failed: %v", run.ID, err)
		} else {
			step.Status = "completed"
			step.Output = map[string]interface{}{"response": result.GetText(), "state": result.Status.State}
			involved = append(involved, "Financial Services Agent")
		}

		e.mu.Lock()
		run.Steps = append(run.Steps, step)
		e.totalRequests++
		e.totalLatencyMs += latencyMs
		e.mu.Unlock()
	}

	// Complete the workflow
	now := time.Now()
	e.mu.Lock()
	run.Status = "completed"
	run.CompletedAt = &now
	run.DurationMs = int(now.Sub(run.StartedAt).Milliseconds())
	run.AgentsInvolved = involved
	run.Output = map[string]interface{}{
		"steps_completed": len(run.Steps),
		"agents_called":   len(involved),
		"total_latency_ms": run.DurationMs,
	}

	allPassed := true
	for _, s := range run.Steps {
		if s.Status != "completed" {
			allPassed = false
			break
		}
	}
	if !allPassed {
		run.Status = "failed"
	}
	e.mu.Unlock()

	log.Printf("Workflow %s completed: %s (%dms, %d agents)", run.ID, run.Status, run.DurationMs, len(involved))
}

func (e *Engine) executeBatchClassification(run *WorkflowRun) {
	e.executeGeneric(run)
}

func (e *Engine) executeComplianceSweep(run *WorkflowRun) {
	e.executeGeneric(run)
}

func (e *Engine) executeGeneric(run *WorkflowRun) {
	agents := e.a2aClient.ListAgents()
	involved := []string{}

	for _, ag := range agents {
		taskID := fmt.Sprintf("%s-%s", run.ID, ag.Name)
		result, latencyMs, err := e.a2aClient.SendTask(ag.URL, taskID,
			fmt.Sprintf("Execute %s workflow", run.WorkflowType))

		step := WorkflowStep{
			Agent:       ag.Name,
			Skill:       run.WorkflowType,
			InferenceMs: latencyMs,
			StartedAt:   time.Now(),
		}

		if err != nil {
			step.Status = "failed"
			step.Output = map[string]interface{}{"error": err.Error()}
		} else {
			step.Status = "completed"
			step.Output = map[string]interface{}{"response": result.GetText()}
			involved = append(involved, ag.Name)
		}

		e.mu.Lock()
		run.Steps = append(run.Steps, step)
		e.totalRequests++
		e.totalLatencyMs += latencyMs
		e.mu.Unlock()
	}

	now := time.Now()
	e.mu.Lock()
	run.Status = "completed"
	run.CompletedAt = &now
	run.DurationMs = int(now.Sub(run.StartedAt).Milliseconds())
	run.AgentsInvolved = involved
	run.Output = map[string]interface{}{
		"steps_completed": len(run.Steps),
		"agents_called":   len(involved),
	}
	e.mu.Unlock()
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
	for _, ag := range agents {
		if ag.Status == "active" {
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

	avgLatency := 0.0
	if e.totalRequests > 0 {
		avgLatency = float64(e.totalLatencyMs) / float64(e.totalRequests)
	}

	return PlatformMetrics{
		Agents: AgentMetrics{
			Total:              len(agents),
			Active:             active,
			WorkflowsCompleted: completed,
			WorkflowsFailed:    failed,
		},
		Inference: InferenceMetrics{
			TotalRequests: e.totalRequests,
			AvgLatencyMs:  avgLatency,
			CpuRequests:   e.totalRequests,
		},
		Kafka: KafkaMetrics{},
	}
}
