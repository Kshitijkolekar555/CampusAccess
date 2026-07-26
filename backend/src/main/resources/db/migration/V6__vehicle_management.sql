-- ============================================================
-- V6__vehicle_management.sql
-- PICT Gate Operations Management System — Vehicle Management
--
-- Adds vehicle registration, entry/exit logging, and
-- blacklist tracking.
-- ============================================================

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE vehicle_category AS ENUM (
    'STUDENT',
    'FACULTY',
    'STAFF',
    'VISITOR',
    'VENDOR',
    'OTHER'
);

-- ============================================================
-- TABLE: vehicles
-- ============================================================
CREATE TABLE vehicles (
    id                    BIGSERIAL        PRIMARY KEY,
    registration_number   VARCHAR(20)      NOT NULL UNIQUE,
    vehicle_type          VARCHAR(50),                 -- e.g. Car, Bike, Van, Truck
    category              vehicle_category NOT NULL,
    owner_name            VARCHAR(150),
    owner_contact         VARCHAR(15),
    owner_user_id         BIGINT,                      -- Nullable: link to registered user
    color                 VARCHAR(50),
    is_blacklisted        BOOLEAN          NOT NULL DEFAULT FALSE,
    blacklist_reason      TEXT,
    created_at            TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    created_by            BIGINT           NOT NULL,

    CONSTRAINT fk_vehicles_created_by
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_vehicles_owner_user
        FOREIGN KEY (owner_user_id) REFERENCES users (id) ON DELETE SET NULL
);

COMMENT ON TABLE vehicles IS 'Registered vehicles in the campus system';
COMMENT ON COLUMN vehicles.is_blacklisted IS 'When TRUE the vehicle is denied entry';
COMMENT ON COLUMN vehicles.blacklist_reason IS 'Reason for blacklisting';

CREATE INDEX idx_vehicles_registration_number ON vehicles (registration_number);
CREATE INDEX idx_vehicles_category             ON vehicles (category);
CREATE INDEX idx_vehicles_is_blacklisted       ON vehicles (is_blacklisted);
CREATE INDEX idx_vehicles_owner_name           ON vehicles (owner_name);
CREATE INDEX idx_vehicles_owner_user_id        ON vehicles (owner_user_id);

-- ============================================================
-- TABLE: vehicle_logs
-- ============================================================
CREATE TABLE vehicle_logs (
    id              BIGSERIAL    PRIMARY KEY,
    vehicle_id      BIGINT       NOT NULL,
    gate_id         BIGINT       NOT NULL,
    entry_time      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    exit_time       TIMESTAMPTZ,                      -- NULL means vehicle still inside
    driver_name     VARCHAR(150),
    driver_contact  VARCHAR(15),
    purpose         VARCHAR(255),
    entry_note      TEXT,
    exit_note       TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by      BIGINT       NOT NULL,

    CONSTRAINT fk_vehicle_logs_vehicle
        FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE RESTRICT,
    CONSTRAINT fk_vehicle_logs_gate
        FOREIGN KEY (gate_id) REFERENCES gates (id) ON DELETE RESTRICT,
    CONSTRAINT fk_vehicle_logs_created_by
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT
);

COMMENT ON TABLE vehicle_logs IS 'Entry and exit records for vehicles';
COMMENT ON COLUMN vehicle_logs.exit_time IS 'NULL means vehicle is still on campus';

CREATE INDEX idx_vehicle_logs_vehicle_id  ON vehicle_logs (vehicle_id);
CREATE INDEX idx_vehicle_logs_gate_id     ON vehicle_logs (gate_id);
CREATE INDEX idx_vehicle_logs_entry_time  ON vehicle_logs (entry_time);
CREATE INDEX idx_vehicle_logs_exit_time   ON vehicle_logs (exit_time);
CREATE INDEX idx_vehicle_logs_driver_name ON vehicle_logs (driver_name);
