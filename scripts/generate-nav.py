#!/usr/bin/env python3
"""Generate Antora nav.adoc from module manifests.

Reads enabled modules (from env var or all) and builds the nav with
required pages + selected explore modules grouped by category.

Usage:
  python3 scripts/generate-nav.py                    # all modules
  MODULES_ENABLED=benchmarking,fusion python3 ...    # selected modules
  python3 scripts/generate-nav.py --modules benchmarking,fusion
"""

import os
import sys
import yaml
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
MODULES_DIR = REPO_ROOT / "modules"

GROUP_ORDER = [
    ("per-record", "Per-Record Efficiency"),
    ("model", "Model Optimization"),
    ("fleet", "Fleet-Scale"),
    ("learning", "Compounding Over Time"),
    ("analysis", "Analysis & Testing"),
    ("benchmarking", "Benchmarking"),
]


def load_modules(enabled_filter=None):
    modules = []
    for mod_dir in sorted(MODULES_DIR.iterdir()):
        manifest = mod_dir / "module.yaml"
        if not manifest.exists():
            continue
        data = yaml.safe_load(manifest.read_text())
        if enabled_filter and data["name"] not in enabled_filter:
            continue
        modules.append(data)
    return modules


def generate_nav(modules):
    lines = [
        ".Required",
        "* xref:index.adoc[Welcome]",
        "* xref:01-setup.adoc[Setup]",
        "* xref:02-inference-pipeline.adoc[Clinical NLP Pipeline]",
        "* xref:03-fraud-scoring.adoc[Fraud Scoring]",
        "",
        ".Choose Your Path",
    ]

    grouped = {}
    for m in modules:
        group = m.get("frontend", {}).get("mechanism_group", "other")
        if group not in grouped:
            grouped[group] = []
        grouped[group].append(m)

    for group_key, group_label in GROUP_ORDER:
        if group_key not in grouped:
            continue
        for m in grouped[group_key]:
            page = m.get("showroom", {}).get("lab_page", "")
            name = m.get("displayName", m["name"])
            if page:
                lines.append(f"* xref:{page}[{name}]")

    for group_key in grouped:
        if group_key not in dict(GROUP_ORDER):
            for m in grouped[group_key]:
                page = m.get("showroom", {}).get("lab_page", "")
                name = m.get("displayName", m["name"])
                if page:
                    lines.append(f"* xref:{page}[{name}]")

    lines.extend([
        "",
        ".Wrap Up",
        "* xref:99-conclusion.adoc[Conclusion]",
        "",
        ".Reference",
        "* xref:architecture.adoc[Architecture Overview]",
    ])

    return "\n".join(lines) + "\n"


def generate_conclusion_checklist(modules):
    items = []
    for m in modules:
        name = m.get("displayName", m["name"])
        desc = m.get("description", "")
        short_desc = desc.split(".")[0].strip() if desc else name
        items.append(f"* ☐ *{name}* — {short_desc}")
    return "\n".join(items)


if __name__ == "__main__":
    enabled = None
    if "--modules" in sys.argv:
        idx = sys.argv.index("--modules")
        if idx + 1 < len(sys.argv):
            enabled = [m.strip() for m in sys.argv[idx + 1].split(",")]
    elif os.environ.get("MODULES_ENABLED"):
        enabled = [m.strip() for m in os.environ["MODULES_ENABLED"].split(",") if m.strip()]

    modules = load_modules(enabled)
    nav = generate_nav(modules)

    if "--dry-run" in sys.argv:
        print(nav)
        print(f"\n# {len(modules)} modules included")
    else:
        nav_path = REPO_ROOT / "content" / "modules" / "ROOT" / "nav.adoc"
        nav_path.write_text(nav)
        print(f"Generated {nav_path} with {len(modules)} modules")
