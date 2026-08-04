package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.dto.dashboard.*;
import com.pict.gatesecurity.dto.report.GuardPerformanceResponse;
import com.pict.gatesecurity.dto.report.PeakHoursResponse;
import com.pict.gatesecurity.entity.User;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.repository.UserRepository;
import com.pict.gatesecurity.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard & Monitoring", description = "Admin, Guard, and Warden dashboards with real-time monitoring")
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserRepository userRepository;

    // ==================== ADMIN DASHBOARD ====================

    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY_OFFICER')")
    @Operation(summary = "Admin Dashboard",
            description = "Today's visitors, vehicles, passes, guards on duty, pending approvals, watchlist matches, recent activities")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getAdminDashboard() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getAdminDashboard()));
    }

    // ==================== GUARD DASHBOARD ====================

    @GetMapping("/guard")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Guard Self-Dashboard",
            description = "Current shift, assigned gate, visitors/vehicles/vendors processed, shift duration, recent logs")
    public ResponseEntity<ApiResponse<GuardSelfDashboardResponse>> getGuardDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getGuardSelfDashboard(userId)));
    }

    // ==================== WARDEN DASHBOARD ====================

    @GetMapping("/warden")
    @PreAuthorize("hasAnyRole('HOSTEL_WARDEN', 'ADMIN')")
    @Operation(summary = "Hostel Warden Dashboard",
            description = "Pending outpass requests, approved, rejected, late returns, active outpasses")
    public ResponseEntity<ApiResponse<WardenDashboardResponse>> getWardenDashboard(
            @RequestParam(required = false) String hostel) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getWardenDashboard(hostel)));
    }

    // ==================== STUDENT & VISITOR DASHBOARDS ====================

    @GetMapping("/student")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @Operation(summary = "Student Dashboard", description = "Student passes and outpasses status")
    public ResponseEntity<ApiResponse<String>> getStudentDashboard() {
        return ResponseEntity.ok(ApiResponse.success("Student Dashboard Active"));
    }

    @GetMapping("/visitor")
    @PreAuthorize("hasAnyRole('VISITOR', 'ADMIN')")
    @Operation(summary = "Visitor Dashboard", description = "Visitor pass and token status")
    public ResponseEntity<ApiResponse<String>> getVisitorDashboard() {
        return ResponseEntity.ok(ApiResponse.success("Visitor Dashboard Active"));
    }

    // ==================== ANALYTICS ====================

    @GetMapping("/analytics/daily-trends")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY_OFFICER')")
    @Operation(summary = "Daily Trends", description = "Daily visitor, vehicle, and vendor entry trends")
    public ResponseEntity<ApiResponse<DailyTrendResponse>> getDailyTrends(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getDailyTrends(fromDate, toDate)));
    }

    @GetMapping("/analytics/weekly-trends")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY_OFFICER')")
    @Operation(summary = "Weekly Trends", description = "Weekly aggregated visitor count")
    public ResponseEntity<ApiResponse<List<DashboardService.TrendPoint>>> getWeeklyTrends(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getWeeklyTrends(fromDate, toDate)));
    }

    @GetMapping("/analytics/monthly-trends")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY_OFFICER')")
    @Operation(summary = "Monthly Trends", description = "Monthly aggregated visitor count")
    public ResponseEntity<ApiResponse<List<DashboardService.TrendPoint>>> getMonthlyTrends(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getMonthlyTrends(fromDate, toDate)));
    }

    @GetMapping("/analytics/department")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY_OFFICER')")
    @Operation(summary = "Department Analytics", description = "Visitor and gate pass counts by department")
    public ResponseEntity<ApiResponse<List<DashboardService.DepartmentTrendPoint>>> getDepartmentAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getDepartmentAnalytics(fromDate, toDate)));
    }

    @GetMapping("/analytics/gates")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY_OFFICER')")
    @Operation(summary = "Gate Analytics", description = "Per-gate visitor, vehicle, vendor, and shift counts")
    public ResponseEntity<ApiResponse<List<DashboardService.GateTrendPoint>>> getGateAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getGateAnalytics(fromDate, toDate)));
    }

    @GetMapping("/analytics/vehicles")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY_OFFICER')")
    @Operation(summary = "Vehicle Analytics", description = "Vehicle entries, exits, and currently inside by category")
    public ResponseEntity<ApiResponse<List<DashboardService.VehicleTrendPoint>>> getVehicleAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getVehicleAnalytics(fromDate, toDate)));
    }

    @GetMapping("/analytics/visitors")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY_OFFICER')")
    @Operation(summary = "Visitor Analytics", description = "Peak visitor entry hours distribution")
    public ResponseEntity<ApiResponse<List<PeakHoursResponse>>> getVisitorAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getVisitorAnalytics(fromDate, toDate)));
    }

    @GetMapping("/analytics/guard-performance")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY_OFFICER')")
    @Operation(summary = "Guard Performance", description = "Per-guard shift statistics and performance metrics")
    public ResponseEntity<ApiResponse<List<GuardPerformanceResponse>>> getGuardPerformance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getGuardPerformance(fromDate, toDate)));
    }

    // ==================== RECENT ACTIVITIES ====================

    @GetMapping("/activities")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY_OFFICER')")
    @Operation(summary = "Recent Activities", description = "Latest audit log entries across the system")
    public ResponseEntity<ApiResponse<List<RecentActivityRow>>> getRecentActivities(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getRecentActivities(limit)));
    }

    // ==================== HELPER ====================

    private Long resolveUserId(UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
                .map(User::getId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userDetails.getUsername()));
    }
}
