-- ============================================================
-- V1__init_schema.sql
-- PICT Gate Operations Management System — Initial Schema
--
-- Rules:
--   - All timestamps are TIMESTAMPTZ (timezone-aware)
--   - Enums are PostgreSQL native types for DB-level integrity
--   - FKs are explicitly named for clarity in error messages
--   - Indexes cover all columns used in report filters / searches
-- ============================================================

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'GUARD', 'CANTEEN_STAFF');

CREATE TYPE host_type AS ENUM (
    'FACULTY',
    'HOD',
    'ADMIN_STAFF',
    'STUDENT',
    'ALUMNI',
    'VENDOR',
    'OTHER'
);

CREATE TYPE host_department AS ENUM (
    'IT',
    'CE',
    'ENTC',
    'ECE',
    'AIDS',
    'ADMIN'
);

CREATE TYPE shift_status AS ENUM ('ONGOING', 'COMPLETED', 'ABORTED');

CREATE TYPE log_type AS ENUM ('SECURITY_CHECK', 'INCIDENT', 'TASK', 'GENERAL');

CREATE TYPE entry_status AS ENUM ('PRESENT', 'LATE', 'ABSENT');

CREATE TYPE canteen_staff_role AS ENUM ('COOK', 'SERVER', 'CASHIER', 'CLEANER', 'SUPERVISOR', 'OTHER');

-- ============================================================
-- TABLE: gates
-- ============================================================
CREATE TABLE gates (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    location    VARCHAR(255),
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE gates IS 'Physical gates at PICT campus';

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          user_role    NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    phone         VARCHAR(15),
    email         VARCHAR(100),
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users  IS 'System users: admins, guards, canteen staff';
COMMENT ON COLUMN users.password_hash IS 'BCrypt hashed password — never store plaintext';

CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_role     ON users (role);

-- ============================================================
-- TABLE: guards
-- ============================================================
CREATE TABLE guards (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT      NOT NULL,
    employee_code    VARCHAR(30) NOT NULL UNIQUE,
    assigned_gate_id BIGINT,
    active           BOOLEAN     NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_guards_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_guards_gate
        FOREIGN KEY (assigned_gate_id) REFERENCES gates (id) ON DELETE SET NULL
);

COMMENT ON TABLE guards IS 'Security guards linked to user accounts';

CREATE INDEX idx_guards_user_id          ON guards (user_id);
CREATE INDEX idx_guards_assigned_gate_id ON guards (assigned_gate_id);
CREATE INDEX idx_guards_employee_code    ON guards (employee_code);

-- ============================================================
-- TABLE: canteen_staff
-- ============================================================
CREATE TABLE canteen_staff (
    id              BIGSERIAL          PRIMARY KEY,
    user_id         BIGINT             NOT NULL,
    role            canteen_staff_role NOT NULL DEFAULT 'OTHER',
    assigned_outlet VARCHAR(100),
    active          BOOLEAN            NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_canteen_staff_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
);

COMMENT ON TABLE canteen_staff IS 'Canteen staff members linked to user accounts';

CREATE INDEX idx_canteen_staff_user_id ON canteen_staff (user_id);

-- ============================================================
-- TABLE: visitors
-- ============================================================
CREATE TABLE visitors (
    id                    BIGSERIAL    PRIMARY KEY,
    name                  VARCHAR(150) NOT NULL,
    mobile                VARCHAR(15)  NOT NULL,
    purpose               VARCHAR(255) NOT NULL,
    host_name             VARCHAR(150) NOT NULL,
    host_type             host_type    NOT NULL,
    host_department       host_department NOT NULL,
    student_prn           VARCHAR(20),                 -- Nullable: only for student hosts
    gate_id               BIGINT       NOT NULL,
    vehicle_number        VARCHAR(20),                 -- Nullable
    time_in               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    time_out              TIMESTAMPTZ,                 -- Nullable: set on checkout
    id_proof_type         VARCHAR(50)  NOT NULL,       -- e.g. Aadhar, PAN, DL
    id_proof_number       VARCHAR(50)  NOT NULL,
    photo_url             VARCHAR(500),                -- Nullable: future photo upload
    is_blacklisted_match  BOOLEAN      NOT NULL DEFAULT FALSE,
    notes                 TEXT,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by            BIGINT       NOT NULL,

    CONSTRAINT fk_visitors_gate
        FOREIGN KEY (gate_id) REFERENCES gates (id) ON DELETE RESTRICT,
    CONSTRAINT fk_visitors_created_by
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT
);

COMMENT ON TABLE visitors IS 'Visitor entry and exit records';
COMMENT ON COLUMN visitors.time_out IS 'NULL means visitor is still inside';
COMMENT ON COLUMN visitors.is_blacklisted_match IS 'Set true if mobile/name matched watchlist on check-in';

CREATE INDEX idx_visitors_gate_id             ON visitors (gate_id);
CREATE INDEX idx_visitors_mobile              ON visitors (mobile);
CREATE INDEX idx_visitors_time_in             ON visitors (time_in);
CREATE INDEX idx_visitors_time_out            ON visitors (time_out);
CREATE INDEX idx_visitors_is_blacklisted      ON visitors (is_blacklisted_match);
CREATE INDEX idx_visitors_host_department     ON visitors (host_department);
CREATE INDEX idx_visitors_date                ON visitors (DATE(time_in));  -- For date-based filtering

-- ============================================================
-- TABLE: shifts
-- ============================================================
CREATE TABLE shifts (
    id         BIGSERIAL   PRIMARY KEY,
    guard_id   BIGINT      NOT NULL,
    gate_id    BIGINT      NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time   TIMESTAMPTZ,                        -- Nullable: set on shift end
    date       DATE        NOT NULL DEFAULT CURRENT_DATE,
    status     shift_status NOT NULL DEFAULT 'ONGOING',

    CONSTRAINT fk_shifts_guard
        FOREIGN KEY (guard_id) REFERENCES guards (id) ON DELETE RESTRICT,
    CONSTRAINT fk_shifts_gate
        FOREIGN KEY (gate_id) REFERENCES gates (id) ON DELETE RESTRICT
);

COMMENT ON TABLE shifts IS 'Guard duty shift records';

CREATE INDEX idx_shifts_guard_id ON shifts (guard_id);
CREATE INDEX idx_shifts_gate_id  ON shifts (gate_id);
CREATE INDEX idx_shifts_date     ON shifts (date);
CREATE INDEX idx_shifts_status   ON shifts (status);

-- ============================================================
-- TABLE: shift_logs
-- ============================================================
CREATE TABLE shift_logs (
    id          BIGSERIAL  PRIMARY KEY,
    shift_id    BIGINT     NOT NULL,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description TEXT       NOT NULL,
    log_type    log_type   NOT NULL DEFAULT 'GENERAL',

    CONSTRAINT fk_shift_logs_shift
        FOREIGN KEY (shift_id) REFERENCES shifts (id) ON DELETE CASCADE
);

COMMENT ON TABLE shift_logs IS 'Activity log entries recorded during a guard shift';

CREATE INDEX idx_shift_logs_shift_id  ON shift_logs (shift_id);
CREATE INDEX idx_shift_logs_timestamp ON shift_logs (timestamp);
CREATE INDEX idx_shift_logs_log_type  ON shift_logs (log_type);

-- ============================================================
-- TABLE: canteen_entries
-- ============================================================
CREATE TABLE canteen_entries (
    id        BIGSERIAL    PRIMARY KEY,
    staff_id  BIGINT       NOT NULL,
    gate_id   BIGINT       NOT NULL,
    date      DATE         NOT NULL DEFAULT CURRENT_DATE,
    time_in   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    time_out  TIMESTAMPTZ,                          -- Nullable
    status    entry_status NOT NULL DEFAULT 'PRESENT',

    CONSTRAINT fk_canteen_entries_staff
        FOREIGN KEY (staff_id) REFERENCES canteen_staff (id) ON DELETE RESTRICT,
    CONSTRAINT fk_canteen_entries_gate
        FOREIGN KEY (gate_id) REFERENCES gates (id) ON DELETE RESTRICT,

    -- One entry per staff per day
    CONSTRAINT uq_canteen_entries_staff_date
        UNIQUE (staff_id, date)
);

COMMENT ON TABLE canteen_entries IS 'Daily attendance records for canteen staff';

CREATE INDEX idx_canteen_entries_staff_id ON canteen_entries (staff_id);
CREATE INDEX idx_canteen_entries_gate_id  ON canteen_entries (gate_id);
CREATE INDEX idx_canteen_entries_date     ON canteen_entries (date);
CREATE INDEX idx_canteen_entries_status   ON canteen_entries (status);

-- ============================================================
-- TABLE: watchlist
-- ============================================================
CREATE TABLE watchlist (
    id         BIGSERIAL    PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,
    mobile     VARCHAR(15)  NOT NULL,
    reason     TEXT         NOT NULL,
    added_by   BIGINT       NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_watchlist_added_by
        FOREIGN KEY (added_by) REFERENCES users (id) ON DELETE RESTRICT
);

COMMENT ON TABLE watchlist IS 'Blacklisted / flagged individuals — checked on visitor check-in';

CREATE INDEX idx_watchlist_mobile ON watchlist (mobile);
CREATE INDEX idx_watchlist_name   ON watchlist (name);

-- ============================================================
-- TABLE: audit_logs
-- ============================================================
CREATE TABLE audit_logs (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    action      VARCHAR(50)  NOT NULL,   -- e.g. CREATE, UPDATE, DELETE
    entity_type VARCHAR(100) NOT NULL,   -- e.g. Guard, Gate, Visitor
    entity_id   BIGINT       NOT NULL,
    old_value   JSONB,                   -- Nullable: snapshot before change
    new_value   JSONB,                   -- Nullable: snapshot after change
    timestamp   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
);

COMMENT ON TABLE audit_logs IS 'Immutable record of all admin actions for accountability';

CREATE INDEX idx_audit_logs_user_id     ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs (entity_type);
CREATE INDEX idx_audit_logs_entity_id   ON audit_logs (entity_id);
CREATE INDEX idx_audit_logs_timestamp   ON audit_logs (timestamp);
