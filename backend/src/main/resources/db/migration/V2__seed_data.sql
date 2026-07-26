-- ============================================================
-- V2__seed_data.sql
-- PICT Gate Operations Management System — Seed Data
--
-- Seeds:
--   1. PICT Main Gate
--   2. Default ADMIN user
--
-- IMPORTANT: The admin password hash below is BCrypt of the
-- placeholder password "ChangeMe@123". This MUST be changed
-- immediately after first login via the admin UI or API.
-- The actual password to set in production should come from
-- the ADMIN_DEFAULT_PASSWORD environment variable — but since
-- Flyway migrations are pure SQL and cannot read env vars
-- directly, this seed uses a safe, well-documented placeholder.
-- ============================================================

-- ============================================================
-- PICT Gates
-- ============================================================
INSERT INTO gates (name, location, active)
VALUES
    ('Main Gate', 'PICT Main Entrance — Trimurti Chowk, Dhankawadi', TRUE);

-- ============================================================
-- Default Admin User
-- Password: ChangeMe@123  (BCrypt rounds=12)
-- MUST be changed after first login.
-- ============================================================
INSERT INTO users (username, password_hash, role, full_name, phone, email, active)
VALUES
    (
        'admin',
        '$2a$12$wDMGfbzN8uv6Sz3G4gP8IOO5G5Y.4FNqPFBnE3Kf6i6eF5lQi5upe',
        'ADMIN',
        'PICT Administrator',
        NULL,
        'admin@pict.edu',
        TRUE
    );
