package workflow

import (
	"testing"

	"github.com/triforce/orchestrator/internal/a2a"
)

func TestNewEngine(t *testing.T) {
	client := a2a.NewClient()
	e := NewEngine(client)
	if e == nil {
		t.Fatal("NewEngine returned nil")
	}
}

func TestStartWorkflow(t *testing.T) {
	client := a2a.NewClient()
	e := NewEngine(client)

	run, err := e.Start(StartRequest{
		WorkflowType: "patient_financial_risk",
		Input:        map[string]interface{}{"patient_id": "123"},
	})
	if err != nil {
		t.Fatalf("Start failed: %v", err)
	}
	if run.ID == "" {
		t.Error("workflow ID is empty")
	}
	if run.Status != "running" {
		t.Errorf("expected status 'running', got '%s'", run.Status)
	}
	if run.WorkflowType != "patient_financial_risk" {
		t.Errorf("expected type 'patient_financial_risk', got '%s'", run.WorkflowType)
	}
}

func TestListWorkflows(t *testing.T) {
	client := a2a.NewClient()
	e := NewEngine(client)

	runs := e.List()
	if len(runs) != 0 {
		t.Fatalf("expected 0 runs, got %d", len(runs))
	}

	e.Start(StartRequest{WorkflowType: "test", Input: map[string]interface{}{}})
	e.Start(StartRequest{WorkflowType: "test2", Input: map[string]interface{}{}})

	runs = e.List()
	if len(runs) != 2 {
		t.Fatalf("expected 2 runs, got %d", len(runs))
	}
}

func TestMetrics(t *testing.T) {
	client := a2a.NewClient()
	e := NewEngine(client)

	metrics := e.Metrics()
	if metrics.Agents.Total != 0 {
		t.Errorf("expected 0 agents, got %d", metrics.Agents.Total)
	}
	if metrics.Agents.WorkflowsCompleted != 0 {
		t.Errorf("expected 0 completed, got %d", metrics.Agents.WorkflowsCompleted)
	}
}
