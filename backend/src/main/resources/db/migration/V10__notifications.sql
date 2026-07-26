-- ============================================================
-- V10__notifications.sql
-- PICT Gate Operations Management System — Notifications
--
-- Stores outgoing notifications (email, SMS, WhatsApp) with
-- status tracking and retry support.
-- ============================================================

CREATE TABLE notifications (
    id             BIGSERIAL    PRIMARY KEY,
    user_id        BIGINT,                      -- Nullable: notification target user
    recipient      VARCHAR(200) NOT NULL,        -- email address or phone number
    type           VARCHAR(20)  NOT NULL,        -- EMAIL, SMS, WHATSAPP
    subject        VARCHAR(200) NOT NULL,
    body           TEXT         NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
                                                  -- PENDING, SENT, FAILED, READ
    retry_count    INTEGER      NOT NULL DEFAULT 0,
    max_retries    INTEGER      NOT NULL DEFAULT 3,
    last_attempt_at TIMESTAMPTZ,
    sent_at        TIMESTAMPTZ,
    error_message  TEXT,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

COMMENT ON TABLE notifications IS 'Outgoing notification history with delivery status';
COMMENT ON COLUMN notifications.status IS 'PENDING, SENT, FAILED, READ';

CREATE INDEX idx_notifications_user_id   ON notifications (user_id);
CREATE INDEX idx_notifications_status    ON notifications (status);
CREATE INDEX idx_notifications_type      ON notifications (type);
CREATE INDEX idx_notifications_created_at ON notifications (created_at);
