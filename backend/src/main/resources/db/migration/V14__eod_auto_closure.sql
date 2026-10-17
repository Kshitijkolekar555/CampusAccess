-- ============================================================
-- V14__eod_auto_closure.sql
-- Add End-of-Day (EOD) Automatic Closure support to visitors table
-- ============================================================

-- 1. Modify status column to support AUTO_CLOSED_EOD
ALTER TABLE visitors 
    MODIFY COLUMN status ENUM('ACTIVE','APPROVED','CANCELLED','COMPLETED','EXPIRED','PENDING','REJECTED','AUTO_CLOSED_EOD') 
    DEFAULT 'APPROVED';

-- 2. Add EOD closure audit tracking columns if not present
ALTER TABLE visitors
    ADD COLUMN closed_at DATETIME(6) NULL COMMENT 'Timestamp when visit was administratively or automatically closed',
    ADD COLUMN closure_reason VARCHAR(100) NULL COMMENT 'Reason for closure, e.g. END_OF_DAY_AUTO_CLOSURE',
    ADD COLUMN closed_by VARCHAR(50) NULL DEFAULT NULL COMMENT 'Actor or system identifier that closed the visit';

-- 3. Add performance index on status, time_in, time_out for fast EOD batch querying
CREATE INDEX idx_visitors_eod_eligible ON visitors (status, time_in, time_out);
