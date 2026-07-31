-- ============================================================
-- V10__notifications.sql
-- PICT Gate Operations Management System — Notifications
-- MySQL 8.0+ compatible (converted from PostgreSQL)
--
-- Stores outgoing notifications (email, SMS, WhatsApp) with
-- status tracking and retry support.
-- ============================================================

CREATE TABLE notifications (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    user_id         BIGINT,
    recipient       VARCHAR(200) NOT NULL,
    type            VARCHAR(20)  NOT NULL  COMMENT 'EMAIL, SMS, WHATSAPP',
    subject         VARCHAR(200) NOT NULL,
    body            TEXT         NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, SENT, FAILED, READ',
    retry_count     INT          NOT NULL DEFAULT 0,
    max_retries     INT          NOT NULL DEFAULT 3,
    last_attempt_at DATETIME(6),
    sent_at         DATETIME(6),
    error_message   TEXT,
    created_at      DATETIME(6)  NOT NULL DEFAULT NOW(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) COMMENT = 'Outgoing notification history with delivery status';

CREATE INDEX idx_notifications_user_id    ON notifications (user_id);
CREATE INDEX idx_notifications_status     ON notifications (status);
CREATE INDEX idx_notifications_type       ON notifications (type);
CREATE INDEX idx_notifications_created_at ON notifications (created_at);
