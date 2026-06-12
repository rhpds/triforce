package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/triforce/orchestrator/internal/a2a"
	"github.com/triforce/orchestrator/internal/health"
	"github.com/triforce/orchestrator/internal/kafka"
	"github.com/triforce/orchestrator/internal/workflow"
)

func main() {
	port := os.Getenv("SERVICE_PORT")
	if port == "" {
		port = "8083"
	}

	healthChecker := health.New()
	a2aClient := a2a.NewClient()
	workflowEngine := workflow.NewEngine(a2aClient)
	eventRouter := kafka.NewEventRouter()

	// Discover agents on startup
	healthcareURL := os.Getenv("HEALTHCARE_AGENT_URL")
	if healthcareURL != "" {
		if agent, err := a2aClient.Discover(healthcareURL); err == nil {
			log.Printf("Discovered agent: %s at %s", agent.Name, agent.URL)
		}
	}
	finservURL := os.Getenv("FINSERV_AGENT_URL")
	if finservURL != "" {
		if agent, err := a2aClient.Discover(finservURL); err == nil {
			log.Printf("Discovered agent: %s at %s", agent.Name, agent.URL)
		}
	}

	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		resp := healthChecker.Check()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})

	mux.HandleFunc("/api/v1/agents", func(w http.ResponseWriter, r *http.Request) {
		agents := a2aClient.ListAgents()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"agents": agents})
	})

	mux.HandleFunc("/api/v1/workflows", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			var req workflow.StartRequest
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			resp, err := workflowEngine.Start(req)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusAccepted)
			json.NewEncoder(w).Encode(resp)
			return
		}
		workflows := workflowEngine.List()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(workflows)
	})

	mux.HandleFunc("/api/v1/workflows/", func(w http.ResponseWriter, r *http.Request) {
		id := strings.TrimPrefix(r.URL.Path, "/api/v1/workflows/")
		if id == "" {
			http.Error(w, "workflow ID required", http.StatusBadRequest)
			return
		}
		wf, ok := workflowEngine.Get(id)
		if !ok {
			http.Error(w, "workflow not found", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(wf)
	})

	mux.HandleFunc("/api/v1/metrics", func(w http.ResponseWriter, r *http.Request) {
		metrics := workflowEngine.Metrics()
		kafkaStats := eventRouter.Stats()
		metrics.Kafka.MessagesProduced = kafkaStats["messages_sent"]
		metrics.Kafka.MessagesConsumed = kafkaStats["messages_received"]
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(metrics)
	})

	mux.HandleFunc("/api/v1/synthetic/start", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		var cfg kafka.SyntheticConfig
		if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
			cfg = kafka.SyntheticConfig{Target: "both", RatePerSecond: 10, DurationSeconds: 60}
		}
		if err := eventRouter.StartSynthetic(cfg); err != nil {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		json.NewEncoder(w).Encode(map[string]string{"status": "running"})
	})

	mux.HandleFunc("/api/v1/synthetic/stop", func(w http.ResponseWriter, r *http.Request) {
		eventRouter.StopSynthetic()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "stopped"})
	})

	addr := fmt.Sprintf(":%s", port)
	log.Printf("Orchestrator starting on %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}
