-- ============================================================
-- V3__refresh_tokens.sql
-- PICT Gate Operations Management System — Refresh Token Persistence
-- MySQL 8.0+ compatible (converted from PostgreSQL)
--
-- Enables refresh token rotation, revocation, and expiry tracking.
-- ============================================================

CREATE TABLE refresh_tokens (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL,
    token       VARCHAR(512) NOT NULL,
    expires_at  DATETIME(6)  NOT NULL,
    revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  DATETIME(6)  NOT NULL DEFAULT NOW(6),
    PRIMARY KEY (id),
    CONSTRAINT uq_refresh_tokens_token UNIQUE (token),
    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) COMMENT = 'Persisted refresh tokens for rotation and revocation';

CREATE INDEX idx_refresh_tokens_user_id  ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_token    ON refresh_tokens (token);
CREATE INDEX idx_refresh_tokens_revoked  ON refresh_tokens (revoked);
