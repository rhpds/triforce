"""RED tests for FinServ LangGraph agent.

Multi-step fraud reasoning: analyze transaction → lookup risk profile →
check sanctions → evaluate compliance → score and recommend.
"""

import json

import pytest


class TestGraphCompilation:
    def test_graph_module_imports(self):
        from graph import build_graph, FinServState
        assert FinServState is not None

    def test_state_has_required_fields(self):
        from graph import FinServState
        hints = FinServState.__annotations__
        assert "messages" in hints
        assert "transaction" in hints
        assert "risk_score" in hints
        assert "signals" in hints
        assert "compliance_checks" in hints

    @pytest.mark.asyncio
    async def test_graph_compiles(self):
        from graph import build_graph
        graph = await build_graph()
        assert graph is not None
        assert hasattr(graph, "ainvoke")


class TestAnalyzeNode:
    @pytest.mark.asyncio
    async def test_analyze_sets_initial_signals(self):
        from graph import analyze_transaction_node
        state = {
            "messages": [],
            "transaction": {
                "id": "tx-1", "amount": 75000, "currency": "USD",
                "sender": {"id": "c-1", "name": "Test", "country": "US", "account_type": "individual"},
                "receiver": {"id": "c-2", "name": "Recv", "country": "US", "account_type": "business"},
                "type": "wire", "timestamp": "2026-06-12T00:00:00Z",
            },
            "risk_score": 0, "signals": [], "compliance_checks": [],
            "sanctions_result": None, "risk_profile": None,
            "recommendation": None, "inference_log": [],
        }
        result = await analyze_transaction_node(state)
        assert "signals" in result
        assert isinstance(result["signals"], list)


class TestMCPTools:
    @pytest.mark.asyncio
    async def test_risk_profile_tool_exists(self):
        from mcp_tools import risk_profile_lookup
        assert callable(risk_profile_lookup)

    @pytest.mark.asyncio
    async def test_sanction_search_tool_exists(self):
        from mcp_tools import sanction_list_search
        assert callable(sanction_list_search)

    @pytest.mark.asyncio
    async def test_regulatory_rule_tool_exists(self):
        from mcp_tools import regulatory_rule_check
        assert callable(regulatory_rule_check)

    @pytest.mark.asyncio
    async def test_risk_profile_returns_data(self):
        from mcp_tools import risk_profile_lookup
        result = await risk_profile_lookup.ainvoke({"customer_id": "cust-1"})
        data = json.loads(result) if isinstance(result, str) else result
        assert "risk_score" in data
        assert "risk_level" in data


class TestConditionalRouting:
    def test_route_function_exists(self):
        from graph import should_check_sanctions
        assert callable(should_check_sanctions)

    def test_routes_to_sanctions_for_high_amount(self):
        from graph import should_check_sanctions
        state = {
            "transaction": {"amount": 50000, "type": "wire"},
            "signals": [{"type": "unusual_amount", "severity": "warning"}],
        }
        result = should_check_sanctions(state)
        assert result == "check_sanctions"

    def test_routes_to_compliance_for_low_risk(self):
        from graph import should_check_sanctions
        state = {
            "transaction": {"amount": 50, "type": "card"},
            "signals": [],
        }
        result = should_check_sanctions(state)
        assert result == "compliance"


class TestFullGraphExecution:
    @pytest.mark.asyncio
    async def test_graph_returns_risk_score(self):
        from graph import build_graph
        graph = await build_graph()
        result = await graph.ainvoke({
            "messages": [],
            "transaction": {
                "id": "tx-e2e", "amount": 500, "currency": "USD",
                "sender": {"id": "c-1", "name": "Alice", "country": "US", "account_type": "individual"},
                "receiver": {"id": "c-2", "name": "Bob", "country": "US", "account_type": "individual"},
                "type": "ach", "timestamp": "2026-06-12T00:00:00Z",
            },
            "risk_score": 0, "signals": [], "compliance_checks": [],
            "sanctions_result": None, "risk_profile": None,
            "recommendation": None, "inference_log": [],
        })
        assert result["risk_score"] >= 0
        assert result["recommendation"] in ["approve", "review", "hold", "block"]

    @pytest.mark.asyncio
    async def test_graph_runs_multiple_steps(self):
        from graph import build_graph
        graph = await build_graph()
        result = await graph.ainvoke({
            "messages": [],
            "transaction": {
                "id": "tx-steps", "amount": 100, "currency": "USD",
                "sender": {"id": "c-1", "name": "Test", "country": "US", "account_type": "individual"},
                "receiver": {"id": "c-2", "name": "Recv", "country": "US", "account_type": "business"},
                "type": "card", "timestamp": "2026-06-12T00:00:00Z",
            },
            "risk_score": 0, "signals": [], "compliance_checks": [],
            "sanctions_result": None, "risk_profile": None,
            "recommendation": None, "inference_log": [],
        })
        assert len(result.get("inference_log", [])) >= 2
