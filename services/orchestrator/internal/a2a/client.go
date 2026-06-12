package a2a

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

type AgentCard struct {
	Name            string          `json:"name"`
	Description     string          `json:"description"`
	Version         string          `json:"version"`
	URL             string          `json:"url"`
	ProtocolVersion string          `json:"protocolVersion"`
	Capabilities    map[string]bool `json:"capabilities"`
	Skills          []Skill         `json:"skills"`
}

type Skill struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Tags        []string `json:"tags,omitempty"`
}

type DiscoveredAgent struct {
	Name          string    `json:"name"`
	URL           string    `json:"url"`
	Status        string    `json:"status"`
	LastHeartbeat time.Time `json:"last_heartbeat"`
	Skills        []Skill   `json:"skills"`
}

type Client struct {
	mu     sync.RWMutex
	agents map[string]*DiscoveredAgent
	http   *http.Client
}

func NewClient() *Client {
	return &Client{
		agents: make(map[string]*DiscoveredAgent),
		http:   &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *Client) Discover(baseURL string) (*DiscoveredAgent, error) {
	url := fmt.Sprintf("%s/.well-known/agent-card.json", baseURL)
	resp, err := c.http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("discovery failed for %s: %w", baseURL, err)
	}
	defer resp.Body.Close()

	var card AgentCard
	if err := json.NewDecoder(resp.Body).Decode(&card); err != nil {
		return nil, fmt.Errorf("invalid agent card from %s: %w", baseURL, err)
	}

	agent := &DiscoveredAgent{
		Name:          card.Name,
		URL:           baseURL,
		Status:        "active",
		LastHeartbeat: time.Now(),
		Skills:        card.Skills,
	}

	c.mu.Lock()
	c.agents[card.Name] = agent
	c.mu.Unlock()

	return agent, nil
}

func (c *Client) ListAgents() []DiscoveredAgent {
	c.mu.RLock()
	defer c.mu.RUnlock()

	agents := make([]DiscoveredAgent, 0, len(c.agents))
	for _, a := range c.agents {
		agents = append(agents, *a)
	}
	return agents
}

func (c *Client) GetAgent(name string) (*DiscoveredAgent, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	a, ok := c.agents[name]
	return a, ok
}
