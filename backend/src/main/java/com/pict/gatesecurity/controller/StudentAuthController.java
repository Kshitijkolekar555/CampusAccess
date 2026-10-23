package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.dto.auth.AuthResponse;
import com.pict.gatesecurity.dto.student.StudentRegisterRequest;
import com.pict.gatesecurity.dto.student.StudentVerifyResponse;
import com.pict.gatesecurity.service.StudentAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth/student")
@RequiredArgsConstructor
@Tag(name = "Student Authentication", description = "Student verification against authorized dataset and self-registration")
public class StudentAuthController {

    private final StudentAuthService studentAuthService;

    @GetMapping("/verify-id")
    @Operation(summary = "Verify Student Eligibility", description = "Validates student ID or PRN against the authorized dataset")
    public ResponseEntity<ApiResponse<StudentVerifyResponse>> verifyStudentId(
            @RequestParam String studentId) {
        StudentVerifyResponse response = studentAuthService.verifyStudentId(studentId);
        return ResponseEntity.ok(ApiResponse.success(response, response.getMessage()));
    }

    @PostMapping("/register")
    @Operation(summary = "Register Student Account", description = "Registers a new student account verified against the authorized dataset")
    public ResponseEntity<ApiResponse<AuthResponse>> registerStudent(
            @Valid @RequestBody StudentRegisterRequest request) {
        AuthResponse response = studentAuthService.registerStudent(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Student account created successfully"));
    }
}
