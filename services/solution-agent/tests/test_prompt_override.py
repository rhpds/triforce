from pathlib import Path
import sys


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import graph


def test_mounted_prompt_overrides_default(tmp_path, monkeypatch):
    prompt_file = tmp_path / "system_prompt"
    prompt_file.write_text("Answer as an infrastructure specialist.\n")
    monkeypatch.setattr(graph, "PROMPT_PATH", str(prompt_file))

    assert graph._get_advisor_prompt() == "Answer as an infrastructure specialist."


def test_empty_or_missing_prompt_uses_default(tmp_path, monkeypatch):
    monkeypatch.setattr(graph, "PROMPT_PATH", str(tmp_path / "missing"))

    assert graph._get_advisor_prompt() == "You are a Red Hat + Intel Solution Architect."
