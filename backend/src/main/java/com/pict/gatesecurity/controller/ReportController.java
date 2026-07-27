package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.common.PageResponse;
import com.pict.gatesecurity.dto.report.*;
import com.pict.gatesecurity.service.AnalyticsService;
import com.pict.gatesecurity.service.ExportService;
import com.pict.gatesecurity.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Tag(name = "Reports & Analytics", description = "Report Generation, Export, and Analytics")
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final ReportService reportService;
    private final ExportService exportService;
    private final AnalyticsService analyticsService;

    // ==================== VISITOR REPORTS ====================

    @GetMapping("/visitors")
    @Operation(summary = "Visitor Report", description = "Paginated visitor report with filters")
    public ResponseEntity<ApiResponse<PageResponse<VisitorReportRow>>> getVisitorReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "timeIn") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(sortDir), sortBy));
        Page<VisitorReportRow> result = reportService.getVisitorReport(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/visitors/export")
    @Operation(summary = "Export Visitor Report")
    public void exportVisitorReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "csv") String format,
            HttpServletResponse response) {

        Page<VisitorReportRow> result = reportService.getVisitorReport(filter,
                PageRequest.of(0, 10000));
        List<VisitorReportRow> rows = result.getContent();
        ExportData exportData = exportService.buildVisitorExportData(rows);

        String filename = "visitor_report_" + LocalDate.now();
        switch (format.toLowerCase()) {
            case "xlsx", "excel" -> exportService.exportExcel(exportData, response, filename);
            case "pdf" -> exportService.exportPdf(exportData, response, filename);
            default -> exportService.exportCsv(exportData, response, filename);
        }
    }

    // ==================== VEHICLE REPORTS ====================

    @GetMapping("/vehicles")
    @Operation(summary = "Vehicle Report", description = "Paginated vehicle log report with filters")
    public ResponseEntity<ApiResponse<PageResponse<VehicleReportRow>>> getVehicleReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "entryTime") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(sortDir), sortBy));
        Page<VehicleReportRow> result = reportService.getVehicleReport(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/vehicles/export")
    @Operation(summary = "Export Vehicle Report")
    public void exportVehicleReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "csv") String format,
            HttpServletResponse response) {

        Page<VehicleReportRow> result = reportService.getVehicleReport(filter,
                PageRequest.of(0, 10000));
        ExportData exportData = exportService.buildVehicleExportData(result.getContent());

        String filename = "vehicle_report_" + LocalDate.now();
        switch (format.toLowerCase()) {
            case "xlsx", "excel" -> exportService.exportExcel(exportData, response, filename);
            case "pdf" -> exportService.exportPdf(exportData, response, filename);
            default -> exportService.exportCsv(exportData, response, filename);
        }
    }

    // ==================== STUDENT GATE PASS REPORTS ====================

    @GetMapping("/student-passes")
    @Operation(summary = "Student Gate Pass Report", description = "Paginated student gate pass report")
    public ResponseEntity<ApiResponse<PageResponse<StudentGatePassReportRow>>> getStudentGatePassReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(sortDir), sortBy));
        Page<StudentGatePassReportRow> result = reportService.getStudentGatePassReport(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/student-passes/export")
    @Operation(summary = "Export Student Gate Pass Report")
    public void exportStudentGatePassReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "csv") String format,
            HttpServletResponse response) {

        Page<StudentGatePassReportRow> result = reportService.getStudentGatePassReport(filter,
                PageRequest.of(0, 10000));
        ExportData exportData = exportService.buildStudentGatePassExportData(result.getContent());

        String filename = "student_gate_pass_report_" + LocalDate.now();
        switch (format.toLowerCase()) {
            case "xlsx", "excel" -> exportService.exportExcel(exportData, response, filename);
            case "pdf" -> exportService.exportPdf(exportData, response, filename);
            default -> exportService.exportCsv(exportData, response, filename);
        }
    }

    // ==================== HOSTEL OUTPASS REPORTS ====================

    @GetMapping("/hostel-outpasses")
    @Operation(summary = "Hostel Outpass Report", description = "Paginated hostel outpass report")
    public ResponseEntity<ApiResponse<PageResponse<HostelOutpassReportRow>>> getHostelOutpassReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(sortDir), sortBy));
        Page<HostelOutpassReportRow> result = reportService.getHostelOutpassReport(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/hostel-outpasses/export")
    @Operation(summary = "Export Hostel Outpass Report")
    public void exportHostelOutpassReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "csv") String format,
            HttpServletResponse response) {

        Page<HostelOutpassReportRow> result = reportService.getHostelOutpassReport(filter,
                PageRequest.of(0, 10000));
        ExportData exportData = exportService.buildHostelOutpassExportData(result.getContent());

        String filename = "hostel_outpass_report_" + LocalDate.now();
        switch (format.toLowerCase()) {
            case "xlsx", "excel" -> exportService.exportExcel(exportData, response, filename);
            case "pdf" -> exportService.exportPdf(exportData, response, filename);
            default -> exportService.exportCsv(exportData, response, filename);
        }
    }

    // ==================== VENDOR REPORTS ====================

    @GetMapping("/vendors")
    @Operation(summary = "Vendor Report", description = "Paginated vendor visit report")
    public ResponseEntity<ApiResponse<PageResponse<VendorReportRow>>> getVendorReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "entryTime") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(sortDir), sortBy));
        Page<VendorReportRow> result = reportService.getVendorReport(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/vendors/export")
    @Operation(summary = "Export Vendor Report")
    public void exportVendorReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "csv") String format,
            HttpServletResponse response) {

        Page<VendorReportRow> result = reportService.getVendorReport(filter,
                PageRequest.of(0, 10000));
        ExportData exportData = exportService.buildVendorExportData(result.getContent());

        String filename = "vendor_report_" + LocalDate.now();
        switch (format.toLowerCase()) {
            case "xlsx", "excel" -> exportService.exportExcel(exportData, response, filename);
            case "pdf" -> exportService.exportPdf(exportData, response, filename);
            default -> exportService.exportCsv(exportData, response, filename);
        }
    }

    // ==================== GUARD ATTENDANCE REPORTS ====================

    @GetMapping("/guard-attendance")
    @Operation(summary = "Guard Attendance Report", description = "Paginated guard attendance report")
    public ResponseEntity<ApiResponse<PageResponse<GuardAttendanceReportRow>>> getGuardAttendanceReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "date") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(sortDir), sortBy));
        Page<GuardAttendanceReportRow> result = reportService.getGuardAttendanceReport(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/guard-attendance/export")
    @Operation(summary = "Export Guard Attendance Report")
    public void exportGuardAttendanceReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "csv") String format,
            HttpServletResponse response) {

        Page<GuardAttendanceReportRow> result = reportService.getGuardAttendanceReport(filter,
                PageRequest.of(0, 10000));
        ExportData exportData = exportService.buildGuardAttendanceExportData(result.getContent());

        String filename = "guard_attendance_report_" + LocalDate.now();
        switch (format.toLowerCase()) {
            case "xlsx", "excel" -> exportService.exportExcel(exportData, response, filename);
            case "pdf" -> exportService.exportPdf(exportData, response, filename);
            default -> exportService.exportCsv(exportData, response, filename);
        }
    }

    // ==================== GUARD SHIFT REPORTS ====================

    @GetMapping("/guard-shifts")
    @Operation(summary = "Guard Shift Report", description = "Paginated guard shift report")
    public ResponseEntity<ApiResponse<PageResponse<GuardShiftReportRow>>> getGuardShiftReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "date") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(sortDir), sortBy));
        Page<GuardShiftReportRow> result = reportService.getGuardShiftReport(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/guard-shifts/export")
    @Operation(summary = "Export Guard Shift Report")
    public void exportGuardShiftReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "csv") String format,
            HttpServletResponse response) {

        Page<GuardShiftReportRow> result = reportService.getGuardShiftReport(filter,
                PageRequest.of(0, 10000));
        ExportData exportData = exportService.buildGuardShiftExportData(result.getContent());

        String filename = "guard_shift_report_" + LocalDate.now();
        switch (format.toLowerCase()) {
            case "xlsx", "excel" -> exportService.exportExcel(exportData, response, filename);
            case "pdf" -> exportService.exportPdf(exportData, response, filename);
            default -> exportService.exportCsv(exportData, response, filename);
        }
    }

    // ==================== GATE ACTIVITY REPORTS ====================

    @GetMapping("/gate-activity")
    @Operation(summary = "Gate Activity Report", description = "Gate activity report by date range")
    public ResponseEntity<ApiResponse<PageResponse<GateActivityReportRow>>> getGateActivityReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<GateActivityReportRow> result = reportService.getGateActivityReport(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/gate-activity/export")
    @Operation(summary = "Export Gate Activity Report")
    public void exportGateActivityReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "csv") String format,
            HttpServletResponse response) {

        Page<GateActivityReportRow> result = reportService.getGateActivityReport(filter,
                PageRequest.of(0, 10000));
        ExportData exportData = exportService.buildGateActivityExportData(result.getContent());

        String filename = "gate_activity_report_" + LocalDate.now();
        switch (format.toLowerCase()) {
            case "xlsx", "excel" -> exportService.exportExcel(exportData, response, filename);
            case "pdf" -> exportService.exportPdf(exportData, response, filename);
            default -> exportService.exportCsv(exportData, response, filename);
        }
    }

    // ==================== AUDIT LOG REPORTS ====================

    @GetMapping("/audit-logs")
    @Operation(summary = "Audit Log Report", description = "Paginated audit log report")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogReportRow>>> getAuditLogReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(sortDir), sortBy));
        Page<AuditLogReportRow> result = reportService.getAuditLogReport(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/audit-logs/export")
    @Operation(summary = "Export Audit Log Report")
    public void exportAuditLogReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "csv") String format,
            HttpServletResponse response) {

        Page<AuditLogReportRow> result = reportService.getAuditLogReport(filter,
                PageRequest.of(0, 10000));
        ExportData exportData = exportService.buildAuditLogExportData(result.getContent());

        String filename = "audit_log_report_" + LocalDate.now();
        switch (format.toLowerCase()) {
            case "xlsx", "excel" -> exportService.exportExcel(exportData, response, filename);
            case "pdf" -> exportService.exportPdf(exportData, response, filename);
            default -> exportService.exportCsv(exportData, response, filename);
        }
    }

    // ==================== NOTIFICATION REPORTS ====================

    @GetMapping("/notifications")
    @Operation(summary = "Notification Report", description = "Paginated notification report")
    public ResponseEntity<ApiResponse<PageResponse<NotificationReportRow>>> getNotificationReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(sortDir), sortBy));
        Page<NotificationReportRow> result = reportService.getNotificationReport(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/notifications/export")
    @Operation(summary = "Export Notification Report")
    public void exportNotificationReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "csv") String format,
            HttpServletResponse response) {

        Page<NotificationReportRow> result = reportService.getNotificationReport(filter,
                PageRequest.of(0, 10000));
        ExportData exportData = exportService.buildNotificationExportData(result.getContent());

        String filename = "notification_report_" + LocalDate.now();
        switch (format.toLowerCase()) {
            case "xlsx", "excel" -> exportService.exportExcel(exportData, response, filename);
            case "pdf" -> exportService.exportPdf(exportData, response, filename);
            default -> exportService.exportCsv(exportData, response, filename);
        }
    }

    // ==================== PERIODIC REPORTS ====================

    @GetMapping("/daily")
    @Operation(summary = "Daily Report", description = "Day-by-day activity report")
    public ResponseEntity<ApiResponse<PageResponse<PeriodicReportRow>>> getDailyReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "31") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("periodStart").descending());
        Page<PeriodicReportRow> result = reportService.getDailyReport(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/daily/export")
    @Operation(summary = "Export Daily Report")
    public void exportDailyReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "csv") String format,
            HttpServletResponse response) {

        Page<PeriodicReportRow> result = reportService.getDailyReport(filter,
                PageRequest.of(0, 10000));
        ExportData exportData = exportService.buildPeriodicExportData(result.getContent(), "Daily Report");

        String filename = "daily_report_" + LocalDate.now();
        switch (format.toLowerCase()) {
            case "xlsx", "excel" -> exportService.exportExcel(exportData, response, filename);
            case "pdf" -> exportService.exportPdf(exportData, response, filename);
            default -> exportService.exportCsv(exportData, response, filename);
        }
    }

    @GetMapping("/weekly")
    @Operation(summary = "Weekly Report", description = "Week-by-week activity report")
    public ResponseEntity<ApiResponse<PageResponse<PeriodicReportRow>>> getWeeklyReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("periodStart").descending());
        Page<PeriodicReportRow> result = reportService.getWeeklyReport(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/weekly/export")
    @Operation(summary = "Export Weekly Report")
    public void exportWeeklyReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "csv") String format,
            HttpServletResponse response) {

        Page<PeriodicReportRow> result = reportService.getWeeklyReport(filter,
                PageRequest.of(0, 1000));
        ExportData exportData = exportService.buildPeriodicExportData(result.getContent(), "Weekly Report");

        String filename = "weekly_report_" + LocalDate.now();
        switch (format.toLowerCase()) {
            case "xlsx", "excel" -> exportService.exportExcel(exportData, response, filename);
            case "pdf" -> exportService.exportPdf(exportData, response, filename);
            default -> exportService.exportCsv(exportData, response, filename);
        }
    }

    @GetMapping("/monthly")
    @Operation(summary = "Monthly Report", description = "Month-by-month activity report")
    public ResponseEntity<ApiResponse<PageResponse<PeriodicReportRow>>> getMonthlyReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("periodStart").descending());
        Page<PeriodicReportRow> result = reportService.getMonthlyReport(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/monthly/export")
    @Operation(summary = "Export Monthly Report")
    public void exportMonthlyReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "csv") String format,
            HttpServletResponse response) {

        Page<PeriodicReportRow> result = reportService.getMonthlyReport(filter,
                PageRequest.of(0, 1000));
        ExportData exportData = exportService.buildPeriodicExportData(result.getContent(), "Monthly Report");

        String filename = "monthly_report_" + LocalDate.now();
        switch (format.toLowerCase()) {
            case "xlsx", "excel" -> exportService.exportExcel(exportData, response, filename);
            case "pdf" -> exportService.exportPdf(exportData, response, filename);
            default -> exportService.exportCsv(exportData, response, filename);
        }
    }

    @GetMapping("/yearly")
    @Operation(summary = "Yearly Report", description = "Year-by-year activity report")
    public ResponseEntity<ApiResponse<PageResponse<PeriodicReportRow>>> getYearlyReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("periodStart").descending());
        Page<PeriodicReportRow> result = reportService.getYearlyReport(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/yearly/export")
    @Operation(summary = "Export Yearly Report")
    public void exportYearlyReport(
            @ModelAttribute ReportFilterRequest filter,
            @RequestParam(defaultValue = "csv") String format,
            HttpServletResponse response) {

        Page<PeriodicReportRow> result = reportService.getYearlyReport(filter,
                PageRequest.of(0, 100));
        ExportData exportData = exportService.buildPeriodicExportData(result.getContent(), "Yearly Report");

        String filename = "yearly_report_" + LocalDate.now();
        switch (format.toLowerCase()) {
            case "xlsx", "excel" -> exportService.exportExcel(exportData, response, filename);
            case "pdf" -> exportService.exportPdf(exportData, response, filename);
            default -> exportService.exportCsv(exportData, response, filename);
        }
    }

    // ==================== DASHBOARD ====================

    @GetMapping("/dashboard/summary")
    @Operation(summary = "Dashboard Summary", description = "Live dashboard with key metrics")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getDashboardSummary() {
        DashboardSummaryResponse summary = reportService.getDashboardSummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
