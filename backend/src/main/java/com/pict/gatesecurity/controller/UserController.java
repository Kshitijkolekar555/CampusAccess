package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.common.PageResponse;
import com.pict.gatesecurity.dto.user.*;
import com.pict.gatesecurity.entity.enums.UserRole;
import com.pict.gatesecurity.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "User CRUD, Profile, Role Assignment, and Status Management")
public class UserController {

    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create User", description = "Creates a new system user with assigned role (ADMIN only)")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody UserCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse response = userService.createUser(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "User created successfully"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get User by ID", description = "Fetches details of a user by ID (ADMIN only)")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Search & Filter Users", description = "Paginated list of users filtered by query, role, or active status (ADMIN only)")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getUsers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<UserResponse> userPage = userService.getUsers(query, role, active, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(userPage)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update User", description = "Updates user full name, role, email, and phone (ADMIN only)")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse response = userService.updateUser(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "User updated successfully"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Toggle User Status", description = "Activates or deactivates a user account (ADMIN only)")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UserStatusUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse response = userService.updateUserStatus(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "User status updated successfully"));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update Profile", description = "Updates current user's personal details or password")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @Valid @RequestBody UserProfileUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse response = userService.updateProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success(response, "Profile updated successfully"));
    }
}
