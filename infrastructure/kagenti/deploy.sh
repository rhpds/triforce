#!/usr/bin/env bash
set -euo pipefail

# Triforce — Deploy to Kind cluster with Kagenti
# Usage: ./deploy.sh [kind|ocp]

MODE="${1:-kind}"
NAMESPACE="triforce"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=============================================="
echo "  Triforce Deployment — ${MODE}"
echo "=============================================="

if [ "$MODE" = "kind" ]; then
    echo ""
    echo "=== Creating Kind cluster ==="
    kind create cluster --config "$SCRIPT_DIR/kind-config.yaml" 2>/dev/null || echo "Cluster already exists"
    kubectl cluster-info --context kind-triforce

    echo ""
    echo "=== Loading container images into Kind ==="
    kind load docker-image triforce/healthcare-agent:latest --name triforce
    kind load docker-image triforce/finserv-agent:latest --name triforce
    kind load docker-image triforce/orchestrator:latest --name triforce
fi

echo ""
echo "=== Installing Kagenti operator ==="
kubectl apply -f https://github.com/kagenti/kagenti/releases/latest/download/install.yaml 2>/dev/null || echo "Kagenti CRDs may not be available yet — using stubs"
kubectl wait --for=condition=ready pod -l app=kagenti-operator -n kagenti --timeout=60s 2>/dev/null || echo "Kagenti operator not ready — continuing with agent deployment"

echo ""
echo "=== Creating namespace and secrets ==="
kubectl create namespace "$NAMESPACE" 2>/dev/null || true
if [ -f "$SCRIPT_DIR/secrets.yaml" ]; then
    kubectl apply -f "$SCRIPT_DIR/secrets.yaml"
else
    echo "WARNING: secrets.yaml not found. Copy secrets.yaml.example and fill in values."
    echo "  cp $SCRIPT_DIR/secrets.yaml.example $SCRIPT_DIR/secrets.yaml"
    exit 1
fi

echo ""
echo "=== Deploying agent runtimes ==="
kubectl apply -f "$SCRIPT_DIR/agent-runtimes.yaml"

echo ""
echo "=== Deploying MCP registrations ==="
kubectl apply -f "$SCRIPT_DIR/mcp-registrations.yaml"

echo ""
echo "=== Waiting for pods ==="
kubectl wait --for=condition=ready pod -l app=healthcare-agent -n "$NAMESPACE" --timeout=120s
kubectl wait --for=condition=ready pod -l app=finserv-agent -n "$NAMESPACE" --timeout=180s
kubectl wait --for=condition=ready pod -l app=orchestrator -n "$NAMESPACE" --timeout=60s

echo ""
echo "=== Agent Discovery ==="
kubectl get agentcards -n "$NAMESPACE" 2>/dev/null || echo "AgentCard CRDs not available (Kagenti not installed)"

echo ""
echo "=== Pod Status ==="
kubectl get pods -n "$NAMESPACE" -o wide

echo ""
echo "=== Services ==="
kubectl get svc -n "$NAMESPACE"

echo ""
echo "=============================================="
echo "  Deployment complete!"
echo ""
echo "  Healthcare: kubectl port-forward -n $NAMESPACE svc/healthcare-agent 8081:8081"
echo "  FinServ:    kubectl port-forward -n $NAMESPACE svc/finserv-agent 8082:8082"
echo "  Orchestrator: kubectl port-forward -n $NAMESPACE svc/orchestrator 8083:8083"
echo "=============================================="
