#!/usr/bin/env bash
#
# Deploy Triforce as a Showroom lab experience via agnosticd-v2.
#
# Two-phase deployment:
#   Phase 1 (cluster): Keycloak, RHOAI, GitOps, NFD, operator bootstrap
#   Phase 2 (tenant):  Namespace, Triforce Helm, Showroom lab guide
#
# Usage:
#   ./scripts/deploy-showroom.sh [options]
#   ./scripts/deploy-showroom.sh                                  # full deploy (cluster + tenant)
#   ./scripts/deploy-showroom.sh --skip-cluster                   # tenant only (operators already installed)
#   ./scripts/deploy-showroom.sh --skip-tenant                    # cluster only
#   ./scripts/deploy-showroom.sh --skip-cluster --guid abc12      # re-deploy tenant with existing GUID
#   ./scripts/deploy-showroom.sh --variant secure                 # deploy Secure (TDX) variant
#   ./scripts/deploy-showroom.sh --destroy --guid abc12           # tear down
#   ./scripts/deploy-showroom.sh --dry-run                        # print commands without executing
#
# Options:
#   --api-url <url>     Cluster API URL (default: from oc session)
#   --token <token>     Cluster admin token (default: from oc session)
#   --guid <hex>        Use specific GUID (default: random 5-char hex)
#   --variant <name>    Demo variant: base|secure|virt|govern (default: base)
#   --skip-cluster      Skip Phase 1 (cluster workloads already installed)
#   --skip-tenant       Run only Phase 1 (cluster workloads)
#   --use-navigator     Use ansible-navigator instead of ansible-playbook
#   --destroy           Tear down a previous deploy by GUID
#   --dry-run           Print merged vars and commands without executing
#
# Prerequisites:
#   - oc logged in to the target cluster (or --api-url + --token)
#   - ansible-playbook (pip install ansible-core) or ansible-navigator
#   - ansible-galaxy (comes with ansible-core)
#   - python3 with PyYAML
#   - ~/agnosticd-v2 cloned from https://github.com/agnosticd/agnosticd-v2
#   - .env with LITELLM_API_KEY set
#
set -euo pipefail

# Ensure pip-installed ansible is on PATH (macOS default pip location)
for pybin in "$HOME/Library/Python/3.9/bin" "$HOME/.local/bin"; do
    [[ -d "$pybin" ]] && export PATH="$pybin:$PATH"
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TRIFORCE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
AGD_DIR="${AGD_DIR:-$HOME/agnosticd-v2}"
AGV_DIR="$TRIFORCE_DIR/agnosticv"

API_URL=""
TOKEN=""
GUID=""
VARIANT="base"
SKIP_CLUSTER=false
SKIP_TENANT=false
USE_NAVIGATOR=false
DESTROY=false
DRY_RUN=false

# ---------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------
while [[ $# -gt 0 ]]; do
    case "$1" in
        --api-url)      API_URL="$2"; shift 2 ;;
        --token)        TOKEN="$2"; shift 2 ;;
        --guid)         GUID="$2"; shift 2 ;;
        --variant)      VARIANT="$2"; shift 2 ;;
        --skip-cluster) SKIP_CLUSTER=true; shift ;;
        --skip-tenant)  SKIP_TENANT=true; shift ;;
        --use-navigator) USE_NAVIGATOR=true; shift ;;
        --destroy)      DESTROY=true; shift ;;
        --dry-run)      DRY_RUN=true; shift ;;
        --help|-h)
            head -30 "$0" | grep "^#" | sed 's/^# \?//'
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# ---------------------------------------------------------------
# Prerequisites check
# ---------------------------------------------------------------
MISSING=()
command -v oc &>/dev/null        || MISSING+=("oc (openshift CLI)")
command -v python3 &>/dev/null   || MISSING+=("python3")
command -v ansible-galaxy &>/dev/null || MISSING+=("ansible-galaxy (pip install ansible-core)")

if $USE_NAVIGATOR; then
    command -v ansible-navigator &>/dev/null || MISSING+=("ansible-navigator (pip install ansible-navigator)")
else
    command -v ansible-playbook &>/dev/null  || MISSING+=("ansible-playbook (pip install ansible-core)")
fi

python3 -c "import yaml" 2>/dev/null || MISSING+=("PyYAML (pip install pyyaml)")

if [[ ! -d "$AGD_DIR" ]]; then
    MISSING+=("~/agnosticd-v2 — git clone https://github.com/agnosticd/agnosticd-v2 ~/agnosticd-v2")
fi

if [[ ${#MISSING[@]} -gt 0 ]]; then
    echo "ERROR: Missing prerequisites:"
    for m in "${MISSING[@]}"; do
        echo "  - $m"
    done
    exit 1
fi

# ---------------------------------------------------------------
# Environment — load LiteLLM key from .env
# ---------------------------------------------------------------
LITELLM_API_KEY="${LITELLM_API_KEY:-}"
LITELLM_API_BASE="${LITELLM_API_BASE:-}"

ENV_FILE="$TRIFORCE_DIR/.env"
if [[ -f "$ENV_FILE" ]]; then
    LITELLM_API_KEY="${LITELLM_API_KEY:-$(grep '^LITELLM_API_KEY=' "$ENV_FILE" | cut -d= -f2-)}"
    LITELLM_API_BASE="${LITELLM_API_BASE:-$(grep '^LITELLM_API_BASE=' "$ENV_FILE" | cut -d= -f2-)}"
fi
LITELLM_API_BASE="${LITELLM_API_BASE:-https://maas-rhdp.apps.maas.redhatworkshops.io}"

if ! $SKIP_TENANT && ! $DESTROY && [[ -z "$LITELLM_API_KEY" ]]; then
    echo "ERROR: LITELLM_API_KEY not set. Add it to .env or export it."
    exit 1
fi

# ---------------------------------------------------------------
# Cluster connection
# ---------------------------------------------------------------
if [[ -z "$API_URL" ]]; then
    API_URL=$(oc whoami --show-server 2>/dev/null) || {
        echo "ERROR: Not logged in to a cluster. Run 'oc login' or pass --api-url and --token."
        exit 1
    }
fi
if [[ -z "$TOKEN" ]]; then
    TOKEN=$(oc whoami -t 2>/dev/null) || {
        echo "ERROR: Cannot get token. Run 'oc login' or pass --token."
        exit 1
    }
fi

INGRESS_DOMAIN=$(oc get ingresses.config/cluster -o jsonpath='{.spec.domain}' 2>/dev/null) || {
    echo "ERROR: Cannot read cluster ingress domain. Verify cluster access."
    exit 1
}
CONSOLE_URL="https://console-openshift-console.${INGRESS_DOMAIN}"

# ---------------------------------------------------------------
# GUID and derived values
# ---------------------------------------------------------------
GUID="${GUID:-$(head -c4 /dev/urandom | xxd -p | cut -c1-5)}"
USERNAME="user-${GUID}"
NAMESPACE="${USERNAME}-triforce"
OUTPUT_DIR="/tmp/agnosticd-output-${GUID}"
mkdir -p "$OUTPUT_DIR"

# Password — reuse if previously generated, otherwise create
PW_FILE="$OUTPUT_DIR/common_password"
if [[ -f "$PW_FILE" ]]; then
    COMMON_PASSWORD=$(cat "$PW_FILE")
else
    COMMON_PASSWORD=$(python3 -c "import secrets, string; print(''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12)))")
    printf '%s' "$COMMON_PASSWORD" > "$PW_FILE"
    chmod 600 "$PW_FILE"
fi

# ---------------------------------------------------------------
# Variant selection
# ---------------------------------------------------------------
case "$VARIANT" in
    base)
        TENANT_DIR="$AGV_DIR"
        ;;
    secure)
        TENANT_DIR="$AGV_DIR/ai-qs-triforce-secure-tenant"
        ;;
    virt)
        TENANT_DIR="$AGV_DIR/ai-qs-triforce-virt-tenant"
        ;;
    govern)
        TENANT_DIR="$AGV_DIR/ai-qs-triforce-govern-tenant"
        ;;
    *)
        echo "ERROR: Unknown variant '$VARIANT'. Choose: base, secure, virt, govern"
        exit 1
        ;;
esac

if [[ ! -f "$TENANT_DIR/common.yaml" ]]; then
    echo "ERROR: Tenant config not found at $TENANT_DIR/common.yaml"
    exit 1
fi

# ---------------------------------------------------------------
# Banner
# ---------------------------------------------------------------
echo "=== Triforce Showroom Deploy ==="
echo "  Cluster:    $API_URL"
echo "  Ingress:    $INGRESS_DOMAIN"
echo "  GUID:       $GUID"
echo "  User:       $USERNAME"
echo "  Namespace:  $NAMESPACE"
echo "  Variant:    $VARIANT"
echo "  LiteLLM:    ${LITELLM_API_BASE}"
echo "  agnosticd:  $AGD_DIR"
if $SKIP_CLUSTER; then echo "  Phase 1:    SKIPPED (--skip-cluster)"; fi
if $SKIP_TENANT;  then echo "  Phase 2:    SKIPPED (--skip-tenant)"; fi
if $DESTROY;      then echo "  Mode:       DESTROY"; fi
if $DRY_RUN;      then echo "  Mode:       DRY RUN"; fi
echo ""

# ---------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------

merge_agnosticv() {
    local ci_dir="$1"
    local output_file="$2"
    local common_file="$ci_dir/common.yaml"
    local dev_file="$ci_dir/dev.yaml"

    {
        echo "---"
        for src in "$common_file" "$dev_file"; do
            [[ -f "$src" ]] || continue
            while IFS= read -r line; do
                # Strip #include directives (sandbox/Babylon only)
                [[ "$line" =~ ^#include ]] && continue
                [[ "$line" == "---" ]] && continue
                echo "$line"
            done < "$src"
        done
    } > "$output_file"

    echo "  Merged:     $output_file ($(wc -l < "$output_file" | tr -d ' ') lines)"
}

install_collections() {
    local merged_file="$1"
    echo ""
    echo "--- Installing Ansible collections ---"

    python3 - "$merged_file" <<'PYREQS'
import sys, yaml, re
with open(sys.argv[1]) as f:
    data = yaml.safe_load(f)
rc = data.get("requirements_content", {})
if rc and rc.get("collections"):
    # Resolve {{ tag }} and other simple Jinja refs from the same file
    for col in rc["collections"]:
        for key, val in col.items():
            if isinstance(val, str) and "{{" in val:
                resolved = re.sub(
                    r"\{\{\s*(\w+)\s*\}\}",
                    lambda m: str(data.get(m.group(1), m.group(0))),
                    val,
                )
                col[key] = resolved
    reqs = {"collections": rc["collections"]}
    with open("/tmp/triforce-requirements.yml", "w") as f:
        yaml.dump(reqs, f)
    print("  Generated /tmp/triforce-requirements.yml")
PYREQS

    if [[ -f /tmp/triforce-requirements.yml ]]; then
        ansible-galaxy collection install -r /tmp/triforce-requirements.yml \
            -p "$HOME/.ansible/collections" --force 2>&1 | grep -E 'Installing|was installed|Starting' || true
        rm -f /tmp/triforce-requirements.yml
    fi
}

run_ansible() {
    local merged_file="$1"
    shift
    local extra_args=("$@")

    if $DRY_RUN; then
        echo ""
        echo "--- DRY RUN: would execute ---"
        if $USE_NAVIGATOR; then
            echo "ansible-navigator run $AGD_DIR/ansible/main.yml --mode stdout --ee false \\"
        else
            echo "ansible-playbook $AGD_DIR/ansible/main.yml \\"
        fi
        echo "    -e @$merged_file \\"
        for arg in "${extra_args[@]}"; do
            echo "    $arg \\"
        done
        echo "    -v"
        echo ""
        echo "--- Merged vars ---"
        cat "$merged_file"
        return 0
    fi

    local log_file="/tmp/triforce-deploy-${GUID}.log"

    export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES
    export PYTHONUNBUFFERED=1
    export ANSIBLE_COLLECTIONS_PATH="$HOME/.ansible/collections"
    export ANSIBLE_ROLES_PATH="$AGD_DIR/ansible/roles:${ANSIBLE_ROLES_PATH:-}"

    if $USE_NAVIGATOR; then
        ansible-navigator run "$AGD_DIR/ansible/main.yml" \
            --mode stdout \
            --ee false \
            -e @"$merged_file" \
            "${extra_args[@]}" \
            -v 2>&1 | tee "$log_file"
    else
        ansible-playbook "$AGD_DIR/ansible/main.yml" \
            -e @"$merged_file" \
            "${extra_args[@]}" \
            -v 2>&1 | tee "$log_file"
    fi

    local status=${PIPESTATUS[0]}
    if [[ $status -ne 0 ]]; then
        echo ""
        echo "ERROR: Ansible failed (exit $status). Log: $log_file"
        return $status
    fi
}

# ---------------------------------------------------------------
# DESTROY mode
# ---------------------------------------------------------------
if $DESTROY; then
    echo "=== Destroying Triforce deploy: GUID=$GUID ==="

    if $DRY_RUN; then
        echo "Would delete:"
        echo "  oc delete namespace $NAMESPACE"
        echo "  Showroom pod in $NAMESPACE"
        exit 0
    fi

    echo "Deleting namespace $NAMESPACE..."
    oc delete namespace "$NAMESPACE" --ignore-not-found --wait=true --timeout=120s

    echo ""
    echo "=== DESTROYED ==="
    echo "  GUID:      $GUID"
    echo "  Namespace: $NAMESPACE (deleted)"
    exit 0
fi

# ---------------------------------------------------------------
# Phase 1: Cluster workloads
# ---------------------------------------------------------------
if ! $SKIP_CLUSTER; then
    echo "============================================"
    echo "  Phase 1: Cluster Workloads"
    echo "============================================"
    echo ""

    CLUSTER_DIR="$AGV_DIR/ai-qs-triforce-cluster"
    MERGED_CLUSTER="/tmp/triforce-cluster-${GUID}.yaml"

    echo "--- Merging cluster config ---"
    merge_agnosticv "$CLUSTER_DIR" "$MERGED_CLUSTER"

    install_collections "$MERGED_CLUSTER"

    echo ""
    echo "--- Running cluster workloads ---"
    run_ansible "$MERGED_CLUSTER" \
        -e "config=openshift-workloads" \
        -e "cloud_provider=none" \
        -e "openshift_api_url=$API_URL" \
        -e "openshift_cluster_admin_token=$TOKEN" \
        -e "guid=$GUID" \
        -e "output_dir=$OUTPUT_DIR" \
        -e "num_users=0" \
        -e "ocp4_workload_gitops_bootstrap_health_ignore=true"

    rm -f "$MERGED_CLUSTER"

    if ! $DRY_RUN; then
        echo ""
        echo "--- Waiting for operators to settle ---"
        echo "  Checking GitOps..."
        oc wait --for=condition=Available deployment -l app.kubernetes.io/part-of=argocd \
            -n openshift-gitops --timeout=300s 2>/dev/null || echo "  (GitOps not found — may still be installing)"
        echo "  Checking Keycloak..."
        oc wait --for=condition=Available deployment -l app=keycloak \
            -n keycloak --timeout=300s 2>/dev/null || echo "  (Keycloak not found — may still be installing)"
        echo "  Phase 1 complete."
    fi

    echo ""
fi

# ---------------------------------------------------------------
# Phase 2: Tenant workloads
# ---------------------------------------------------------------
if ! $SKIP_TENANT; then
    echo "============================================"
    echo "  Phase 2: Tenant Workloads ($VARIANT)"
    echo "============================================"
    echo ""

    MERGED_TENANT="/tmp/triforce-tenant-${GUID}.yaml"

    echo "--- Merging tenant config ---"
    merge_agnosticv "$TENANT_DIR" "$MERGED_TENANT"

    # Remove litellm_virtual_keys workload (we inject user's own key)
    python3 - "$MERGED_TENANT" <<'PYSTRIP'
import sys, yaml
with open(sys.argv[1]) as f:
    data = yaml.safe_load(f)
data['workloads'] = [w for w in data.get('workloads', [])
                     if 'litellm_virtual_keys' not in w]
# Also remove the litellm_virtual_keys collection requirement
rc = data.get('requirements_content', {})
if rc and rc.get('collections'):
    rc['collections'] = [c for c in rc['collections']
                         if 'litellm_virtual_keys' not in str(c.get('name', ''))]
with open(sys.argv[1], 'w') as f:
    yaml.dump(data, f, default_flow_style=False)
PYSTRIP
    echo "  Stripped litellm_virtual_keys workload + collection"

    install_collections "$MERGED_TENANT"

    echo ""
    echo "--- Running tenant workloads ---"
    run_ansible "$MERGED_TENANT" \
        -e "config=namespace" \
        -e "cloud_provider=none" \
        -e "guid=$GUID" \
        -e "output_dir=$OUTPUT_DIR" \
        -e "openshift_api_url=$API_URL" \
        -e "openshift_cluster_admin_token=$TOKEN" \
        -e "cluster_admin_agnosticd_sa_token=$TOKEN" \
        -e "sandbox_openshift_api_url=$API_URL" \
        -e "sandbox_openshift_ingress_domain=$INGRESS_DOMAIN" \
        -e "sandbox_openshift_console_url=$CONSOLE_URL" \
        -e "ocp4_workload_litellm_virtual_keys_key=$LITELLM_API_KEY" \
        -e "common_password=$COMMON_PASSWORD"

    rm -f "$MERGED_TENANT"

    if ! $DRY_RUN; then
        echo ""
        echo "--- Waiting for Triforce pods ---"
        for deploy in healthcare-agent finserv-agent orchestrator mcp-gateway semantic-router frontend postgres redpanda; do
            echo -n "  $deploy: "
            if oc rollout status "deployment/$deploy" -n "$NAMESPACE" --timeout=120s 2>/dev/null; then
                echo "ready"
            else
                echo "NOT READY (may still be starting)"
            fi
        done
    fi

    echo ""
fi

# ---------------------------------------------------------------
# Success report
# ---------------------------------------------------------------
if ! $DRY_RUN; then
    echo "============================================"
    echo "  TRIFORCE DEPLOYED"
    echo "============================================"
    echo ""
    echo "  GUID:       $GUID"
    echo "  User:       $USERNAME"
    echo "  Password:   $COMMON_PASSWORD"
    echo "  Namespace:  $NAMESPACE"
    echo "  Variant:    $VARIANT"
    echo ""
    echo "  URLs:"
    echo "    Showroom:   https://showroom-${NAMESPACE}.${INGRESS_DOMAIN}"
    echo "    Frontend:   https://triforce-${NAMESPACE}.${INGRESS_DOMAIN}"
    echo "    Healthcare: https://healthcare-agent-${NAMESPACE}.${INGRESS_DOMAIN}"
    echo "    FinServ:    https://finserv-agent-${NAMESPACE}.${INGRESS_DOMAIN}"
    echo "    Console:    $CONSOLE_URL"
    echo ""
    echo "  oc login:   oc login -u $USERNAME -p $COMMON_PASSWORD $API_URL"
    echo ""
    echo "  Destroy:    $0 --destroy --guid $GUID"
    echo ""
fi
