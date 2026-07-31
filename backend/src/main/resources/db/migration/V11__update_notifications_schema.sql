-- ============================================================
-- V11__update_notifications_schema.sql
-- Extends notifications table for typed events and tracking
-- MySQL 8.0+ compatible (converted from PostgreSQL)
-- ============================================================

ALTER TABLE notifications
    ADD COLUMN event_type VARCHAR(40)  COMMENT 'Notification event type (PASSWORD_RESET, VISITOR_CHECKIN, etc.)',
    ADD COLUMN updated_at DATETIME(6)  COMMENT 'Last update timestamp (status changes, retries)',
    MODIFY COLUMN type    VARCHAR(30)  NOT NULL;

CREATE INDEX idx_notifications_event_type ON notifications (event_type);
