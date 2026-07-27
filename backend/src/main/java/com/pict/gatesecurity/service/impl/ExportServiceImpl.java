package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.dto.report.*;
import com.pict.gatesecurity.service.ExportService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ExportServiceImpl implements ExportService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss");

    @Override
    public void exportCsv(ExportData data, HttpServletResponse response, String filename) {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=" + filename + ".csv");

        try (PrintWriter writer = response.getWriter()) {
            writer.println(String.join(",", data.getHeaders()));
            for (List<String> row : data.getRows()) {
                writer.println(row.stream()
                        .map(this::escapeCsv)
                        .collect(Collectors.joining(",")));
            }
        } catch (IOException e) {
            log.error("Failed to export CSV", e);
        }
    }

    @Override
    public void exportExcel(ExportData data, HttpServletResponse response, String filename) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=" + filename + ".xlsx");

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Report");

            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 11);
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue(data.getTitle());
            org.apache.poi.ss.usermodel.Font titlePoiFont = workbook.createFont();
            titlePoiFont.setBold(true);
            titlePoiFont.setFontHeightInPoints((short) 14);
            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titlePoiFont);
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, data.getHeaders().size() - 1));

            Row headerRow = sheet.createRow(2);
            for (int i = 0; i < data.getHeaders().size(); i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(data.getHeaders().get(i));
                cell.setCellStyle(headerStyle);
            }

            for (int i = 0; i < data.getRows().size(); i++) {
                Row row = sheet.createRow(i + 3);
                List<String> rowData = data.getRows().get(i);
                for (int j = 0; j < rowData.size(); j++) {
                    Cell cell = row.createCell(j);
                    String value = rowData.get(j);
                    cell.setCellValue(value != null ? value : "");
                }
            }

            for (int i = 0; i < data.getHeaders().size(); i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(response.getOutputStream());
        } catch (IOException e) {
            log.error("Failed to export Excel", e);
        }
    }

    @Override
    public void exportPdf(ExportData data, HttpServletResponse response, String filename) {
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=" + filename + ".pdf");

        try {
            com.lowagie.text.Document document = new com.lowagie.text.Document(
                    com.lowagie.text.PageSize.A4.rotate(), 15, 15, 15, 15);
            com.lowagie.text.pdf.PdfWriter.getInstance(document, response.getOutputStream());
            document.open();

            com.lowagie.text.Font titleFont = com.lowagie.text.FontFactory.getFont(
                    com.lowagie.text.FontFactory.HELVETICA_BOLD, 16);
            document.add(new com.lowagie.text.Paragraph(data.getTitle(), titleFont));
            document.add(new com.lowagie.text.Paragraph(
                    "Generated: " + LocalDateTime.now().format(DATE_FMT)));
            document.add(new com.lowagie.text.Paragraph(" "));

            com.lowagie.text.pdf.PdfPTable table = new com.lowagie.text.pdf.PdfPTable(
                    data.getHeaders().size());
            table.setWidthPercentage(100);

            com.lowagie.text.Font headerFont = com.lowagie.text.FontFactory.getFont(
                    com.lowagie.text.FontFactory.HELVETICA_BOLD, 9);
            for (String header : data.getHeaders()) {
                com.lowagie.text.pdf.PdfPCell cell = new com.lowagie.text.pdf.PdfPCell(
                        new com.lowagie.text.Paragraph(header, headerFont));
                cell.setPadding(5);
                table.addCell(cell);
            }

            com.lowagie.text.Font cellFont = com.lowagie.text.FontFactory.getFont(
                    com.lowagie.text.FontFactory.HELVETICA, 8);
            for (List<String> row : data.getRows()) {
                for (String cellValue : row) {
                    com.lowagie.text.pdf.PdfPCell cell = new com.lowagie.text.pdf.PdfPCell(
                            new com.lowagie.text.Paragraph(
                                    cellValue != null ? cellValue : "", cellFont));
                    cell.setPadding(3);
                    table.addCell(cell);
                }
            }

            document.add(table);
            document.close();
        } catch (IOException e) {
            log.error("Failed to export PDF", e);
        }
    }

    @Override
    public ExportData buildVisitorExportData(List<VisitorReportRow> rows) {
        List<String> headers = List.of("ID", "Name", "Mobile", "Purpose", "Host Name", "Host Type",
                "Department", "Student PRN", "Gate", "Vehicle No", "Time In", "Time Out",
                "ID Proof", "Blacklisted", "Notes", "Created By", "Duration (min)");

        List<List<String>> data = rows.stream().map(r -> List.of(
                str(r.getId()), n(r.getName()), n(r.getMobile()), n(r.getPurpose()), n(r.getHostName()),
                str(r.getHostType()), str(r.getHostDepartment()), n(r.getStudentPrn()),
                n(r.getGateName()), n(r.getVehicleNumber()), str(r.getTimeIn()), str(r.getTimeOut()),
                n(r.getIdProofType()), str(r.getIsBlacklistedMatch()), n(r.getNotes()),
                n(r.getCreatedByUsername()), str(r.getDurationMinutes())
        )).collect(Collectors.toList());

        return ExportData.builder()
                .title("Visitor Report")
                .headers(headers)
                .rows(data)
                .generatedAt(LocalDateTime.now().format(DATE_FMT))
                .build();
    }

    @Override
    public ExportData buildVehicleExportData(List<VehicleReportRow> rows) {
        List<String> headers = List.of("ID", "Registration No", "Vehicle Type", "Category",
                "Owner", "Contact", "Gate", "Entry Time", "Exit Time", "Driver",
                "Purpose", "Blacklisted", "Created By", "Duration (min)");

        List<List<String>> data = rows.stream().map(r -> List.of(
                str(r.getId()), n(r.getRegistrationNumber()), n(r.getVehicleType()), str(r.getCategory()),
                n(r.getOwnerName()), n(r.getOwnerContact()), n(r.getGateName()),
                str(r.getEntryTime()), str(r.getExitTime()), n(r.getDriverName()),
                n(r.getPurpose()), str(r.getIsBlacklisted()), n(r.getCreatedByUsername()),
                str(r.getDurationMinutes())
        )).collect(Collectors.toList());

        return ExportData.builder()
                .title("Vehicle Report")
                .headers(headers)
                .rows(data)
                .generatedAt(LocalDateTime.now().format(DATE_FMT))
                .build();
    }

    @Override
    public ExportData buildStudentGatePassExportData(List<StudentGatePassReportRow> rows) {
        List<String> headers = List.of("ID", "Student Name", "PRN", "Mobile", "Department",
                "Class", "Purpose", "Destination", "Departure", "Expected Return",
                "Actual Return", "Status", "Approved By", "Gate Exit", "Gate Entry",
                "Gate", "Created By");

        List<List<String>> data = rows.stream().map(r -> List.of(
                str(r.getId()), n(r.getStudentName()), n(r.getStudentPrn()), n(r.getStudentMobile()),
                n(r.getStudentDepartment()), n(r.getStudentClass()), n(r.getPurpose()), n(r.getDestination()),
                str(r.getDepartureTime()), str(r.getExpectedReturnTime()), str(r.getActualReturnTime()),
                str(r.getStatus()), n(r.getApprovedByName()), str(r.getGateExitAt()),
                str(r.getGateEntryAt()), n(r.getGateName()), n(r.getCreatedByUsername())
        )).collect(Collectors.toList());

        return ExportData.builder()
                .title("Student Gate Pass Report")
                .headers(headers)
                .rows(data)
                .generatedAt(LocalDateTime.now().format(DATE_FMT))
                .build();
    }

    @Override
    public ExportData buildHostelOutpassExportData(List<HostelOutpassReportRow> rows) {
        List<String> headers = List.of("ID", "Student Name", "PRN", "Mobile", "Hostel",
                "Room", "Reason", "Destination", "Departure", "Expected Return",
                "Actual Return", "Status", "Warden", "Remarks", "Gate Exit", "Gate Entry",
                "Late Return", "Gate", "Created By");

        List<List<String>> data = rows.stream().map(r -> List.of(
                str(r.getId()), n(r.getStudentName()), n(r.getStudentPrn()), n(r.getStudentMobile()),
                n(r.getStudentHostel()), n(r.getStudentRoom()), n(r.getReason()), n(r.getDestination()),
                str(r.getDepartureTime()), str(r.getExpectedReturnTime()), str(r.getActualReturnTime()),
                str(r.getStatus()), n(r.getWardenUsername()), n(r.getWardenRemarks()),
                str(r.getGateExitAt()), str(r.getGateEntryAt()), str(r.getIsLateReturn()),
                n(r.getGateName()), n(r.getCreatedByUsername())
        )).collect(Collectors.toList());

        return ExportData.builder()
                .title("Hostel Outpass Report")
                .headers(headers)
                .rows(data)
                .generatedAt(LocalDateTime.now().format(DATE_FMT))
                .build();
    }

    @Override
    public ExportData buildVendorExportData(List<VendorReportRow> rows) {
        List<String> headers = List.of("ID", "Company", "Contact Person", "Phone", "Gate",
                "Entry Time", "Exit Time", "Purpose", "Blacklisted", "Created By", "Duration (min)");

        List<List<String>> data = rows.stream().map(r -> List.of(
                str(r.getId()), n(r.getCompanyName()), n(r.getContactPerson()), n(r.getContactPhone()),
                n(r.getGateName()), str(r.getEntryTime()), str(r.getExitTime()),
                n(r.getPurpose()), str(r.getVendorBlacklisted()), n(r.getCreatedByUsername()),
                str(r.getDurationMinutes())
        )).collect(Collectors.toList());

        return ExportData.builder()
                .title("Vendor Visit Report")
                .headers(headers)
                .rows(data)
                .generatedAt(LocalDateTime.now().format(DATE_FMT))
                .build();
    }

    @Override
    public ExportData buildGuardAttendanceExportData(List<GuardAttendanceReportRow> rows) {
        List<String> headers = List.of("Guard ID", "Guard Name", "Employee Code", "Gate",
                "Date", "Shift Start", "Shift End", "Status", "Duration (min)");

        List<List<String>> data = rows.stream().map(r -> List.of(
                str(r.getGuardId()), n(r.getGuardName()), n(r.getEmployeeCode()), n(r.getGateName()),
                str(r.getDate()), str(r.getShiftStartTime()), str(r.getShiftEndTime()),
                str(r.getShiftStatus()), str(r.getShiftDurationMinutes())
        )).collect(Collectors.toList());

        return ExportData.builder()
                .title("Guard Attendance Report")
                .headers(headers)
                .rows(data)
                .generatedAt(LocalDateTime.now().format(DATE_FMT))
                .build();
    }

    @Override
    public ExportData buildGuardShiftExportData(List<GuardShiftReportRow> rows) {
        List<String> headers = List.of("Shift ID", "Guard Name", "Employee Code", "Gate",
                "Date", "Start Time", "End Time", "Status", "Duration (min)", "Log Count");

        List<List<String>> data = rows.stream().map(r -> List.of(
                str(r.getId()), n(r.getGuardName()), n(r.getEmployeeCode()), n(r.getGateName()),
                str(r.getDate()), str(r.getStartTime()), str(r.getEndTime()),
                str(r.getStatus()), str(r.getDurationMinutes()), str(r.getLogCount())
        )).collect(Collectors.toList());

        return ExportData.builder()
                .title("Guard Shift Report")
                .headers(headers)
                .rows(data)
                .generatedAt(LocalDateTime.now().format(DATE_FMT))
                .build();
    }

    @Override
    public ExportData buildGateActivityExportData(List<GateActivityReportRow> rows) {
        List<String> headers = List.of("Gate ID", "Gate Name", "Location", "Date",
                "Visitor Check-ins", "Visitor Check-outs", "Vehicle Entries",
                "Vendor Visits", "Student Passes", "Hostel Outpasses", "Total Activity");

        List<List<String>> data = rows.stream().map(r -> List.of(
                str(r.getGateId()), n(r.getGateName()), n(r.getGateLocation()), str(r.getDate()),
                str(r.getVisitorCheckIns()), str(r.getVisitorCheckOuts()),
                str(r.getVehicleEntries()), str(r.getVendorVisits()),
                str(r.getStudentPasses()), str(r.getHostelOutpasses()),
                str(r.getTotalActivity())
        )).collect(Collectors.toList());

        return ExportData.builder()
                .title("Gate Activity Report")
                .headers(headers)
                .rows(data)
                .generatedAt(LocalDateTime.now().format(DATE_FMT))
                .build();
    }

    @Override
    public ExportData buildAuditLogExportData(List<AuditLogReportRow> rows) {
        List<String> headers = List.of("ID", "User", "Action", "Entity Type", "Entity ID",
                "Old Value", "New Value", "Timestamp");

        List<List<String>> data = rows.stream().map(r -> List.of(
                str(r.getId()), n(r.getUsername()), n(r.getAction()), n(r.getEntityType()),
                str(r.getEntityId()), str(r.getOldValue()), str(r.getNewValue()),
                str(r.getTimestamp())
        )).collect(Collectors.toList());

        return ExportData.builder()
                .title("Audit Log Report")
                .headers(headers)
                .rows(data)
                .generatedAt(LocalDateTime.now().format(DATE_FMT))
                .build();
    }

    @Override
    public ExportData buildNotificationExportData(List<NotificationReportRow> rows) {
        List<String> headers = List.of("ID", "User ID", "Recipient", "Type", "Event Type",
                "Subject", "Status", "Retry Count", "Sent At", "Created At");

        List<List<String>> data = rows.stream().map(r -> List.of(
                str(r.getId()), str(r.getUserId()), n(r.getRecipient()), str(r.getType()),
                str(r.getEventType()), n(r.getSubject()), str(r.getStatus()),
                str(r.getRetryCount()), str(r.getSentAt()), str(r.getCreatedAt())
        )).collect(Collectors.toList());

        return ExportData.builder()
                .title("Notification Report")
                .headers(headers)
                .rows(data)
                .generatedAt(LocalDateTime.now().format(DATE_FMT))
                .build();
    }

    @Override
    public ExportData buildPeriodicExportData(List<PeriodicReportRow> rows, String reportTitle) {
        List<String> headers = List.of("Period", "Start", "End", "Visitor Check-ins",
                "Visitor Check-outs", "Vehicle Entries", "Vehicle Exits",
                "Student Passes", "Hostel Outpasses", "Vendor Visits",
                "Guard Shifts", "Notifications", "Total Activity");

        List<List<String>> data = rows.stream().map(r -> List.of(
                n(r.getPeriodLabel()), str(r.getPeriodStart()), str(r.getPeriodEnd()),
                str(r.getVisitorCheckIns()), str(r.getVisitorCheckOuts()),
                str(r.getVehicleEntries()), str(r.getVehicleExits()),
                str(r.getStudentPassesIssued()), str(r.getHostelOutpassesIssued()),
                str(r.getVendorVisits()), str(r.getGuardShiftsTotal()),
                str(r.getNotificationsSent()), str(r.getTotalActivity())
        )).collect(Collectors.toList());

        return ExportData.builder()
                .title(reportTitle)
                .headers(headers)
                .rows(data)
                .generatedAt(LocalDateTime.now().format(DATE_FMT))
                .build();
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private String str(Object obj) {
        return obj != null ? obj.toString() : "";
    }

    private String n(String value) {
        return value != null ? value : "";
    }
}
