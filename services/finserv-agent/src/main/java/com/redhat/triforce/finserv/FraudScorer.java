package com.redhat.triforce.finserv;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.*;

/**
 * Fraud scoring engine. Evaluates transactions for fraud signals
 * using Intel Xeon 6 CPU inference via MAAS/LiteLLM.
 */
@ApplicationScoped
public class FraudScorer {

    private static final Set<String> HIGH_RISK_COUNTRIES = Set.of(
        "NG", "RU", "KP", "IR", "SY", "MM", "VE", "AF", "IQ", "LY"
    );

    private static final Set<String> HIGH_RISK_CATEGORIES = Set.of(
        "wire_transfer", "crypto", "gambling", "money_order", "prepaid_card"
    );

    public Map<String, Object> score(Map<String, Object> transaction) {
        String txId = (String) transaction.getOrDefault("transaction_id",
            (String) transaction.getOrDefault("id", UUID.randomUUID().toString()));
        Number amount = (Number) transaction.getOrDefault("amount", 0);
        String country = (String) transaction.getOrDefault("country", "US");
        String category = (String) transaction.getOrDefault("merchant_category", "retail");

        List<Map<String, Object>> signals = new ArrayList<>();
        double riskScore = 10.0;
        long startMs = System.currentTimeMillis();

        if (amount.doubleValue() > 10000) {
            signals.add(Map.of(
                "signal", "high_amount",
                "weight", 30,
                "detail", String.format("$%,.0f exceeds $10K threshold", amount.doubleValue())
            ));
            riskScore += 30;
        }

        if (HIGH_RISK_COUNTRIES.contains(country.toUpperCase())) {
            signals.add(Map.of(
                "signal", "high_risk_country",
                "weight", 25,
                "detail", country + " is a high-risk jurisdiction"
            ));
            riskScore += 25;
        }

        if (HIGH_RISK_CATEGORIES.contains(category.toLowerCase())) {
            signals.add(Map.of(
                "signal", "high_risk_category",
                "weight", 15,
                "detail", category + " is a high-risk transaction type"
            ));
            riskScore += 15;
        }

        if (amount.doubleValue() % 1000 == 0 && amount.doubleValue() > 0) {
            signals.add(Map.of(
                "signal", "round_amount",
                "weight", 5,
                "detail", "Exact round number — possible structuring"
            ));
            riskScore += 5;
        }

        riskScore = Math.min(riskScore, 100);
        long inferenceMs = System.currentTimeMillis() - startMs;

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
        result.put("inference_ms", inferenceMs);
        return result;
    }
}
