-- ============================================================
-- V13__add_is_late_comer_permitted.sql
-- Add missing is_late_comer_permitted column and update role enum in users table
-- ============================================================

ALTER TABLE users ADD COLUMN is_late_comer_permitted BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE users MODIFY COLUMN role ENUM(
    'ADMIN',
    'SECURITY_OFFICER',
    'SECURITY_GUARD',
    'HOSTEL_WARDEN',
    'CANTEEN_MANAGER',
    'VISITOR',
    'STUDENT',
    'STAFF',
    'GUARD',
    'CANTEEN_STAFF'
) NOT NULL;
