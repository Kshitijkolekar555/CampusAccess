-- ============================================================
-- V5__password_reset_tokens.sql
-- PICT Gate Operations Management System — Password Reset Tokens
-- ============================================================

CREATE TABLE password_reset_tokens (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    token       VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    used        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_password_reset_tokens_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

COMMENT ON TABLE password_reset_tokens IS 'Secure tokens for password reset flow';

CREATE INDEX idx_password_reset_tokens_token    ON password_reset_tokens (token);
CREATE INDEX idx_password_reset_tokens_user_id  ON password_reset_tokens (user_id);
