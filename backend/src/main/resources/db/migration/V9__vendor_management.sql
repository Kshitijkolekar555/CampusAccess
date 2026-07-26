-- ============================================================
-- V9__vendor_management.sql
-- PICT Gate Operations Management System — Vendor & Contractor Management
--
-- Vendor/contractor registration, site visit entry/exit, and
-- blacklist management.
-- ============================================================

-- ============================================================
-- TABLE: vendors
-- ============================================================
CREATE TABLE vendors (
    id                  BIGSERIAL    PRIMARY KEY,
    company_name        VARCHAR(200) NOT NULL,
    contact_person      VARCHAR(150) NOT NULL,
    contact_phone       VARCHAR(15)  NOT NULL,
    contact_email       VARCHAR(100),
    work_description    TEXT,
    assigned_department VARCHAR(50),
    is_blacklisted      BOOLEAN      NOT NULL DEFAULT FALSE,
    blacklist_reason    TEXT,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by          BIGINT       NOT NULL,

    CONSTRAINT fk_vendors_created_by
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT
);

COMMENT ON TABLE vendors IS 'Registered vendors and contractors';
COMMENT ON COLUMN vendors.is_blacklisted IS 'When TRUE the vendor is denied entry';

CREATE INDEX idx_vendors_company_name   ON vendors (company_name);
CREATE INDEX idx_vendors_contact_person ON vendors (contact_person);
CREATE INDEX idx_vendors_is_blacklisted ON vendors (is_blacklisted);

-- ============================================================
-- TABLE: vendor_visits
-- ============================================================
CREATE TABLE vendor_visits (
    id          BIGSERIAL    PRIMARY KEY,
    vendor_id   BIGINT       NOT NULL,
    gate_id     BIGINT       NOT NULL,
    entry_time  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    exit_time   TIMESTAMPTZ,                     -- NULL means vendor still on site
    purpose     VARCHAR(255),
    entry_note  TEXT,
    exit_note   TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by  BIGINT       NOT NULL,

    CONSTRAINT fk_vendor_visits_vendor
        FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE RESTRICT,
    CONSTRAINT fk_vendor_visits_gate
        FOREIGN KEY (gate_id) REFERENCES gates (id) ON DELETE RESTRICT,
    CONSTRAINT fk_vendor_visits_created_by
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT
);

COMMENT ON TABLE vendor_visits IS 'Entry and exit records for vendor/contractor site visits';
COMMENT ON COLUMN vendor_visits.exit_time IS 'NULL means vendor is still on campus';

CREATE INDEX idx_vendor_visits_vendor_id ON vendor_visits (vendor_id);
CREATE INDEX idx_vendor_visits_gate_id   ON vendor_visits (gate_id);
CREATE INDEX idx_vendor_visits_entry_time ON vendor_visits (entry_time);
CREATE INDEX idx_vendor_visits_exit_time  ON vendor_visits (exit_time);
