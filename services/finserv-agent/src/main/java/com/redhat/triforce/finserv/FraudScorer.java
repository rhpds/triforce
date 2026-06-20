package com.redhat.triforce.finserv;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.*;
import java.util.logging.Logger;

/**
 * Fraud scoring engine. Combines rule-based signal detection with
 * LLM risk assessment on Intel Xeon 6 CPU via MAAS/LiteLLM.
 */
@ApplicationScoped
public class FraudScorer {

    private static final Logger LOG = Logger.getLogger(FraudScorer.class.getName());

    private static final String FRAUD_MODEL = System.getenv().getOrDefault("FRAUD_MODEL", "granite-2b-cpu");

    private static final Set<String> HIGH_RISK_COUNTRIES = Set.of(
        "NG", "RU", "KP", "IR", "SY", "MM", "VE", "AF", "IQ", "LY"
    );

    private static final Set<String> HIGH_RISK_CATEGORIES = Set.of(
        "wire_transfer", "crypto", "gambling", "money_order", "prepaid_card"
    );

    @Inject
    LiteLLMClient llmClient;

    public Map<String, Object> score(Map<String, Object> transaction) {
        String txId = (String) transaction.getOrDefault("transaction_id",
            (String) transaction.getOrDefault("id", UUID.randomUUID().toString()));
        Number amount = (Number) transaction.getOrDefault("amount", 0);
        String country = (String) transaction.getOrDefault("country", "US");
        String category = (String) transaction.getOrDefault("merchant_category", "retail");

        List<Map<String, Object>> signals = new ArrayList<>();
        double ruleScore = 10.0;

        if (amount.doubleValue() > 10000) {
            signals.add(Map.of(
                "signal", "high_amount",
                "weight", 30,
                "detail", String.format("$%,.0f exceeds $10K threshold", amount.doubleValue())
            ));
            ruleScore += 30;
        }

        if (HIGH_RISK_COUNTRIES.contains(country.toUpperCase())) {
            signals.add(Map.of(
                "signal", "high_risk_country",
                "weight", 25,
                "detail", country + " is a high-risk jurisdiction"
            ));
            ruleScore += 25;
        }

        if (HIGH_RISK_CATEGORIES.contains(category.toLowerCase())) {
            signals.add(Map.of(
                "signal", "high_risk_category",
                "weight", 15,
                "detail", category + " is a high-risk transaction type"
            ));
            ruleScore += 15;
        }

        if (amount.doubleValue() % 1000 == 0 && amount.doubleValue() > 0) {
            signals.add(Map.of(
                "signal", "round_amount",
                "weight", 5,
                "detail", "Exact round number — possible structuring"
            ));
            ruleScore += 5;
        }

        ruleScore = Math.min(ruleScore, 100);

        double llmScore = 0;
        int inferenceMs = 0;
        String modelUsed = FRAUD_MODEL;

        try {
            String prompt = String.format(
                "Assess the fraud risk of this transaction on a scale of 0-100. " +
                "0 = no risk, 100 = certain fraud. Consider amount, country, and category. " +
                "Respond with ONLY a number.\n\n" +
                "Amount: $%,.2f\nCountry: %s\nCategory: %s\nSignals detected: %d",
                amount.doubleValue(), country, category, signals.size()
            );

            LiteLLMClient.InferenceResult result = llmClient.complete(FRAUD_MODEL, prompt, 16);
            inferenceMs = result.latencyMs();
            modelUsed = FRAUD_MODEL;

            String cleaned = result.content().trim().replaceAll("[^0-9.]", "");
            if (!cleaned.isEmpty()) {
                llmScore = Math.min(Double.parseDouble(cleaned), 100);
            }

            signals.add(Map.of(
                "signal", "llm_risk_assessment",
                "weight", (int) llmScore,
                "detail", String.format("LLM assessed risk at %.0f/100 (%dms on %s)", llmScore, inferenceMs, modelUsed)
            ));
        } catch (Exception e) {
            LOG.warning("LLM fraud assessment failed, using rule score only: " + e.getMessage());
            modelUsed = "rule-engine-only";
        }

        double combinedScore = Math.min((ruleScore * 0.6) + (llmScore * 0.4), 100);

        String riskLevel;
        String recommendation;
        if (combinedScore >= 80) {
            riskLevel = "critical";
            recommendation = "block";
        } else if (combinedScore >= 60) {
            riskLevel = "high";
            recommendation = "hold";
        } else if (combinedScore >= 30) {
            riskLevel = "medium";
            recommendation = "review";
        } else {
            riskLevel = "low";
            recommendation = "approve";
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("transaction_id", txId);
        result.put("rule_score", ruleScore);
        result.put("llm_score", llmScore);
        result.put("risk_score", combinedScore);
        result.put("risk_level", riskLevel);
        result.put("signals", signals);
        result.put("recommendation", recommendation);
        result.put("model", modelUsed);
        result.put("accelerator", "cpu");
        result.put("inference_ms", inferenceMs);
        return result;
    }
}
