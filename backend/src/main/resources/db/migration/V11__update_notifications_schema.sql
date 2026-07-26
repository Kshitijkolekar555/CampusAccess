-- ============================================================
-- V11__update_notifications_schema.sql
-- Extends notifications table for typed events and tracking
-- ============================================================

ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS event_type VARCHAR(40),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE notifications
    ALTER COLUMN type TYPE VARCHAR(30);

COMMENT ON COLUMN notifications.event_type IS 'Notification event type (PASSWORD_RESET, VISITOR_CHECKIN, etc.)';
COMMENT ON COLUMN notifications.updated_at IS 'Last update timestamp (status changes, retries)';

CREATE INDEX IF NOT EXISTS idx_notifications_event_type ON notifications (event_type);
