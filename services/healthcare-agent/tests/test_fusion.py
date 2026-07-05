"""Tests for multi-model fusion response structure."""

import pytest

import fusion


def test_parse_judge_response_from_json():
    fields = fusion._parse_judge_response(
        '{"consensus":"same facts","contradictions":"none",'
        '"blind_spots":"medication history","synthesis":"combined answer"}'
    )

    assert fields["consensus"] == "same facts"
    assert fields["contradictions"] == "none"
    assert fields["blind_spots"] == "medication history"
    assert fields["synthesis"] == "combined answer"


@pytest.mark.asyncio
async def test_run_fusion_returns_structured_judge(monkeypatch):
    async def fake_call(model, prompt, max_tokens=300):
        if "judge" in model:
            return {
                "model": model,
                "latency_ms": 40,
                "response": (
                    '{"consensus":"models agree on risk",'
                    '"contradictions":"none",'
                    '"blind_spots":"recent labs",'
                    '"synthesis":"review the case with recent labs"}'
                ),
                "tokens": 30,
            }
        return {
            "model": model,
            "latency_ms": 20,
            "response": f"{model} answer",
            "tokens": 12,
        }

    monkeypatch.setenv("FUSION_PANEL_MODELS", "model-a-cpu,model-b-cpu,model-c-cpu")
    monkeypatch.setenv("FUSION_JUDGE_MODEL", "judge-cpu")
    monkeypatch.setattr(fusion, "_call_model", fake_call)

    result = await fusion.run_fusion("Assess this case", "diagnosis")

    assert result["status"] == "complete"
    assert result["panel"]["count"] == 3
    assert result["judge"]["consensus"] == "models agree on risk"
    assert result["judge"]["contradictions"] == "none"
    assert result["judge"]["blind_spots"] == "recent labs"
    assert result["judge"]["synthesis"] == "review the case with recent labs"
