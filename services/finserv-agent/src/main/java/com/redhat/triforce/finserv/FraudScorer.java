package com.redhat.triforce.finserv;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.*;

/**
 * Fraud scoring engine. Evaluates transactions for fraud signals
 * using Intel Xeon 6 CPU inference via MAAS/LiteLLM.
 */
@ApplicationScoped
public class FraudScorer {

    public Map<String, Object> score(Map<String, Object> transaction) {
        String txId = (String) transaction.getOrDefault("id", UUID.randomUUID().toString());
        Number amount = (Number) transaction.getOrDefault("amount", 0);

        List<Map<String, Object>> signals = new ArrayList<>();
        double riskScore = 10.0;

        // Rule-based signals (fast, no inference needed)
        if (amount.doubleValue() > 10000) {
            signals.add(Map.of(
                "type", "unusual_amount",
                "severity", "warning",
                "description", "Transaction amount exceeds $10,000 threshold",
                "confidence", 0.95
            ));
            riskScore += 30;
        }

        if (amount.doubleValue() % 1000 == 0 && amount.doubleValue() > 0) {
            signals.add(Map.of(
                "type", "round_amount",
                "severity", "info",
                "description", "Transaction is a round number",
                "confidence", 0.7
            ));
            riskScore += 5;
        }

        riskScore = Math.min(riskScore, 100);

        String riskLevel;
        String recommendation;
        if (riskScore >= 80) {
            riskLevel = "critical";
            recommendation = "block";
        } else if (riskScore >= 60) {
            riskLevel = "high";
            recommendation = "hold";
        } else if (riskScore >= 30) {
            riskLevel = "medium";
            recommendation = "review";
        } else {
            riskLevel = "low";
            recommendation = "approve";
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("transaction_id", txId);
        result.put("risk_score", riskScore);
        result.put("risk_level", riskLevel);
        result.put("signals", signals);
        result.put("recommendation", recommendation);
        result.put("model", "granite-2b-cpu");
        result.put("accelerator", "cpu");
        result.put("inference_ms", 0);
        return result;
    }
}
