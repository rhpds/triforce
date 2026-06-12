package a2a

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestNewClient(t *testing.T) {
	c := NewClient()
	if c == nil {
		t.Fatal("NewClient returned nil")
	}
	agents := c.ListAgents()
	if len(agents) != 0 {
		t.Fatalf("expected 0 agents, got %d", len(agents))
	}
}

func TestDiscover(t *testing.T) {
	card := AgentCard{
		Name:            "Test Agent",
		Description:     "A test agent",
		Version:         "0.1.0",
		URL:             "http://localhost:9999",
		ProtocolVersion: "0.2.6",
		Skills: []Skill{
			{ID: "test-skill", Name: "Test", Description: "A test skill"},
		},
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/.well-known/agent-card.json" {
			http.NotFound(w, r)
			return
		}
		json.NewEncoder(w).Encode(card)
	}))
	defer srv.Close()

	c := NewClient()
	agent, err := c.Discover(srv.URL)
	if err != nil {
		t.Fatalf("Discover failed: %v", err)
	}
	if agent.Name != "Test Agent" {
		t.Errorf("expected name 'Test Agent', got '%s'", agent.Name)
	}
	if agent.Status != "active" {
		t.Errorf("expected status 'active', got '%s'", agent.Status)
	}
	if len(agent.Skills) != 1 {
		t.Errorf("expected 1 skill, got %d", len(agent.Skills))
	}

	agents := c.ListAgents()
	if len(agents) != 1 {
		t.Fatalf("expected 1 agent, got %d", len(agents))
	}
}

func TestDiscoverInvalidURL(t *testing.T) {
	c := NewClient()
	_, err := c.Discover("http://localhost:1")
	if err == nil {
		t.Fatal("expected error for invalid URL")
	}
}

func TestGetAgent(t *testing.T) {
	c := NewClient()
	_, ok := c.GetAgent("nonexistent")
	if ok {
		t.Fatal("expected false for nonexistent agent")
	}
}
