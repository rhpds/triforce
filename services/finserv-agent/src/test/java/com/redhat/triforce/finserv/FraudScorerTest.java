package com.redhat.triforce.finserv;

import org.junit.jupiter.api.Test;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class FraudScorerTest {

    private final FraudScorer scorer = new FraudScorer();

    @Test
    void testScoreLowRiskTransaction() {
        Map<String, Object> tx = Map.of(
            "id", UUID.randomUUID().toString(),
            "amount", 50.0
        );
        Map<String, Object> result = scorer.score(tx);

        assertEquals("low", result.get("risk_level"));
        assertEquals("approve", result.get("recommendation"));
        assertTrue((double) result.get("risk_score") < 30);
    }

    @Test
    void testScoreHighAmountTransaction() {
        Map<String, Object> tx = Map.of(
            "id", UUID.randomUUID().toString(),
            "amount", 15000.0
        );
        Map<String, Object> result = scorer.score(tx);

        assertEquals("medium", result.get("risk_level"));
        assertNotNull(result.get("signals"));
    }

    @Test
    void testScoreReturnsRequiredFields() {
        Map<String, Object> tx = Map.of("id", "test-123", "amount", 100.0);
        Map<String, Object> result = scorer.score(tx);

        assertNotNull(result.get("transaction_id"));
        assertNotNull(result.get("risk_score"));
        assertNotNull(result.get("risk_level"));
        assertNotNull(result.get("signals"));
        assertNotNull(result.get("model"));
        assertNotNull(result.get("inference_ms"));
    }

    @Test
    void testScoreUsesXeonCpu() {
        Map<String, Object> tx = Map.of("id", "test-456", "amount", 100.0);
        Map<String, Object> result = scorer.score(tx);

        assertEquals("cpu", result.get("accelerator"));
        assertEquals("granite-2b-cpu", result.get("model"));
    }

    @Test
    void testRoundAmountDetection() {
        Map<String, Object> tx = Map.of("id", "test-789", "amount", 5000.0);
        Map<String, Object> result = scorer.score(tx);

        var signals = (java.util.List<Map<String, Object>>) result.get("signals");
        boolean hasRoundAmount = signals.stream()
            .anyMatch(s -> "round_amount".equals(s.get("type")));
        assertTrue(hasRoundAmount);
    }
}
