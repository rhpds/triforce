package a2a

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type JsonRpcRequest struct {
	Jsonrpc string      `json:"jsonrpc"`
	ID      string      `json:"id"`
	Method  string      `json:"method"`
	Params  interface{} `json:"params"`
}

type TaskSendParams struct {
	ID      string  `json:"id"`
	Message Message `json:"message"`
}

type Message struct {
	MessageID string `json:"messageId"`
	Kind      string `json:"kind"`
	Role      string `json:"role"`
	Parts     []Part `json:"parts"`
}

type Part struct {
	Kind string `json:"kind"`
	Text string `json:"text,omitempty"`
}

type JsonRpcResponse struct {
	Jsonrpc string     `json:"jsonrpc"`
	ID      string     `json:"id"`
	Result  *TaskResult `json:"result,omitempty"`
	Error   *RpcError  `json:"error,omitempty"`
}

type TaskResult struct {
	ID        string     `json:"id"`
	ContextID string     `json:"contextId,omitempty"`
	Status    TaskStatus `json:"status"`
	Artifacts []Artifact `json:"artifacts,omitempty"`
	Kind      string     `json:"kind"`
}

type TaskStatus struct {
	State     string `json:"state"`
	Timestamp string `json:"timestamp,omitempty"`
}

type Artifact struct {
	ArtifactID string `json:"artifactId"`
	Parts      []Part `json:"parts"`
}

type RpcError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func (c *Client) SendTask(agentURL, taskID, text string) (*TaskResult, int, error) {
	req := JsonRpcRequest{
		Jsonrpc: "2.0",
		ID:      taskID,
		Method:  "tasks/send",
		Params: TaskSendParams{
			ID: taskID,
			Message: Message{
				MessageID: fmt.Sprintf("msg-%s", taskID),
				Kind:      "message",
				Role:      "user",
				Parts:     []Part{{Kind: "text", Text: text}},
			},
		},
	}

	body, err := json.Marshal(req)
	if err != nil {
		return nil, 0, fmt.Errorf("marshal request: %w", err)
	}

	start := time.Now()
	resp, err := c.http.Post(fmt.Sprintf("%s/a2a", agentURL), "application/json", bytes.NewReader(body))
	if err != nil {
		return nil, 0, fmt.Errorf("send task to %s: %w", agentURL, err)
	}
	defer resp.Body.Close()
	latencyMs := int(time.Since(start).Milliseconds())

	if resp.StatusCode != http.StatusOK {
		return nil, latencyMs, fmt.Errorf("agent returned %d", resp.StatusCode)
	}

	var rpcResp JsonRpcResponse
	if err := json.NewDecoder(resp.Body).Decode(&rpcResp); err != nil {
		return nil, latencyMs, fmt.Errorf("decode response: %w", err)
	}

	if rpcResp.Error != nil {
		return nil, latencyMs, fmt.Errorf("agent error %d: %s", rpcResp.Error.Code, rpcResp.Error.Message)
	}

	return rpcResp.Result, latencyMs, nil
}

func (r *TaskResult) GetText() string {
	for _, a := range r.Artifacts {
		for _, p := range a.Parts {
			if p.Kind == "text" && p.Text != "" {
				return p.Text
			}
		}
	}
	return ""
}
