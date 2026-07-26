-- ============================================================
-- V7__student_gate_passes.sql
-- PICT Gate Operations Management System — Student Gate Passes
--
-- Allows students to request gate passes for leaving campus
-- during class hours, with warden approval and guard check-in/out.
-- ============================================================

-- ============================================================
-- TABLE: student_gate_passes
-- ============================================================
CREATE TABLE student_gate_passes (
    id                     BIGSERIAL    PRIMARY KEY,
    student_user_id        BIGINT,                     -- Nullable: if student has a system account
    student_name           VARCHAR(150) NOT NULL,
    student_prn            VARCHAR(20)  NOT NULL,       -- Permanent Registration Number
    student_mobile         VARCHAR(15),
    student_class          VARCHAR(50),                 -- e.g. FE, SE, TE, BE
    student_division       VARCHAR(10),
    student_department     VARCHAR(50),                 -- e.g. IT, CE, ENTC, ECE, AIDS
    purpose                VARCHAR(255) NOT NULL,
    destination            VARCHAR(255) NOT NULL,
    departure_time         TIMESTAMPTZ  NOT NULL,
    expected_return_time   TIMESTAMPTZ  NOT NULL,
    actual_return_time     TIMESTAMPTZ,                 -- NULL until student returns
    status                 VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
                                                  -- PENDING, APPROVED, ACTIVE, COMPLETED,
                                                  -- CANCELLED, REJECTED, EXPIRED
    approved_by            BIGINT,                      -- Warden/Admin who approved
    approval_notes         TEXT,
    rejection_reason       TEXT,
    warden_approved_at     TIMESTAMPTZ,
    gate_exit_at           TIMESTAMPTZ,
    gate_entry_at          TIMESTAMPTZ,
    gate_id                BIGINT,                      -- Gate used for exit
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by             BIGINT       NOT NULL,

    CONSTRAINT fk_sgp_student_user
        FOREIGN KEY (student_user_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_sgp_approved_by
        FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_sgp_gate
        FOREIGN KEY (gate_id) REFERENCES gates (id) ON DELETE SET NULL,
    CONSTRAINT fk_sgp_created_by
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT
);

COMMENT ON TABLE student_gate_passes IS 'Student gate pass requests, approvals, and usage tracking';
COMMENT ON COLUMN student_gate_passes.status IS 'PENDING, APPROVED, ACTIVE, COMPLETED, CANCELLED, REJECTED, EXPIRED';

CREATE INDEX idx_sgp_student_prn     ON student_gate_passes (student_prn);
CREATE INDEX idx_sgp_status          ON student_gate_passes (status);
CREATE INDEX idx_sgp_departure_time  ON student_gate_passes (departure_time);
CREATE INDEX idx_sgp_created_at      ON student_gate_passes (created_at);
CREATE INDEX idx_sgp_student_name    ON student_gate_passes (student_name);
CREATE INDEX idx_sgp_gate_id         ON student_gate_passes (gate_id);
