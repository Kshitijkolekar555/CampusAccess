-- ============================================================
-- V3__refresh_tokens.sql
-- PICT Gate Operations Management System — Refresh Token Persistence
--
-- Enables refresh token rotation, revocation, and expiry tracking.
-- ============================================================

CREATE TABLE refresh_tokens (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    token       VARCHAR(512) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

COMMENT ON TABLE refresh_tokens IS 'Persisted refresh tokens for rotation and revocation';

CREATE INDEX idx_refresh_tokens_user_id  ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_token    ON refresh_tokens (token);
CREATE INDEX idx_refresh_tokens_revoked  ON refresh_tokens (revoked);
