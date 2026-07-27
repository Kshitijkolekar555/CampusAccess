package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.report.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReportService {

    Page<VisitorReportRow> getVisitorReport(ReportFilterRequest filter, Pageable pageable);

    Page<VehicleReportRow> getVehicleReport(ReportFilterRequest filter, Pageable pageable);

    Page<StudentGatePassReportRow> getStudentGatePassReport(ReportFilterRequest filter, Pageable pageable);

    Page<HostelOutpassReportRow> getHostelOutpassReport(ReportFilterRequest filter, Pageable pageable);

    Page<VendorReportRow> getVendorReport(ReportFilterRequest filter, Pageable pageable);

    Page<GuardAttendanceReportRow> getGuardAttendanceReport(ReportFilterRequest filter, Pageable pageable);

    Page<GuardShiftReportRow> getGuardShiftReport(ReportFilterRequest filter, Pageable pageable);

    Page<GateActivityReportRow> getGateActivityReport(ReportFilterRequest filter, Pageable pageable);

    Page<AuditLogReportRow> getAuditLogReport(ReportFilterRequest filter, Pageable pageable);

    Page<NotificationReportRow> getNotificationReport(ReportFilterRequest filter, Pageable pageable);

    Page<PeriodicReportRow> getDailyReport(ReportFilterRequest filter, Pageable pageable);

    Page<PeriodicReportRow> getWeeklyReport(ReportFilterRequest filter, Pageable pageable);

    Page<PeriodicReportRow> getMonthlyReport(ReportFilterRequest filter, Pageable pageable);

    Page<PeriodicReportRow> getYearlyReport(ReportFilterRequest filter, Pageable pageable);

    DashboardSummaryResponse getDashboardSummary();
}
