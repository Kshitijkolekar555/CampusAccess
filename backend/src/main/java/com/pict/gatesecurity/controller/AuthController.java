package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.dto.auth.AuthResponse;
import com.pict.gatesecurity.dto.auth.ChangePasswordRequest;
import com.pict.gatesecurity.dto.auth.ForgotPasswordRequest;
import com.pict.gatesecurity.dto.auth.LoginRequest;
import com.pict.gatesecurity.dto.auth.RefreshTokenRequest;
import com.pict.gatesecurity.dto.auth.ResetPasswordRequest;
import com.pict.gatesecurity.dto.user.UserCreateRequest;
import com.pict.gatesecurity.dto.user.UserResponse;
import com.pict.gatesecurity.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, Token Refresh, Logout, and User Info APIs")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "User Login", description = "Authenticates user credentials and returns JWT Access and Refresh tokens")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh Token", description = "Exchanges a valid refresh token for a new access token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Token refreshed successfully"));
    }

    @PostMapping("/logout")
    @Operation(summary = "User Logout", description = "Blacklists the current access token and revokes all refresh tokens")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        authService.logout(authHeader);
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get Current User Profile", description = "Returns details of currently authenticated user")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        UserResponse response = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "User profile retrieved successfully"));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change Password", description = "Changes the password for the currently authenticated user")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        authService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success(null, "Password changed successfully"));
    }

    @PostMapping("/register")
    @Operation(summary = "Self Registration", description = "Registers a new user account (VISITOR role only)")
    public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody UserCreateRequest request) {
        UserResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Registration successful"));
    }

    @PostMapping("/verify-prn")
    @Operation(summary = "Verify Student PRN", description = "Validates student PRN number, fetches student details, and returns authentication tokens")
    public ResponseEntity<ApiResponse<com.pict.gatesecurity.dto.auth.StudentAuthDto>> verifyPrn(
            @RequestParam String prn) {
        com.pict.gatesecurity.dto.auth.StudentAuthDto response = authService.verifyPrn(prn);
        return ResponseEntity.ok(ApiResponse.success(response, "PRN verified successfully"));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Forgot Password", description = "Generates a password reset token for the given username or email")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(null, "If the account exists, a reset link has been generated"));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset Password", description = "Resets the password using a valid reset token")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Password reset successfully"));
    }
}
