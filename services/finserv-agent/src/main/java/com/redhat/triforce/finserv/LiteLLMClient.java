package com.redhat.triforce.finserv;

import jakarta.enterprise.context.ApplicationScoped;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * HTTP client for MAAS/LiteLLM inference on Intel Xeon 6 CPU.
 * Uses OpenAI-compatible chat completions API.
 */
@ApplicationScoped
public class LiteLLMClient {

    @ConfigProperty(name = "litellm.api-base")
    String apiBase;

    @ConfigProperty(name = "litellm.api-key", defaultValue = "")
    String apiKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final ObjectMapper mapper = new ObjectMapper();

    public record InferenceResult(String content, int latencyMs) {}

    public InferenceResult complete(String model, String prompt, int maxTokens) throws Exception {
        long start = System.currentTimeMillis();

        Map<String, Object> body = Map.of(
            "model", model,
            "messages", java.util.List.of(Map.of("role", "user", "content", prompt)),
            "max_tokens", maxTokens,
            "temperature", 0.1
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiBase + "/v1/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                .timeout(Duration.ofSeconds(30))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("LiteLLM returned " + response.statusCode() + ": " + response.body());
        }

        JsonNode root = mapper.readTree(response.body());
        String content = root.at("/choices/0/message/content").asText("");

        int latencyMs = (int)(System.currentTimeMillis() - start);
        return new InferenceResult(content, latencyMs);
    }
}
