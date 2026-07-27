package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.common.PageResponse;
import com.pict.gatesecurity.dto.report.*;
import com.pict.gatesecurity.dto.search.SearchFilterRequest;
import com.pict.gatesecurity.service.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
@Tag(name = "Advanced Search", description = "Dynamic multi-entity search with Specification API")
@PreAuthorize("hasAnyRole('ADMIN', 'SECURITY_OFFICER')")
public class SearchController {

    private final SearchService searchService;

    @GetMapping("/visitors")
    @Operation(summary = "Search Visitors", description = "Dynamic search across visitors with filters for name, mobile, department, gate, date range, inside/outside status")
    public ResponseEntity<ApiResponse<PageResponse<VisitorReportRow>>> searchVisitors(
            @ModelAttribute SearchFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.fromString(filter.getSortDirOrDefault()), filter.getSortByOrDefault()));
        @SuppressWarnings("unchecked")
        Page<VisitorReportRow> result = (Page<VisitorReportRow>) searchService.searchVisitorsAsProjection(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/vehicles")
    @Operation(summary = "Search Vehicles", description = "Dynamic search across vehicle logs with filters for registration, category, gate, driver, date range")
    public ResponseEntity<ApiResponse<PageResponse<VehicleReportRow>>> searchVehicles(
            @ModelAttribute SearchFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.fromString(filter.getSortDirOrDefault()), filter.getSortByOrDefault()));
        @SuppressWarnings("unchecked")
        Page<VehicleReportRow> result = (Page<VehicleReportRow>) searchService.searchVehiclesAsProjection(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/gate-passes")
    @Operation(summary = "Search Student Gate Passes", description = "Dynamic search across gate passes with filters for student, status, department, date range")
    public ResponseEntity<ApiResponse<PageResponse<StudentGatePassReportRow>>> searchGatePasses(
            @ModelAttribute SearchFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.fromString(filter.getSortDirOrDefault()), filter.getSortByOrDefault()));
        @SuppressWarnings("unchecked")
        Page<StudentGatePassReportRow> result = (Page<StudentGatePassReportRow>) searchService.searchStudentGatePassesAsProjection(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/hostel-outpasses")
    @Operation(summary = "Search Hostel Outpasses", description = "Dynamic search across hostel outpasses with filters for hostel, status, student, date range")
    public ResponseEntity<ApiResponse<PageResponse<HostelOutpassReportRow>>> searchHostelOutpasses(
            @ModelAttribute SearchFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.fromString(filter.getSortDirOrDefault()), filter.getSortByOrDefault()));
        @SuppressWarnings("unchecked")
        Page<HostelOutpassReportRow> result = (Page<HostelOutpassReportRow>) searchService.searchHostelOutpassesAsProjection(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/guards")
    @Operation(summary = "Search Guards", description = "Dynamic search across guards with filters for gate, employee code, name")
    public ResponseEntity<ApiResponse<PageResponse<GuardAttendanceReportRow>>> searchGuards(
            @ModelAttribute SearchFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.fromString(filter.getSortDirOrDefault()), filter.getSortByOrDefault()));
        @SuppressWarnings("unchecked")
        Page<GuardAttendanceReportRow> result = (Page<GuardAttendanceReportRow>) searchService.searchGuardsAsProjection(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/vendors")
    @Operation(summary = "Search Vendor Visits", description = "Dynamic search across vendor visits with filters for company, gate, date range, inside status")
    public ResponseEntity<ApiResponse<PageResponse<VendorReportRow>>> searchVendors(
            @ModelAttribute SearchFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.fromString(filter.getSortDirOrDefault()), filter.getSortByOrDefault()));
        @SuppressWarnings("unchecked")
        Page<VendorReportRow> result = (Page<VendorReportRow>) searchService.searchVendorsAsProjection(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/notifications")
    @Operation(summary = "Search Notifications", description = "Dynamic search across notifications with filters for recipient, type, status, date range")
    public ResponseEntity<ApiResponse<PageResponse<NotificationReportRow>>> searchNotifications(
            @ModelAttribute SearchFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.fromString(filter.getSortDirOrDefault()), filter.getSortByOrDefault()));
        @SuppressWarnings("unchecked")
        Page<NotificationReportRow> result = (Page<NotificationReportRow>) searchService.searchNotificationsAsProjection(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Search Audit Logs", description = "Dynamic search across audit logs with filters for entity type, action, user, date range")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogReportRow>>> searchAuditLogs(
            @ModelAttribute SearchFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.fromString(filter.getSortDirOrDefault()), filter.getSortByOrDefault()));
        @SuppressWarnings("unchecked")
        Page<AuditLogReportRow> result = (Page<AuditLogReportRow>) searchService.searchAuditLogsAsProjection(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }
}
