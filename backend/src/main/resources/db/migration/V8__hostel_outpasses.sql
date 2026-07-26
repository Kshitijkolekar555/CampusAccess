-- ============================================================
-- V8__hostel_outpasses.sql
-- PICT Gate Operations Management System — Hostel Outpasses
--
-- Students submit outpass requests for leaving campus,
-- warden approves/rejects, security logs exit/entry.
-- ============================================================

CREATE TABLE hostel_outpasses (
    id                     BIGSERIAL    PRIMARY KEY,
    student_user_id        BIGINT,
    student_name           VARCHAR(150) NOT NULL,
    student_prn            VARCHAR(20)  NOT NULL,
    student_mobile         VARCHAR(15),
    student_room           VARCHAR(20),
    student_hostel         VARCHAR(100),
    student_class          VARCHAR(50),
    student_division       VARCHAR(10),
    reason                 TEXT         NOT NULL,
    destination            VARCHAR(255) NOT NULL,
    departure_time         TIMESTAMPTZ  NOT NULL,
    expected_return_time   TIMESTAMPTZ  NOT NULL,
    actual_return_time     TIMESTAMPTZ,
    parent_contact         VARCHAR(15),
    emergency_contact      VARCHAR(15),
    status                 VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
                                               -- PENDING, APPROVED, REJECTED, EXITED,
                                               -- RETURNED, EXPIRED
    warden_id              BIGINT,
    warden_remarks         TEXT,
    rejection_reason       TEXT,
    warden_acted_at        TIMESTAMPTZ,
    gate_exit_at           TIMESTAMPTZ,
    gate_entry_at          TIMESTAMPTZ,
    gate_id                BIGINT,
    is_late_return         BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by             BIGINT       NOT NULL,

    CONSTRAINT fk_ho_student_user
        FOREIGN KEY (student_user_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_ho_warden
        FOREIGN KEY (warden_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ho_gate
        FOREIGN KEY (gate_id) REFERENCES gates (id) ON DELETE SET NULL,
    CONSTRAINT fk_ho_created_by
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT
);

COMMENT ON TABLE hostel_outpasses IS 'Hostel outpass requests, approvals, and exit/entry tracking';
COMMENT ON COLUMN hostel_outpasses.status IS 'PENDING, APPROVED, REJECTED, EXITED, RETURNED, EXPIRED';
COMMENT ON COLUMN hostel_outpasses.is_late_return IS 'Set TRUE if actual return time exceeds expected return time';

CREATE INDEX idx_ho_student_prn    ON hostel_outpasses (student_prn);
CREATE INDEX idx_ho_status         ON hostel_outpasses (status);
CREATE INDEX idx_ho_departure_time ON hostel_outpasses (departure_time);
CREATE INDEX idx_ho_student_name   ON hostel_outpasses (student_name);
CREATE INDEX idx_ho_gate_id        ON hostel_outpasses (gate_id);
CREATE INDEX idx_ho_is_late_return ON hostel_outpasses (is_late_return);
CREATE INDEX idx_ho_created_at     ON hostel_outpasses (created_at);
