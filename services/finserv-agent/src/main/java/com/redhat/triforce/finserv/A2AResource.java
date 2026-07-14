package com.redhat.triforce.finserv;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.*;

/**
 * A2A JSON-RPC endpoint for agent-to-agent communication.
 * Implements the A2A protocol v0.2.6.
 */
@Path("/")
public class A2AResource {

    private static final Map<String, Object> AGENT_CARD = buildAgentCard();

    @GET
    @Path("/.well-known/agent-card.json")
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, Object> getAgentCard() {
        return AGENT_CARD;
    }

    @POST
    @Path("/a2a")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, Object> handleA2A(Map<String, Object> request) {
        String id = (String) request.getOrDefault("id", "unknown");
        String method = (String) request.getOrDefault("method", "");

        if ("tasks/send".equals(method)) {
            Map<String, Object> params = (Map<String, Object>) request.getOrDefault("params", Map.of());
            String taskId = (String) params.getOrDefault("id", UUID.randomUUID().toString());

            return Map.of(
                "jsonrpc", "2.0",
                "id", id,
                "result", Map.of(
                    "id", taskId,
                    "contextId", UUID.randomUUID().toString(),
                    "status", Map.of("state", "completed"),
                    "artifacts", List.of(
                        Map.of(
                            "artifactId", UUID.randomUUID().toString(),
                            "parts", List.of(Map.of("kind", "text", "text", "FinServ agent processed task"))
                        )
                    ),
                    "kind", "task"
                )
            );
        }

        if ("tasks/get".equals(method)) {
            Map<String, Object> params = (Map<String, Object>) request.getOrDefault("params", Map.of());
            String taskId = (String) params.getOrDefault("id", "unknown");
            return Map.of(
                "jsonrpc", "2.0",
                "id", id,
                "result", Map.of("id", taskId, "status", Map.of("state", "completed"), "kind", "task")
            );
        }

        return Map.of(
            "jsonrpc", "2.0",
            "id", id,
            "error", Map.of("code", -32601, "message", "Method not found: " + method)
        );
    }

    private static Map<String, Object> buildAgentCard() {
        Map<String, Object> card = new LinkedHashMap<>();
        card.put("name", "Financial Services Agent");
        card.put("description", "Fraud detection and regulatory compliance agent for financial transactions. Runs on Intel Xeon 6 CPU.");
        card.put("version", "0.1.0");
        card.put("url", "http://localhost:8082");
        card.put("protocolVersion", "0.2.6");
        card.put("provider", "Red Hat / Intel");
        card.put("capabilities", Map.of("streaming", false, "pushNotifications", false, "stateTransitionHistory", true));
        card.put("defaultInputModes", List.of("text"));
        card.put("defaultOutputModes", List.of("text"));
        card.put("skills", List.of(
            Map.of("id", "score-transaction", "name", "Score Transaction",
                    "description", "Score a financial transaction for fraud risk",
                    "tags", List.of("finserv", "fraud", "scoring"),
                    "examples", List.of("Score this transaction for fraud", "Is this transaction suspicious?")),
            Map.of("id", "check-compliance", "name", "Check Compliance",
                    "description", "Check a transaction against regulatory rules",
                    "tags", List.of("finserv", "compliance", "regulation"),
                    "examples", List.of("Check AML compliance", "Is this transaction compliant?")),
            Map.of("id", "assess-risk", "name", "Assess Risk",
                    "description", "Aggregate risk assessment for a customer",
                    "tags", List.of("finserv", "risk", "assessment"),
                    "examples", List.of("Assess this customer's risk", "What is the risk level?"))
        ));
        return Collections.unmodifiableMap(card);
    }
}
