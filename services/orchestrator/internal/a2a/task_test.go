package a2a

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestSendTask(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/a2a" {
			http.NotFound(w, r)
			return
		}

		var req JsonRpcRequest
		json.NewDecoder(r.Body).Decode(&req)

		resp := JsonRpcResponse{
			Jsonrpc: "2.0",
			ID:      req.ID,
			Result: &TaskResult{
				ID:     "task-1",
				Status: TaskStatus{State: "completed"},
				Artifacts: []Artifact{
					{ArtifactID: "a-1", Parts: []Part{{Kind: "text", Text: "result text"}}},
				},
				Kind: "task",
			},
		}
		json.NewEncoder(w).Encode(resp)
	}))
	defer srv.Close()

	c := NewClient()
	result, latencyMs, err := c.SendTask(srv.URL, "task-1", "test prompt")
	if err != nil {
		t.Fatalf("SendTask failed: %v", err)
	}
	if result.Status.State != "completed" {
		t.Errorf("expected completed, got %s", result.Status.State)
	}
	if result.GetText() != "result text" {
		t.Errorf("expected 'result text', got '%s'", result.GetText())
	}
	if latencyMs < 0 {
		t.Error("expected non-negative latency")
	}
}

func TestSendTaskError(t *testing.T) {
	c := NewClient()
	_, _, err := c.SendTask("http://localhost:1", "task-err", "test")
	if err == nil {
		t.Fatal("expected error for unreachable server")
	}
}

func TestGetText(t *testing.T) {
	result := &TaskResult{
		Artifacts: []Artifact{
			{Parts: []Part{{Kind: "text", Text: "hello world"}}},
		},
	}
	if result.GetText() != "hello world" {
		t.Errorf("expected 'hello world', got '%s'", result.GetText())
	}

	empty := &TaskResult{}
	if empty.GetText() != "" {
		t.Error("expected empty string for no artifacts")
	}
}
