# Triforce Secure — Confidential Containers Configuration

## Prerequisites

1. Intel TDX enabled in BIOS on worker nodes
2. OpenShift Sandboxed Containers 1.12 operator installed
3. Red Hat build of Trustee 1.1 operator installed
4. Node Feature Discovery operator installed

## Setup

```bash
# Apply Trustee configuration
oc apply -f trustee-config.yaml

# Add secrets (fill in real values)
oc apply -f secret-policy.yaml

# Deploy agents with CoCo runtime
helm install triforce infrastructure/helm/ \
  --set confidential.enabled=true \
  --set litellm.apiBase=https://maas-rhdp.apps.maas.redhatworkshops.io \
  --set litellm.apiKey=YOUR_KEY \
  --set postgres.password=YOUR_PW

# Verify TDX is active inside pods
oc exec deploy/healthcare-agent -- dmesg | grep tdx
```

## How It Works

1. Agent pod starts with `runtimeClassName: kata-cc`
2. Kata creates a VM with TDX memory encryption
3. On startup, agent calls Trustee KBS for the API key
4. Trustee attests the TDX hardware before releasing the secret
5. Agent uses the attested key for inference
6. All data in memory is hardware-encrypted
