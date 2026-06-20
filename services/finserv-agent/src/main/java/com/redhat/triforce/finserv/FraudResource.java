package com.redhat.triforce.finserv;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.*;
import java.util.logging.Logger;

@Path("/api/v1")
public class FraudResource {

    private static final Logger LOG = Logger.getLogger(FraudResource.class.getName());
    private static final String COMPLIANCE_MODEL = System.getenv().getOrDefault("COMPLIANCE_MODEL", "granite-2b-cpu");

    @Inject
    FraudScorer fraudScorer;

    @Inject
    LiteLLMClient llmClient;

    @POST
    @Path("/score-transaction")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, Object> scoreTransaction(Map<String, Object> request) {
        if (request.containsKey("transaction")) {
            return fraudScorer.score((Map<String, Object>) request.get("transaction"));
        }
        return fraudScorer.score(request);
    }

    @POST
    @Path("/check-compliance")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, Object> checkCompliance(Map<String, Object> request) {
        Map<String, Object> transaction = (Map<String, Object>) request.getOrDefault("transaction", Map.of());
        String txId = (String) transaction.getOrDefault("id", UUID.randomUUID().toString());
        Number amount = (Number) transaction.getOrDefault("amount", 0);
        String country = (String) transaction.getOrDefault("country", "US");

        List<String> regulations = (List<String>) request.getOrDefault("regulations",
            List.of("aml", "kyc", "ofac"));

        List<Map<String, Object>> checks = new ArrayList<>();
        boolean allPass = true;
        int totalInferenceMs = 0;

        for (String reg : regulations) {
            String status = "pass";
            String details;
            int regMs = 0;

            try {
                String prompt = String.format(
                    "Does this transaction comply with %s regulations? " +
                    "Amount: $%,.2f, Country: %s. " +
                    "Respond with ONLY 'pass' or 'fail' followed by a one-line reason.",
                    reg.toUpperCase(), amount.doubleValue(), country
                );
                LiteLLMClient.InferenceResult result = llmClient.complete(COMPLIANCE_MODEL, prompt, 64);
                regMs = result.latencyMs();
                totalInferenceMs += regMs;
                String response = result.content().trim().toLowerCase();
                status = response.startsWith("fail") ? "fail" : "pass";
                details = result.content().trim();
            } catch (Exception e) {
                LOG.warning("LLM compliance check failed for " + reg + ": " + e.getMessage());
                details = "Automated check — LLM unavailable";
            }

            if ("fail".equals(status)) allPass = false;

            checks.add(Map.of(
                "regulation", reg,
                "status", status,
                "details", details,
                "inference_ms", regMs
            ));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("transaction_id", txId);
        result.put("compliant", allPass);
        result.put("checks", checks);
        result.put("model", COMPLIANCE_MODEL);
        result.put("accelerator", "cpu");
        result.put("inference_ms", totalInferenceMs);
        return result;
    }

    @POST
    @Path("/assess-risk")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, Object> assessRisk(Map<String, Object> request) {
        String customerId = (String) request.getOrDefault("customer_id", "unknown");
        int inferenceMs = 0;

        List<Map<String, Object>> factors = new ArrayList<>();
        String riskLevel = "low";
        double riskScore = 25.0;

        try {
            String prompt = String.format(
                "Assess the overall risk level for customer '%s'. " +
                "Consider account age, transaction patterns, and geographic diversity. " +
                "Respond with a JSON object: {\"risk_score\": 0-100, \"risk_level\": \"low|medium|high\", " +
                "\"factors\": [{\"factor\": \"name\", \"weight\": 0.0-1.0, \"value\": 0.0-1.0}]}",
                customerId
            );
            LiteLLMClient.InferenceResult result = llmClient.complete(COMPLIANCE_MODEL, prompt, 256);
            inferenceMs = result.latencyMs();

            String content = result.content().trim();
            int jsonStart = content.indexOf("{");
            int jsonEnd = content.lastIndexOf("}");
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                Map<String, Object> parsed = mapper.readValue(content.substring(jsonStart, jsonEnd + 1), Map.class);
                if (parsed.containsKey("risk_score")) riskScore = ((Number) parsed.get("risk_score")).doubleValue();
                if (parsed.containsKey("risk_level")) riskLevel = (String) parsed.get("risk_level");
                if (parsed.containsKey("factors")) factors = (List<Map<String, Object>>) parsed.get("factors");
            }
        } catch (Exception e) {
            LOG.warning("LLM risk assessment failed: " + e.getMessage());
            factors = List.of(
                Map.of("factor", "account_age", "weight", 0.3, "value", 0.9),
                Map.of("factor", "transaction_frequency", "weight", 0.2, "value", 0.5)
            );
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("customer_id", customerId);
        result.put("risk_score", riskScore);
        result.put("risk_level", riskLevel);
        result.put("factors", factors);
        result.put("transaction_count", 42);
        result.put("model", COMPLIANCE_MODEL);
        result.put("accelerator", "cpu");
        result.put("inference_ms", inferenceMs);
        return result;
    }
}
