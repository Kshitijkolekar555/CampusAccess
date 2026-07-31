-- ============================================================
-- V9__vendor_management.sql
-- PICT Gate Operations Management System — Vendor & Contractor Management
-- MySQL 8.0+ compatible (converted from PostgreSQL)
--
-- Vendor/contractor registration, site visit entry/exit, and
-- blacklist management.
-- ============================================================

-- ============================================================
-- TABLE: vendors
-- ============================================================
CREATE TABLE vendors (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    company_name        VARCHAR(200) NOT NULL,
    contact_person      VARCHAR(150) NOT NULL,
    contact_phone       VARCHAR(15)  NOT NULL,
    contact_email       VARCHAR(100),
    work_description    TEXT,
    assigned_department VARCHAR(50),
    is_blacklisted      BOOLEAN      NOT NULL DEFAULT FALSE COMMENT 'When TRUE the vendor is denied entry',
    blacklist_reason    TEXT,
    created_at          DATETIME(6)  NOT NULL DEFAULT NOW(6),
    created_by          BIGINT       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_vendors_created_by
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT
) COMMENT = 'Registered vendors and contractors';

CREATE INDEX idx_vendors_company_name   ON vendors (company_name);
CREATE INDEX idx_vendors_contact_person ON vendors (contact_person);
CREATE INDEX idx_vendors_is_blacklisted ON vendors (is_blacklisted);

-- ============================================================
-- TABLE: vendor_visits
-- ============================================================
CREATE TABLE vendor_visits (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    vendor_id   BIGINT      NOT NULL,
    gate_id     BIGINT      NOT NULL,
    entry_time  DATETIME(6) NOT NULL DEFAULT NOW(6),
    exit_time   DATETIME(6)          COMMENT 'NULL means vendor still on site',
    purpose     VARCHAR(255),
    entry_note  TEXT,
    exit_note   TEXT,
    created_at  DATETIME(6) NOT NULL DEFAULT NOW(6),
    created_by  BIGINT      NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_vendor_visits_vendor
        FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE RESTRICT,
    CONSTRAINT fk_vendor_visits_gate
        FOREIGN KEY (gate_id) REFERENCES gates (id) ON DELETE RESTRICT,
    CONSTRAINT fk_vendor_visits_created_by
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT
) COMMENT = 'Entry and exit records for vendor/contractor site visits';

CREATE INDEX idx_vendor_visits_vendor_id  ON vendor_visits (vendor_id);
CREATE INDEX idx_vendor_visits_gate_id    ON vendor_visits (gate_id);
CREATE INDEX idx_vendor_visits_entry_time ON vendor_visits (entry_time);
CREATE INDEX idx_vendor_visits_exit_time  ON vendor_visits (exit_time);
