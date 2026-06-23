"""Stage 8: Module validation — manifests, Helm flags, composition."""

import subprocess
import yaml
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
MODULES_DIR = REPO_ROOT / "modules"
HELM_DIR = REPO_ROOT / "infrastructure" / "helm"
HELM_TEST_ARGS = ["--set", "postgres.password=test", "--set", "litellm.apiKey=test", "--set", "litellm.apiBase=http://test"]


class TestModuleManifests:
    """stage_8: All module.yaml manifests are valid and complete."""

    def test_all_modules_have_manifest(self):
        modules = [d for d in MODULES_DIR.iterdir() if d.is_dir() and (d / "module.yaml").exists()]
        assert len(modules) >= 4, f"Expected at least 4 modules, found {len(modules)}"

    def test_manifests_parse(self):
        for mod_dir in MODULES_DIR.iterdir():
            manifest = mod_dir / "module.yaml"
            if not manifest.exists():
                continue
            data = yaml.safe_load(manifest.read_text())
            assert "name" in data, f"{mod_dir.name}/module.yaml missing 'name'"
            assert "helm" in data, f"{mod_dir.name}/module.yaml missing 'helm'"
            assert "flag" in data["helm"], f"{mod_dir.name}/module.yaml missing 'helm.flag'"

    def test_manifests_have_required_fields(self):
        required = ["name", "displayName", "description", "status", "helm", "showroom"]
        for mod_dir in MODULES_DIR.iterdir():
            manifest = mod_dir / "module.yaml"
            if not manifest.exists():
                continue
            data = yaml.safe_load(manifest.read_text())
            for field in required:
                assert field in data, f"{mod_dir.name}/module.yaml missing '{field}'"


class TestModuleHelmFlags:
    """stage_8: Module Helm flags default to false and render cleanly."""

    def test_flags_default_false(self):
        values = yaml.safe_load((HELM_DIR / "values.yaml").read_text())
        modules = values.get("modules", {})
        for mod_name, mod_config in modules.items():
            assert mod_config.get("enabled") is False, (
                f"modules.{mod_name}.enabled should default to false"
            )

    def test_helm_renders_all_disabled(self):
        result = subprocess.run(
            ["helm", "template", str(HELM_DIR)] + HELM_TEST_ARGS,
            capture_output=True, text=True,
        )
        assert result.returncode == 0, f"Helm template failed with all modules disabled: {result.stderr}"

    def test_helm_renders_all_enabled(self):
        result = subprocess.run(
            ["helm", "template", str(HELM_DIR)] + HELM_TEST_ARGS + [
             "--set", "modules.benchmarking.enabled=true",
             "--set", "modules.speculative.enabled=true",
             "--set", "modules.heterogeneous.enabled=true",
             "--set", "modules.fusion.enabled=true"],
            capture_output=True, text=True,
        )
        assert result.returncode == 0, f"Helm template failed with all modules enabled: {result.stderr}"

    def test_disabled_modules_no_env_vars(self):
        result = subprocess.run(
            ["helm", "template", str(HELM_DIR)] + HELM_TEST_ARGS,
            capture_output=True, text=True,
        )
        assert "GPU_API_BASE" not in result.stdout, "GPU_API_BASE should not appear when heterogeneous disabled"
        assert "FUSION_PANEL_MODELS" not in result.stdout, "FUSION_PANEL_MODELS should not appear when fusion disabled"
        assert "SPECULATIVE_DRAFT_MODEL" not in result.stdout, "SPECULATIVE_DRAFT_MODEL should not appear when speculative disabled"

    def test_enabled_module_injects_env_vars(self):
        result = subprocess.run(
            ["helm", "template", str(HELM_DIR)] + HELM_TEST_ARGS + [
             "--set", "modules.fusion.enabled=true"],
            capture_output=True, text=True,
        )
        assert "FUSION_PANEL_MODELS" in result.stdout, "FUSION_PANEL_MODELS should appear when fusion enabled"
        assert "FUSION_JUDGE_MODEL" in result.stdout, "FUSION_JUDGE_MODEL should appear when fusion enabled"


class TestModuleContent:
    """stage_8: Each module has showroom content."""

    def test_modules_have_explore_pages(self):
        for mod_dir in MODULES_DIR.iterdir():
            manifest = mod_dir / "module.yaml"
            if not manifest.exists():
                continue
            data = yaml.safe_load(manifest.read_text())
            content_dir = data.get("showroom", {}).get("content_dir", "")
            if content_dir:
                pages_dir = REPO_ROOT / content_dir / "modules" / "ROOT" / "pages"
                adoc_files = list(pages_dir.glob("*.adoc")) if pages_dir.exists() else []
                if data.get("status") == "building":
                    assert len(adoc_files) >= 1, (
                        f"{mod_dir.name} has status=building but no explore page in {pages_dir}"
                    )


class TestModuleComposition:
    """stage_8: Modules compose without conflicts."""

    def test_unique_helm_flags(self):
        flags = []
        for mod_dir in MODULES_DIR.iterdir():
            manifest = mod_dir / "module.yaml"
            if not manifest.exists():
                continue
            data = yaml.safe_load(manifest.read_text())
            flag = data.get("helm", {}).get("flag", "")
            assert flag not in flags, f"Duplicate Helm flag: {flag}"
            flags.append(flag)

    def test_modules_enabled_env_var_format(self):
        result = subprocess.run(
            ["helm", "template", str(HELM_DIR)] + HELM_TEST_ARGS + [
             "--set", "modules.benchmarking.enabled=true",
             "--set", "modules.fusion.enabled=true"],
            capture_output=True, text=True,
        )
        assert "MODULES_ENABLED" in result.stdout, "MODULES_ENABLED env var should be set"
