package com.pict.gatesecurity.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.Map;

/**
 * Simple health-check endpoint for load balancers and docker-compose healthchecks.
 * This is separate from Spring Actuator (/actuator/health) to provide a
 * clean, versioned, application-level health endpoint.
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Health", description = "Application health check")
public class HealthController {

    @GetMapping("/health")
    @Operation(summary = "Application health check", description = "Returns 200 OK if the application is running")
    public ResponseEntity<com.pict.gatesecurity.common.ApiResponse<Map<String, Object>>> health() {
        Map<String, Object> healthInfo = Map.of(
                "status", "UP",
                "service", "PICT Gate Security",
                "timestamp", OffsetDateTime.now().toString(),
                "version", "1.0.0"
        );
        return ResponseEntity.ok(com.pict.gatesecurity.common.ApiResponse.success(healthInfo, "Service is healthy"));
    }
}
