-- ============================================================
-- V13__student_biometrics_and_profiles.sql
-- CampusAccess — Student Biometrics & Camera Identification Schema
-- MySQL 8.0+ compatible
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLE: student_profiles
-- Master record linking student academic info to user account
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_profiles (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    user_id            BIGINT       NOT NULL,
    prn                VARCHAR(30)  NOT NULL,
    roll_number        VARCHAR(30),
    department         VARCHAR(50)  NOT NULL,
    academic_year      VARCHAR(10)  NOT NULL DEFAULT 'FE' COMMENT 'FE, SE, TE, BE',
    division           VARCHAR(10),
    active             BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at         DATETIME(6)  NOT NULL DEFAULT NOW(6),
    updated_at         DATETIME(6)  NOT NULL DEFAULT NOW(6),
    PRIMARY KEY (id),
    CONSTRAINT uq_student_profiles_user_id UNIQUE (user_id),
    CONSTRAINT uq_student_profiles_prn UNIQUE (prn),
    CONSTRAINT fk_student_profiles_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) COMMENT = 'Master profiles for enrolled college students';

CREATE INDEX idx_student_profiles_prn        ON student_profiles (prn);
CREATE INDEX idx_student_profiles_user_id    ON student_profiles (user_id);
CREATE INDEX idx_student_profiles_department ON student_profiles (department);

-- ------------------------------------------------------------
-- 2. TABLE: student_face_templates
-- Secure, consented biometric template repository for students
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_face_templates (
    id                     BIGINT       NOT NULL AUTO_INCREMENT,
    student_profile_id     BIGINT       NOT NULL,
    face_id                VARCHAR(64)  NOT NULL COMMENT 'Unique UUID linking to vector embedding',
    model_name             VARCHAR(50)  NOT NULL DEFAULT 'SFace',
    model_version          VARCHAR(30)  NOT NULL DEFAULT '2021dec',
    status                 VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE, REVOKED, EXPIRED',
    enrolled_by_user_id    BIGINT       NOT NULL,
    consent_recorded       BOOLEAN      NOT NULL DEFAULT TRUE,
    consent_timestamp      DATETIME(6)  NOT NULL DEFAULT NOW(6),
    quality_score          DOUBLE,
    created_at             DATETIME(6)  NOT NULL DEFAULT NOW(6),
    updated_at             DATETIME(6)  NOT NULL DEFAULT NOW(6),
    PRIMARY KEY (id),
    CONSTRAINT uq_sft_face_id UNIQUE (face_id),
    CONSTRAINT fk_sft_student_profile
        FOREIGN KEY (student_profile_id) REFERENCES student_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_sft_enrolled_by
        FOREIGN KEY (enrolled_by_user_id) REFERENCES users (id) ON DELETE RESTRICT
) COMMENT = 'Student facial biometric templates and enrollment metadata';

CREATE INDEX idx_sft_student_profile_id ON student_face_templates (student_profile_id);
CREATE INDEX idx_sft_face_id            ON student_face_templates (face_id);
CREATE INDEX idx_sft_status             ON student_face_templates (status);

-- ------------------------------------------------------------
-- 3. Populate existing users with role STUDENT into student_profiles
-- ------------------------------------------------------------
INSERT INTO student_profiles (user_id, prn, roll_number, department, academic_year, division, active, created_at, updated_at)
SELECT 
    u.id, 
    u.username, 
    CONCAT('R-', u.id), 
    'CE', 
    'TE', 
    '1', 
    TRUE, 
    NOW(6), 
    NOW(6)
FROM users u
WHERE u.role = 'STUDENT'
  AND NOT EXISTS (
      SELECT 1 FROM student_profiles sp WHERE sp.user_id = u.id
  );
