package com.pict.gatesecurity.security;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * In-memory token blacklist for invalidating tokens on logout.
 *
 * On logout, the token's unique identifier (the full access token string) is added here.
 * The JWT filter checks this before accepting a token.
 *
 * TRADE-OFF: This is an in-memory store — it resets on restart.
 * For a production deployment with multiple instances, replace this with
 * a Redis-backed store (Phase 10 hardening task if scaling is needed).
 * For a single-server PICT deployment, this is sufficient.
 *
 * Entries naturally become irrelevant once the token's expiry time passes,
 * but we don't actively evict them here. If memory becomes a concern,
 * add a scheduled cleanup that removes entries whose expiry < now.
 */
@Component
public class TokenBlacklist {

    private final Set<String> blacklistedTokens = ConcurrentHashMap.newKeySet();

    public void blacklist(String token) {
        blacklistedTokens.add(token);
    }

    public boolean isBlacklisted(String token) {
        return blacklistedTokens.contains(token);
    }
}
