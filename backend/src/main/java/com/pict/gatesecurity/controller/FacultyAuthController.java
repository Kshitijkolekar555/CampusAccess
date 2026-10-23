package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.dto.auth.AuthResponse;
import com.pict.gatesecurity.dto.faculty.FacultyRegisterRequest;
import com.pict.gatesecurity.dto.faculty.FacultyVerifyResponse;
import com.pict.gatesecurity.service.FacultyOutpassService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth/faculty")
@RequiredArgsConstructor
@Tag(name = "Faculty Authentication", description = "Faculty verification against authorized roster and self-registration")
public class FacultyAuthController {

    private final FacultyOutpassService facultyOutpassService;

    @GetMapping("/verify-empno")
    @Operation(summary = "Verify Faculty Eligibility", description = "Validates faculty ID (empno) against the authorized dataset")
    public ResponseEntity<ApiResponse<FacultyVerifyResponse>> verifyEmpNo(
            @RequestParam String empNo) {
        FacultyVerifyResponse response = facultyOutpassService.verifyFacultyEmpNo(empNo);
        return ResponseEntity.ok(ApiResponse.success(response, response.getMessage()));
    }

    @PostMapping("/register")
    @Operation(summary = "Register Faculty Account", description = "Registers a new faculty account verified against the authorized dataset")
    public ResponseEntity<ApiResponse<AuthResponse>> registerFaculty(
            @Valid @RequestBody FacultyRegisterRequest request) {
        AuthResponse response = facultyOutpassService.registerFaculty(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Faculty account created successfully"));
    }
}
