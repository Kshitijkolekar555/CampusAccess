package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.dto.report.*;
import com.pict.gatesecurity.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Analytics and Insights")
@PreAuthorize("hasAnyRole('ADMIN', 'SECURITY_OFFICER', 'SECURITY_GUARD', 'GUARD', 'STAFF', 'FACULTY')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/peak-entry-hours")
    @Operation(summary = "Peak Entry Hours", description = "Visitor check-in distribution by hour of day")
    public ResponseEntity<ApiResponse<List<PeakHoursResponse>>> getPeakEntryHours(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        return ResponseEntity.ok(ApiResponse.success(analyticsService.getPeakEntryHours(fromDate, toDate)));
    }

    @GetMapping("/peak-exit-hours")
    @Operation(summary = "Peak Exit Hours", description = "Visitor check-out distribution by hour of day")
    public ResponseEntity<ApiResponse<List<PeakHoursResponse>>> getPeakExitHours(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        return ResponseEntity.ok(ApiResponse.success(analyticsService.getPeakExitHours(fromDate, toDate)));
    }

    @GetMapping("/daily-visitor-trend")
    @Operation(summary = "Daily Visitor Trend", description = "Daily visitor count over time")
    public ResponseEntity<ApiResponse<List<TrendDataPoint>>> getDailyVisitorTrend(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        return ResponseEntity.ok(ApiResponse.success(analyticsService.getDailyVisitorTrend(fromDate, toDate)));
    }

    @GetMapping("/monthly-visitor-trend")
    @Operation(summary = "Monthly Visitor Trend", description = "Monthly visitor count over time")
    public ResponseEntity<ApiResponse<List<TrendDataPoint>>> getMonthlyVisitorTrend(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        return ResponseEntity.ok(ApiResponse.success(analyticsService.getMonthlyVisitorTrend(fromDate, toDate)));
    }

    @GetMapping("/vehicle-trends")
    @Operation(summary = "Vehicle Trends", description = "Daily vehicle entries and exits over time")
    public ResponseEntity<ApiResponse<List<TrendDataPoint>>> getVehicleTrends(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        return ResponseEntity.ok(ApiResponse.success(analyticsService.getVehicleTrends(fromDate, toDate)));
    }

    @GetMapping("/guard-performance")
    @Operation(summary = "Guard Performance", description = "Performance metrics per guard")
    public ResponseEntity<ApiResponse<List<GuardPerformanceResponse>>> getGuardPerformance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        return ResponseEntity.ok(ApiResponse.success(analyticsService.getGuardPerformance(fromDate, toDate)));
    }

    @GetMapping("/department-visitors")
    @Operation(summary = "Department-wise Visitors", description = "Visitor count by host department")
    public ResponseEntity<ApiResponse<List<DepartmentVisitorResponse>>> getDepartmentWiseVisitors(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        return ResponseEntity.ok(ApiResponse.success(analyticsService.getDepartmentWiseVisitors(fromDate, toDate)));
    }

    @GetMapping("/vendor-statistics")
    @Operation(summary = "Vendor Statistics", description = "Visit statistics per vendor")
    public ResponseEntity<ApiResponse<List<VendorStatisticsResponse>>> getVendorStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        return ResponseEntity.ok(ApiResponse.success(analyticsService.getVendorStatistics(fromDate, toDate)));
    }

    @GetMapping("/gate-utilization")
    @Operation(summary = "Gate Utilization", description = "Utilization metrics per gate")
    public ResponseEntity<ApiResponse<List<GateUtilizationResponse>>> getGateUtilization(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        return ResponseEntity.ok(ApiResponse.success(analyticsService.getGateUtilization(fromDate, toDate)));
    }
}
