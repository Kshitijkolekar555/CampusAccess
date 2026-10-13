package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.student.StudentEnrollmentRequest;
import com.pict.gatesecurity.dto.student.StudentVerificationResponse;
import org.springframework.web.multipart.MultipartFile;

public interface StudentVerificationService {

    /**
     * Identifies student from live camera frame via 1:N neural face recognition,
     * verifies their current passes and returns verified profile.
     */
    StudentVerificationResponse identifyAndVerifyStudentFace(MultipartFile photo, String performingUsername);

    /**
     * Manual fallback by PRN/phone when face recognition fails or student opts out of biometrics.
     * Enforces identical gate-pass and outpass authorization rules without bypassing checks.
     */
    StudentVerificationResponse verifyStudentManual(String query, String performingUsername);

    /**
     * Enrolls student facial template linked to unique PRN and student profile.
     * Requires consent record and role authorization.
     */
    StudentVerificationResponse enrollStudentFace(String prn, MultipartFile photo, StudentEnrollmentRequest request, String performingUsername);

    /**
     * Revokes biometric enrollment for student.
     */
    boolean revokeStudentBiometrics(String prn, String performingUsername);
}
