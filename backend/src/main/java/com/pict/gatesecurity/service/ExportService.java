package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.report.*;
import jakarta.servlet.http.HttpServletResponse;

import java.util.List;

public interface ExportService {

    void exportCsv(ExportData data, HttpServletResponse response, String filename);

    void exportExcel(ExportData data, HttpServletResponse response, String filename);

    void exportPdf(ExportData data, HttpServletResponse response, String filename);

    ExportData buildVisitorExportData(List<VisitorReportRow> rows);

    ExportData buildVehicleExportData(List<VehicleReportRow> rows);

    ExportData buildStudentGatePassExportData(List<StudentGatePassReportRow> rows);

    ExportData buildHostelOutpassExportData(List<HostelOutpassReportRow> rows);

    ExportData buildVendorExportData(List<VendorReportRow> rows);

    ExportData buildGuardAttendanceExportData(List<GuardAttendanceReportRow> rows);

    ExportData buildGuardShiftExportData(List<GuardShiftReportRow> rows);

    ExportData buildGateActivityExportData(List<GateActivityReportRow> rows);

    ExportData buildAuditLogExportData(List<AuditLogReportRow> rows);

    ExportData buildNotificationExportData(List<NotificationReportRow> rows);

    ExportData buildPeriodicExportData(List<PeriodicReportRow> rows, String reportTitle);
}
