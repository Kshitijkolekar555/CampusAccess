-- ============================================================
-- V7__student_gate_passes.sql
-- PICT Gate Operations Management System — Student Gate Passes
-- MySQL 8.0+ compatible (converted from PostgreSQL)
--
-- Allows students to request gate passes for leaving campus
-- during class hours, with warden approval and guard check-in/out.
-- ============================================================

-- ============================================================
-- TABLE: student_gate_passes
-- ============================================================
CREATE TABLE student_gate_passes (
    id                     BIGINT       NOT NULL AUTO_INCREMENT,
    student_user_id        BIGINT,
    student_name           VARCHAR(150) NOT NULL,
    student_prn            VARCHAR(20)  NOT NULL,
    student_mobile         VARCHAR(15),
    student_class          VARCHAR(50),
    student_division       VARCHAR(10),
    student_department     VARCHAR(50),
    purpose                VARCHAR(255) NOT NULL,
    destination            VARCHAR(255) NOT NULL,
    departure_time         DATETIME(6)  NOT NULL,
    expected_return_time   DATETIME(6)  NOT NULL,
    actual_return_time     DATETIME(6),
    status                 VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                                            COMMENT 'PENDING, APPROVED, ACTIVE, COMPLETED, CANCELLED, REJECTED, EXPIRED',
    approved_by            BIGINT,
    approval_notes         TEXT,
    rejection_reason       TEXT,
    warden_approved_at     DATETIME(6),
    gate_exit_at           DATETIME(6),
    gate_entry_at          DATETIME(6),
    gate_id                BIGINT,
    created_at             DATETIME(6)  NOT NULL DEFAULT NOW(6),
    created_by             BIGINT       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_sgp_student_user
        FOREIGN KEY (student_user_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_sgp_approved_by
        FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_sgp_gate
        FOREIGN KEY (gate_id) REFERENCES gates (id) ON DELETE SET NULL,
    CONSTRAINT fk_sgp_created_by
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT
) COMMENT = 'Student gate pass requests, approvals, and usage tracking';

CREATE INDEX idx_sgp_student_prn     ON student_gate_passes (student_prn);
CREATE INDEX idx_sgp_status          ON student_gate_passes (status);
CREATE INDEX idx_sgp_departure_time  ON student_gate_passes (departure_time);
CREATE INDEX idx_sgp_created_at      ON student_gate_passes (created_at);
CREATE INDEX idx_sgp_student_name    ON student_gate_passes (student_name);
CREATE INDEX idx_sgp_gate_id         ON student_gate_passes (gate_id);
