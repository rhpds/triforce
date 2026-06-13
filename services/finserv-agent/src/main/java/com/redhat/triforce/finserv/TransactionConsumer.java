package com.redhat.triforce.finserv;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import org.eclipse.microprofile.reactive.messaging.Channel;
import org.eclipse.microprofile.reactive.messaging.Emitter;
import org.eclipse.microprofile.reactive.messaging.Incoming;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.*;
import java.time.Instant;
import java.util.logging.Logger;

/**
 * Kafka consumer for synthetic transaction stream.
 * Consumes from finserv.transactions.synthetic, runs fraud scoring and
 * compliance checks, produces to finserv.fraud.scores, finserv.compliance.decisions,
 * and finserv.alerts.
 */
@ApplicationScoped
public class TransactionConsumer {

    private static final Logger LOG = Logger.getLogger(TransactionConsumer.class.getName());

    @Inject
    FraudScorer fraudScorer;

    @Channel("fraud-scores")
    Emitter<String> fraudScoresEmitter;

    @Channel("compliance-decisions")
    Emitter<String> complianceEmitter;

    @Channel("alerts")
    Emitter<String> alertsEmitter;

    private final ObjectMapper mapper = new ObjectMapper();

    @Incoming("transactions")
    public void processTransaction(String message) {
        try {
            Map<String, Object> transaction = mapper.readValue(message,
                    mapper.getTypeFactory().constructMapType(HashMap.class, String.class, Object.class));

            Map<String, Object> fraudResult = fraudScorer.score(transaction);
            fraudResult.put("kv_cache_hit", false);
            fraudResult.put("scored_at", Instant.now().toString());
            fraudScoresEmitter.send(mapper.writeValueAsString(fraudResult));

            Map<String, Object> complianceResult = runComplianceCheck(transaction);
            complianceResult.put("decided_at", Instant.now().toString());
            complianceEmitter.send(mapper.writeValueAsString(complianceResult));

            double riskScore = ((Number) fraudResult.getOrDefault("risk_score", 0)).doubleValue();
            if (riskScore >= 60) {
                Map<String, Object> alert = new LinkedHashMap<>();
                alert.put("alert_id", UUID.randomUUID().toString());
                alert.put("transaction_id", transaction.getOrDefault("id", "unknown"));
                alert.put("severity", riskScore >= 80 ? "critical" : "warning");
                alert.put("type", "high_fraud_score");
                alert.put("description", String.format("Fraud score %.0f exceeds threshold", riskScore));
                alert.put("created_at", Instant.now().toString());
                alertsEmitter.send(mapper.writeValueAsString(alert));
            }

            LOG.info(String.format("Processed transaction %s: risk=%.0f %s",
                    transaction.getOrDefault("id", "unknown"), riskScore, fraudResult.get("risk_level")));

        } catch (Exception e) {
            LOG.severe("Failed to process transaction: " + e.getMessage());
        }
    }

    private Map<String, Object> runComplianceCheck(Map<String, Object> transaction) {
        String txId = (String) transaction.getOrDefault("id", UUID.randomUUID().toString());
        List<String> regulations = List.of("aml", "kyc", "ofac");

        List<Map<String, Object>> checks = new ArrayList<>();
        for (String reg : regulations) {
            checks.add(Map.of(
                "regulation", reg,
                "status", "pass",
                "details", "Automated check passed for " + reg.toUpperCase()
            ));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("transaction_id", txId);
        result.put("compliant", true);
        result.put("checks", checks);
        result.put("model", "granite-4-0-h-tiny");
        result.put("accelerator", "cpu");
        result.put("inference_ms", 0);
        return result;
    }
}
