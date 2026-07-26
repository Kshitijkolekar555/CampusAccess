package com.pict.gatesecurity.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

/**
 * Central JWT utility for generating and validating access and refresh tokens.
 *
 * Access token  — short-lived (15 min default), carries username + role claims.
 * Refresh token — long-lived (7 days default), carries username only.
 *                 Used to obtain new access tokens without re-login.
 *
 * SECURITY NOTES:
 *   - Secret is read from env var — never hardcoded.
 *   - No sensitive data (passwords, emails) stored in token claims.
 *   - Tokens are signed with HMAC-SHA256 (HS256).
 */
@Component
@Slf4j
public class JwtUtil {

    private final SecretKey secretKey;
    private final long accessTokenExpiryMs;
    private final long refreshTokenExpiryMs;

    public JwtUtil(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-expiry-ms}") long accessTokenExpiryMs,
            @Value("${app.jwt.refresh-token-expiry-ms}") long refreshTokenExpiryMs) {

        // Derive a consistent key from the configured secret string
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpiryMs = accessTokenExpiryMs;
        this.refreshTokenExpiryMs = refreshTokenExpiryMs;
    }

    // ----------------------------------------------------------------
    // Token generation
    // ----------------------------------------------------------------

    public String generateAccessToken(String username, String role) {
        return buildToken(username, Map.of("role", role, "type", "ACCESS"), accessTokenExpiryMs);
    }

    public String generateRefreshToken(String username) {
        String jti = UUID.randomUUID().toString();
        return buildToken(username, Map.of("type", "REFRESH", "jti", jti), refreshTokenExpiryMs);
    }

    public String extractJti(String token) {
        return (String) parseClaims(token).get("jti");
    }

    private String buildToken(String subject, Map<String, Object> extraClaims, long expiryMs) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expiryMs);

        return Jwts.builder()
                .subject(subject)
                .claims(extraClaims)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    // ----------------------------------------------------------------
    // Token validation & extraction
    // ----------------------------------------------------------------

    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.debug("JWT expired: {}", e.getMessage());
        } catch (JwtException e) {
            log.warn("JWT validation failed: {}", e.getMessage());
        }
        return false;
    }

    public boolean isAccessToken(String token) {
        return "ACCESS".equals(extractClaim(token, "type"));
    }

    public boolean isRefreshToken(String token) {
        return "REFRESH".equals(extractClaim(token, "type"));
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return (String) parseClaims(token).get("role");
    }

    public Date extractExpiration(String token) {
        return parseClaims(token).getExpiration();
    }

    private Object extractClaim(String token, String claimName) {
        return parseClaims(token).get(claimName);
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
