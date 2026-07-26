-- ============================================================
-- V4__extend_user_roles.sql
-- PICT Gate Operations Management System — Extended Role Support
--
-- Adds missing user roles. Existing values ADMIN, GUARD,
-- CANTEEN_STAFF are kept for backward compatibility.
-- ============================================================

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SECURITY_OFFICER';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SECURITY_GUARD';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'HOSTEL_WARDEN';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'CANTEEN_MANAGER';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'VISITOR';
