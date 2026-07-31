-- ============================================================
-- V5__password_reset_tokens.sql
-- PICT Gate Operations Management System — Password Reset Tokens
-- MySQL 8.0+ compatible (converted from PostgreSQL)
-- ============================================================

CREATE TABLE password_reset_tokens (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL,
    token       VARCHAR(255) NOT NULL,
    expires_at  DATETIME(6)  NOT NULL,
    used        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  DATETIME(6)  NOT NULL DEFAULT NOW(6),
    PRIMARY KEY (id),
    CONSTRAINT uq_password_reset_tokens_token UNIQUE (token),
    CONSTRAINT fk_password_reset_tokens_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) COMMENT = 'Secure tokens for password reset flow';

CREATE INDEX idx_password_reset_tokens_token    ON password_reset_tokens (token);
CREATE INDEX idx_password_reset_tokens_user_id  ON password_reset_tokens (user_id);
