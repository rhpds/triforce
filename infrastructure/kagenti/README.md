# Kagenti Deployment

## Prerequisites

```bash
# Install Kind (if not using existing OCP cluster)
brew install kind
# OR
go install sigs.k8s.io/kind@latest

# Verify
kind version
kubectl version --client
helm version
```

## Local Kind Cluster

```bash
# Create cluster
kind create cluster --name triforce --config kind-config.yaml

# Install Kagenti operator
kubectl apply -f https://github.com/kagenti/kagenti/releases/latest/download/install.yaml

# Wait for operator
kubectl wait --for=condition=ready pod -l app=kagenti-operator -n kagenti --timeout=120s

# Deploy Triforce agents
kubectl apply -f agent-runtimes.yaml
kubectl apply -f mcp-registrations.yaml

# Verify agent cards auto-discovered
kubectl get agentcards -n triforce
```

## Existing OpenShift Cluster

```bash
# Login
oc login --token=<token> --server=https://api.ocpv-infra01...

# Create namespace
oc new-project triforce

# Install Kagenti (requires cluster-admin for CRDs)
oc apply -f https://github.com/kagenti/kagenti/releases/latest/download/install.yaml

# Deploy agents
oc apply -f agent-runtimes.yaml
oc apply -f mcp-registrations.yaml
```
