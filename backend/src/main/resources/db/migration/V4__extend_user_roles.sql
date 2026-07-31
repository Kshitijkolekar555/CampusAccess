-- ============================================================
-- V4__extend_user_roles.sql
-- PICT Gate Operations Management System — Extended Role Support
-- MySQL 8.0+ compatible (converted from PostgreSQL)
--
-- In MySQL, ENUMs are per-column, not global types.
-- We MODIFY the `role` column in `users` to include new values.
-- Existing data is preserved as ENUM values are extended.
-- ============================================================

ALTER TABLE users
    MODIFY COLUMN role ENUM(
        'ADMIN',
        'GUARD',
        'CANTEEN_STAFF',
        'SECURITY_OFFICER',
        'SECURITY_GUARD',
        'HOSTEL_WARDEN',
        'CANTEEN_MANAGER',
        'VISITOR'
    ) NOT NULL;
