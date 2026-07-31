-- ============================================================
-- V6__vehicle_management.sql
-- PICT Gate Operations Management System — Vehicle Management
-- MySQL 8.0+ compatible (converted from PostgreSQL)
--
-- Adds vehicle registration, entry/exit logging, and
-- blacklist tracking.
-- ============================================================

-- ============================================================
-- TABLE: vehicles
-- ============================================================
CREATE TABLE vehicles (
    id                    BIGINT      NOT NULL AUTO_INCREMENT,
    registration_number   VARCHAR(20) NOT NULL,
    vehicle_type          VARCHAR(50),
    category              ENUM('STUDENT', 'FACULTY', 'STAFF', 'VISITOR', 'VENDOR', 'OTHER') NOT NULL,
    owner_name            VARCHAR(150),
    owner_contact         VARCHAR(15),
    owner_user_id         BIGINT,
    color                 VARCHAR(50),
    is_blacklisted        BOOLEAN     NOT NULL DEFAULT FALSE COMMENT 'When TRUE the vehicle is denied entry',
    blacklist_reason      TEXT        COMMENT 'Reason for blacklisting',
    created_at            DATETIME(6) NOT NULL DEFAULT NOW(6),
    created_by            BIGINT      NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_vehicles_registration_number UNIQUE (registration_number),
    CONSTRAINT fk_vehicles_created_by
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_vehicles_owner_user
        FOREIGN KEY (owner_user_id) REFERENCES users (id) ON DELETE SET NULL
) COMMENT = 'Registered vehicles in the campus system';

CREATE INDEX idx_vehicles_registration_number ON vehicles (registration_number);
CREATE INDEX idx_vehicles_category             ON vehicles (category);
CREATE INDEX idx_vehicles_is_blacklisted       ON vehicles (is_blacklisted);
CREATE INDEX idx_vehicles_owner_name           ON vehicles (owner_name);
CREATE INDEX idx_vehicles_owner_user_id        ON vehicles (owner_user_id);

-- ============================================================
-- TABLE: vehicle_logs
-- ============================================================
CREATE TABLE vehicle_logs (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    vehicle_id      BIGINT      NOT NULL,
    gate_id         BIGINT      NOT NULL,
    entry_time      DATETIME(6) NOT NULL DEFAULT NOW(6),
    exit_time       DATETIME(6)          COMMENT 'NULL means vehicle still inside',
    driver_name     VARCHAR(150),
    driver_contact  VARCHAR(15),
    purpose         VARCHAR(255),
    entry_note      TEXT,
    exit_note       TEXT,
    created_at      DATETIME(6) NOT NULL DEFAULT NOW(6),
    created_by      BIGINT      NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_vehicle_logs_vehicle
        FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE RESTRICT,
    CONSTRAINT fk_vehicle_logs_gate
        FOREIGN KEY (gate_id) REFERENCES gates (id) ON DELETE RESTRICT,
    CONSTRAINT fk_vehicle_logs_created_by
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT
) COMMENT = 'Entry and exit records for vehicles';

CREATE INDEX idx_vehicle_logs_vehicle_id  ON vehicle_logs (vehicle_id);
CREATE INDEX idx_vehicle_logs_gate_id     ON vehicle_logs (gate_id);
CREATE INDEX idx_vehicle_logs_entry_time  ON vehicle_logs (entry_time);
CREATE INDEX idx_vehicle_logs_exit_time   ON vehicle_logs (exit_time);
CREATE INDEX idx_vehicle_logs_driver_name ON vehicle_logs (driver_name);
