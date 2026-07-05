"""Static coverage checks for the project-wide benchmark rubric."""

from pathlib import Path

import yaml


REPO_ROOT = Path(__file__).parent.parent
RUBRIC_PATH = REPO_ROOT / "tests" / "benchmark_rubric.yaml"
MODULES_DIR = REPO_ROOT / "modules"


def load_rubric():
    return yaml.safe_load(RUBRIC_PATH.read_text())["benchmark_rubric"]


def module_manifests():
    manifests = {}
    for manifest in MODULES_DIR.glob("*/module.yaml"):
        data = yaml.safe_load(manifest.read_text())
        manifests[data["name"]] = data["status"]
    return manifests


def test_module_inventory_matches_manifests():
    rubric = load_rubric()
    inventory = {m["name"]: m["status"] for m in rubric["module_inventory"]}
    assert inventory == module_manifests()


def test_every_inventory_entry_has_rubric_key():
    rubric = load_rubric()
    module_keys = set(rubric["modules"])
    missing = [
        m["rubric_key"]
        for m in rubric["module_inventory"]
        if m["rubric_key"] not in module_keys
    ]
    assert not missing, f"Missing benchmark module entries: {missing}"


def test_project_gates_cover_all_major_surfaces():
    gates = load_rubric()["project_gates"]
    for gate in [
        "contracts",
        "healthcare_agent",
        "semantic_router",
        "orchestrator",
        "frontend",
        "helm",
        "live_benchmarks",
    ]:
        assert gate in gates


def test_oberon_acceptance_lists_speculative_alias():
    oberon = load_rubric()["measured_baselines"]["oberon_local"]
    aliases = oberon["model_aliases"]
    assert len(aliases) == 10
    assert "granite-2b-cpu-speculative" in aliases
    assert oberon["claim_thresholds"]["speculative_speedup"] == 1.5


def test_public_claim_policy_requires_target_measurement():
    policy = load_rubric()["verification_policy"]
    assert "target environment" in policy["verified_means"].lower()
    rules = " ".join(policy["public_claim_rules"]).lower()
    assert "configured and measured" in rules
    assert "satisfies" in rules
