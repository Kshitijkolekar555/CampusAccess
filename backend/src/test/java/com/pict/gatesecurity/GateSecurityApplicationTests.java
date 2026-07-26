package com.pict.gatesecurity;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Application context load test.
 *
 * Uses Testcontainers to spin up a real PostgreSQL container — same DB
 * engine as production. This catches Flyway migration errors, JPA mapping
 * issues, and bean configuration errors early.
 */
@SpringBootTest
@ActiveProfiles("local")
@Testcontainers
class GateSecurityApplicationTests {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("gatesecurity_test")
            .withUsername("test_user")
            .withPassword("test_password");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        // Override the JWT secret for tests
        registry.add("app.jwt.secret", () -> "test-secret-key-that-is-at-least-256-bits-long-for-testing-purposes");
    }

    @Test
    void contextLoads() {
        // If this passes, Spring context started, all beans wired,
        // and Flyway migrations ran successfully.
    }
}
