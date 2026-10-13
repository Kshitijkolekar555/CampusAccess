package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.dto.student.StudentEnrollmentRequest;
import com.pict.gatesecurity.dto.student.StudentVerificationResponse;
import com.pict.gatesecurity.service.StudentVerificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Student Biometrics & Verification", description = "Camera-only student face identification and guard verification")
public class StudentVerificationController {

    private final StudentVerificationService studentVerificationService;

    @PostMapping(value = "/verify-face", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Identify & Verify Student Face", description = "Scans camera image, identifies enrolled student via 1:N neural recognition, checks active passes")
    public ResponseEntity<ApiResponse<StudentVerificationResponse>> verifyFace(
            @RequestParam("photo") MultipartFile photo,
            @AuthenticationPrincipal UserDetails userDetails) {
        StudentVerificationResponse response = studentVerificationService.identifyAndVerifyStudentFace(photo, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, response.isIdentified() ? "Student identified successfully" : "Student not identified"));
    }

    @GetMapping("/verify-manual")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Manual Student Verification", description = "Non-biometric fallback lookup by PRN with strict pass status validation")
    public ResponseEntity<ApiResponse<StudentVerificationResponse>> verifyManual(
            @RequestParam("query") String query,
            @AuthenticationPrincipal UserDetails userDetails) {
        StudentVerificationResponse response = studentVerificationService.verifyStudentManual(query, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping(value = "/enroll-face", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY_OFFICER', 'HOSTEL_WARDEN')")
    @Operation(summary = "Enroll Student Face Biometrics", description = "Captures approved student face photo, verifies quality, and associates template with PRN")
    public ResponseEntity<ApiResponse<StudentVerificationResponse>> enrollFace(
            @RequestParam("prn") String prn,
            @RequestPart("photo") MultipartFile photo,
            @RequestPart(value = "data", required = false) StudentEnrollmentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (request == null) {
            request = StudentEnrollmentRequest.builder().prn(prn).consentRecorded(true).build();
        }
        StudentVerificationResponse response = studentVerificationService.enrollStudentFace(prn, photo, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Student face enrolled successfully"));
    }

    @DeleteMapping("/revoke-biometrics/{prn}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY_OFFICER')")
    @Operation(summary = "Revoke Student Biometrics", description = "Revokes and deletes enrolled face templates for student")
    public ResponseEntity<ApiResponse<Void>> revokeBiometrics(
            @PathVariable String prn,
            @AuthenticationPrincipal UserDetails userDetails) {
        studentVerificationService.revokeStudentBiometrics(prn, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null, "Student biometrics revoked successfully"));
    }
}
