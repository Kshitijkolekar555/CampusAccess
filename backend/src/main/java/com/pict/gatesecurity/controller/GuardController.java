package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.common.PageResponse;
import com.pict.gatesecurity.dto.guard.*;
import com.pict.gatesecurity.service.GuardService;
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
@RequestMapping("/api/v1/guards")
@RequiredArgsConstructor
@Tag(name = "Guard & Gate Operations", description = "Guard Profiles, Duty Shift Management, Shift Activity Logs, and Operations Dashboard")
public class GuardController {

    private final GuardService guardService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Register Guard Profile", description = "Maps an existing user account to a guard employee profile (ADMIN only)")
    public ResponseEntity<ApiResponse<GuardResponse>> createGuard(
            @Valid @RequestBody GuardCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        GuardResponse response = guardService.createGuard(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Guard profile created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update Guard Assignment", description = "Updates guard's assigned gate or active status (ADMIN only)")
    public ResponseEntity<ApiResponse<GuardResponse>> updateGuard(
            @PathVariable Long id,
            @Valid @RequestBody GuardUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        GuardResponse response = guardService.updateGuard(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Guard profile updated successfully"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get Guard Details", description = "Fetches guard profile by ID (ADMIN only)")
    public ResponseEntity<ApiResponse<GuardResponse>> getGuardById(@PathVariable Long id) {
        GuardResponse response = guardService.getGuardById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List Security Guards", description = "Paginated list of guard profiles (ADMIN only)")
    public ResponseEntity<ApiResponse<PageResponse<GuardResponse>>> getGuards(
            @RequestParam(required = false, defaultValue = "false") Boolean activeOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<GuardResponse> guardPage = guardService.getGuards(activeOnly, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(guardPage)));
    }

    @PostMapping("/shifts/start")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Clock-In Guard Shift", description = "Starts an ONGOING duty shift at a specified campus gate")
    public ResponseEntity<ApiResponse<ShiftResponse>> startShift(
            @Valid @RequestBody ShiftStartRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ShiftResponse response = guardService.startShift(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Shift started successfully"));
    }

    @PostMapping("/shifts/end")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Clock-Out Guard Shift", description = "Ends current ONGOING duty shift for logged-in guard")
    public ResponseEntity<ApiResponse<ShiftResponse>> endShift(@AuthenticationPrincipal UserDetails userDetails) {
        ShiftResponse response = guardService.endShift(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Shift ended successfully"));
    }

    @GetMapping("/shifts/current")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Get Current Active Shift", description = "Returns active ONGOING shift details for current guard")
    public ResponseEntity<ApiResponse<ShiftResponse>> getCurrentShift(@AuthenticationPrincipal UserDetails userDetails) {
        ShiftResponse response = guardService.getCurrentShift(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/shifts/history")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Get Guard Shift History", description = "Paginated list of historical duty shifts for logged-in guard")
    public ResponseEntity<ApiResponse<PageResponse<ShiftResponse>>> getShiftHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("startTime").descending());
        Page<ShiftResponse> historyPage = guardService.getShiftHistory(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(historyPage)));
    }

    @PostMapping("/shifts/{shiftId}/logs")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Log Shift Activity", description = "Logs security check, incident, task, or general activity during active shift")
    public ResponseEntity<ApiResponse<ShiftLogResponse>> addShiftLog(
            @PathVariable Long shiftId,
            @Valid @RequestBody ShiftLogCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ShiftLogResponse response = guardService.addShiftLog(shiftId, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Shift activity logged successfully"));
    }

    @GetMapping("/shifts/{shiftId}/logs")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Get Shift Activity Logs", description = "Paginated activity log entries for a specific shift")
    public ResponseEntity<ApiResponse<PageResponse<ShiftLogResponse>>> getShiftLogs(
            @PathVariable Long shiftId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
        Page<ShiftLogResponse> logPage = guardService.getShiftLogs(shiftId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(logPage)));
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Guard & Operations Dashboard Metrics", description = "Summary counts of active shifts, guards, active visitors inside, today's check-ins, and recent activity logs")
    public ResponseEntity<ApiResponse<GuardDashboardResponse>> getGuardDashboard() {
        GuardDashboardResponse response = guardService.getGuardDashboard();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
