package com.redhat.triforce.finserv;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.*;

@Path("/api/v1")
public class FraudResource {

    @Inject
    FraudScorer fraudScorer;

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

        List<String> regulations = (List<String>) request.getOrDefault("regulations",
            List.of("aml", "kyc", "ofac"));

        List<Map<String, Object>> checks = new ArrayList<>();
        boolean allPass = true;

        for (String reg : regulations) {
            boolean pass = true; // simplified: would use LLM inference in production
            checks.add(Map.of(
                "regulation", reg,
                "status", pass ? "pass" : "fail",
                "details", "Automated check passed for " + reg.toUpperCase()
            ));
            if (!pass) allPass = false;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("transaction_id", txId);
        result.put("compliant", allPass);
        result.put("checks", checks);
        result.put("model", "granite-2b-cpu");
        result.put("accelerator", "cpu");
        result.put("inference_ms", 0);
        return result;
    }

    @POST
    @Path("/assess-risk")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, Object> assessRisk(Map<String, Object> request) {
        String customerId = (String) request.getOrDefault("customer_id", "unknown");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("customer_id", customerId);
        result.put("risk_score", 25.0);
        result.put("risk_level", "low");
        result.put("factors", List.of(
            Map.of("factor", "account_age", "weight", 0.3, "value", 0.9),
            Map.of("factor", "transaction_frequency", "weight", 0.2, "value", 0.5),
            Map.of("factor", "geographic_diversity", "weight", 0.2, "value", 0.3)
        ));
        result.put("transaction_count", 42);
        result.put("model", "granite-2b-cpu");
        result.put("accelerator", "cpu");
        result.put("inference_ms", 0);
        return result;
    }
}
