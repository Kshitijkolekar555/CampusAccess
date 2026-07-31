-- ============================================================
-- V1__init_schema.sql
-- PICT Gate Operations Management System — Initial Schema
-- MySQL 8.0+ compatible (converted from PostgreSQL)
--
-- Rules:
--   - All timestamps are DATETIME(6) (microsecond precision)
--   - Enums are MySQL native ENUM columns per table
--   - FKs are explicitly named for clarity in error messages
--   - Indexes cover all columns used in report filters / searches
-- ============================================================

-- ============================================================
-- TABLE: gates
-- ============================================================
CREATE TABLE gates (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    location    VARCHAR(255),
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  DATETIME(6)  NOT NULL DEFAULT NOW(6),
    PRIMARY KEY (id)
) COMMENT = 'Physical gates at PICT campus';

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    username      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL COMMENT 'BCrypt hashed password — never store plaintext',
    role          ENUM('ADMIN', 'GUARD', 'CANTEEN_STAFF') NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    phone         VARCHAR(15),
    email         VARCHAR(100),
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    DATETIME(6)  NOT NULL DEFAULT NOW(6),
    updated_at    DATETIME(6)  NOT NULL DEFAULT NOW(6),
    PRIMARY KEY (id),
    CONSTRAINT uq_users_username UNIQUE (username)
) COMMENT = 'System users: admins, guards, canteen staff';

CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_role     ON users (role);

-- ============================================================
-- TABLE: guards
-- ============================================================
CREATE TABLE guards (
    id               BIGINT      NOT NULL AUTO_INCREMENT,
    user_id          BIGINT      NOT NULL,
    employee_code    VARCHAR(30) NOT NULL,
    assigned_gate_id BIGINT,
    active           BOOLEAN     NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    CONSTRAINT uq_guards_employee_code UNIQUE (employee_code),
    CONSTRAINT fk_guards_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_guards_gate
        FOREIGN KEY (assigned_gate_id) REFERENCES gates (id) ON DELETE SET NULL
) COMMENT = 'Security guards linked to user accounts';

CREATE INDEX idx_guards_user_id          ON guards (user_id);
CREATE INDEX idx_guards_assigned_gate_id ON guards (assigned_gate_id);
CREATE INDEX idx_guards_employee_code    ON guards (employee_code);

-- ============================================================
-- TABLE: canteen_staff
-- ============================================================
CREATE TABLE canteen_staff (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    user_id         BIGINT      NOT NULL,
    role            ENUM('COOK', 'SERVER', 'CASHIER', 'CLEANER', 'SUPERVISOR', 'OTHER') NOT NULL DEFAULT 'OTHER',
    assigned_outlet VARCHAR(100),
    active          BOOLEAN     NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    CONSTRAINT fk_canteen_staff_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
) COMMENT = 'Canteen staff members linked to user accounts';

CREATE INDEX idx_canteen_staff_user_id ON canteen_staff (user_id);

-- ============================================================
-- TABLE: visitors
-- ============================================================
CREATE TABLE visitors (
    id                    BIGINT       NOT NULL AUTO_INCREMENT,
    name                  VARCHAR(150) NOT NULL,
    mobile                VARCHAR(15)  NOT NULL,
    purpose               VARCHAR(255) NOT NULL,
    host_name             VARCHAR(150) NOT NULL,
    host_type             ENUM('FACULTY', 'HOD', 'ADMIN_STAFF', 'STUDENT', 'ALUMNI', 'VENDOR', 'OTHER') NOT NULL,
    host_department       ENUM('IT', 'CE', 'ENTC', 'ECE', 'AIDS', 'ADMIN') NOT NULL,
    student_prn           VARCHAR(20),
    gate_id               BIGINT       NOT NULL,
    vehicle_number        VARCHAR(20),
    time_in               DATETIME(6)  NOT NULL DEFAULT NOW(6),
    time_out              DATETIME(6)  COMMENT 'NULL means visitor is still inside',
    id_proof_type         VARCHAR(50)  NOT NULL,
    id_proof_number       VARCHAR(50)  NOT NULL,
    photo_url             VARCHAR(500),
    is_blacklisted_match  BOOLEAN      NOT NULL DEFAULT FALSE COMMENT 'Set true if mobile/name matched watchlist on check-in',
    notes                 TEXT,
    created_at            DATETIME(6)  NOT NULL DEFAULT NOW(6),
    created_by            BIGINT       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_visitors_gate
        FOREIGN KEY (gate_id) REFERENCES gates (id) ON DELETE RESTRICT,
    CONSTRAINT fk_visitors_created_by
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT
) COMMENT = 'Visitor entry and exit records';

CREATE INDEX idx_visitors_gate_id             ON visitors (gate_id);
CREATE INDEX idx_visitors_mobile              ON visitors (mobile);
CREATE INDEX idx_visitors_time_in             ON visitors (time_in);
CREATE INDEX idx_visitors_time_out            ON visitors (time_out);
CREATE INDEX idx_visitors_is_blacklisted      ON visitors (is_blacklisted_match);
CREATE INDEX idx_visitors_host_department     ON visitors (host_department);
CREATE INDEX idx_visitors_date                ON visitors ((DATE(time_in)));

-- ============================================================
-- TABLE: shifts
-- ============================================================
CREATE TABLE shifts (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    guard_id   BIGINT      NOT NULL,
    gate_id    BIGINT      NOT NULL,
    start_time DATETIME(6) NOT NULL DEFAULT NOW(6),
    end_time   DATETIME(6),
    date       DATE        NOT NULL DEFAULT (CURRENT_DATE),
    status     ENUM('ONGOING', 'COMPLETED', 'ABORTED') NOT NULL DEFAULT 'ONGOING',
    PRIMARY KEY (id),
    CONSTRAINT fk_shifts_guard
        FOREIGN KEY (guard_id) REFERENCES guards (id) ON DELETE RESTRICT,
    CONSTRAINT fk_shifts_gate
        FOREIGN KEY (gate_id) REFERENCES gates (id) ON DELETE RESTRICT
) COMMENT = 'Guard duty shift records';

CREATE INDEX idx_shifts_guard_id ON shifts (guard_id);
CREATE INDEX idx_shifts_gate_id  ON shifts (gate_id);
CREATE INDEX idx_shifts_date     ON shifts (date);
CREATE INDEX idx_shifts_status   ON shifts (status);

-- ============================================================
-- TABLE: shift_logs
-- ============================================================
CREATE TABLE shift_logs (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    shift_id    BIGINT      NOT NULL,
    timestamp   DATETIME(6) NOT NULL DEFAULT NOW(6),
    description TEXT        NOT NULL,
    log_type    ENUM('SECURITY_CHECK', 'INCIDENT', 'TASK', 'GENERAL') NOT NULL DEFAULT 'GENERAL',
    PRIMARY KEY (id),
    CONSTRAINT fk_shift_logs_shift
        FOREIGN KEY (shift_id) REFERENCES shifts (id) ON DELETE CASCADE
) COMMENT = 'Activity log entries recorded during a guard shift';

CREATE INDEX idx_shift_logs_shift_id  ON shift_logs (shift_id);
CREATE INDEX idx_shift_logs_timestamp ON shift_logs (timestamp);
CREATE INDEX idx_shift_logs_log_type  ON shift_logs (log_type);

-- ============================================================
-- TABLE: canteen_entries
-- ============================================================
CREATE TABLE canteen_entries (
    id        BIGINT      NOT NULL AUTO_INCREMENT,
    staff_id  BIGINT      NOT NULL,
    gate_id   BIGINT      NOT NULL,
    date      DATE        NOT NULL DEFAULT (CURRENT_DATE),
    time_in   DATETIME(6) NOT NULL DEFAULT NOW(6),
    time_out  DATETIME(6),
    status    ENUM('PRESENT', 'LATE', 'ABSENT') NOT NULL DEFAULT 'PRESENT',
    PRIMARY KEY (id),
    CONSTRAINT fk_canteen_entries_staff
        FOREIGN KEY (staff_id) REFERENCES canteen_staff (id) ON DELETE RESTRICT,
    CONSTRAINT fk_canteen_entries_gate
        FOREIGN KEY (gate_id) REFERENCES gates (id) ON DELETE RESTRICT,
    CONSTRAINT uq_canteen_entries_staff_date
        UNIQUE (staff_id, date)
) COMMENT = 'Daily attendance records for canteen staff';

CREATE INDEX idx_canteen_entries_staff_id ON canteen_entries (staff_id);
CREATE INDEX idx_canteen_entries_gate_id  ON canteen_entries (gate_id);
CREATE INDEX idx_canteen_entries_date     ON canteen_entries (date);
CREATE INDEX idx_canteen_entries_status   ON canteen_entries (status);

-- ============================================================
-- TABLE: watchlist
-- ============================================================
CREATE TABLE watchlist (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    name       VARCHAR(150) NOT NULL,
    mobile     VARCHAR(15)  NOT NULL,
    reason     TEXT         NOT NULL,
    added_by   BIGINT       NOT NULL,
    created_at DATETIME(6)  NOT NULL DEFAULT NOW(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_watchlist_added_by
        FOREIGN KEY (added_by) REFERENCES users (id) ON DELETE RESTRICT
) COMMENT = 'Blacklisted / flagged individuals — checked on visitor check-in';

CREATE INDEX idx_watchlist_mobile ON watchlist (mobile);
CREATE INDEX idx_watchlist_name   ON watchlist (name);

-- ============================================================
-- TABLE: audit_logs
-- ============================================================
CREATE TABLE audit_logs (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL,
    action      VARCHAR(50)  NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id   BIGINT       NOT NULL,
    old_value   JSON,
    new_value   JSON,
    timestamp   DATETIME(6)  NOT NULL DEFAULT NOW(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
) COMMENT = 'Immutable record of all admin actions for accountability';

CREATE INDEX idx_audit_logs_user_id     ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs (entity_type);
CREATE INDEX idx_audit_logs_entity_id   ON audit_logs (entity_id);
CREATE INDEX idx_audit_logs_timestamp   ON audit_logs (timestamp);
