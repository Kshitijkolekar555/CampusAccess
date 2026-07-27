package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.report.*;
import com.pict.gatesecurity.entity.enums.*;
import com.pict.gatesecurity.service.impl.ExportServiceImpl;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExportServiceImplTest {

    private ExportServiceImpl exportService;

    @Mock
    private HttpServletResponse response;

    private ByteArrayOutputStream outputStream;

    @BeforeEach
    void setUp() {
        exportService = new ExportServiceImpl();
        outputStream = new ByteArrayOutputStream();
    }

    @Test
    void buildVisitorExportData_shouldReturnCorrectStructure() {
        VisitorReportRow row = VisitorReportRow.builder()
                .id(1L)
                .name("John Doe")
                .mobile("9876543210")
                .purpose("Meeting")
                .hostName("Dr. Smith")
                .hostType(HostType.FACULTY)
                .hostDepartment(HostDepartment.CE)
                .gateName("Main Gate")
                .timeIn(OffsetDateTime.now().minusHours(2))
                .timeOut(OffsetDateTime.now())
                .idProofType("Aadhaar")
                .isBlacklistedMatch(false)
                .createdByUsername("guard1")
                .durationMinutes(120L)
                .build();

        ExportData result = exportService.buildVisitorExportData(List.of(row));

        assertNotNull(result);
        assertEquals("Visitor Report", result.getTitle());
        assertEquals(17, result.getHeaders().size());
        assertEquals(1, result.getRows().size());
        assertTrue(result.getHeaders().contains("Name"));
        assertTrue(result.getHeaders().contains("Mobile"));
        assertEquals("John Doe", result.getRows().get(0).get(1));
    }

    @Test
    void buildVehicleExportData_shouldReturnCorrectStructure() {
        VehicleReportRow row = VehicleReportRow.builder()
                .id(1L)
                .registrationNumber("MH12AB1234")
                .vehicleType("Car")
                .category(VehicleCategory.STUDENT)
                .gateName("Main Gate")
                .entryTime(OffsetDateTime.now().minusHours(1))
                .purpose("Class")
                .isBlacklisted(false)
                .durationMinutes(60L)
                .build();

        ExportData result = exportService.buildVehicleExportData(List.of(row));

        assertNotNull(result);
        assertEquals("Vehicle Report", result.getTitle());
        assertEquals(14, result.getHeaders().size());
        assertEquals("MH12AB1234", result.getRows().get(0).get(1));
    }

    @Test
    void buildGuardShiftExportData_shouldReturnCorrectStructure() {
        GuardShiftReportRow row = GuardShiftReportRow.builder()
                .id(1L)
                .guardName("Guard One")
                .employeeCode("G001")
                .gateName("Main Gate")
                .date(LocalDate.now())
                .startTime(OffsetDateTime.now().minusHours(8))
                .endTime(OffsetDateTime.now())
                .status(ShiftStatus.COMPLETED)
                .durationMinutes(480L)
                .logCount(5L)
                .build();

        ExportData result = exportService.buildGuardShiftExportData(List.of(row));

        assertNotNull(result);
        assertEquals("Guard Shift Report", result.getTitle());
        assertEquals(10, result.getHeaders().size());
    }

    @Test
    void buildPeriodicExportData_shouldReturnCorrectStructure() {
        PeriodicReportRow row = PeriodicReportRow.builder()
                .periodLabel("2024-01-01")
                .periodStart(LocalDate.of(2024, 1, 1))
                .periodEnd(LocalDate.of(2024, 1, 1))
                .visitorCheckIns(50L)
                .vehicleEntries(20L)
                .vendorVisits(5L)
                .studentPassesIssued(10L)
                .hostelOutpassesIssued(3L)
                .guardShiftsTotal(8L)
                .totalActivity(88L)
                .build();

        ExportData result = exportService.buildPeriodicExportData(List.of(row), "Daily Report");

        assertNotNull(result);
        assertEquals("Daily Report", result.getTitle());
        assertEquals(13, result.getHeaders().size());
        assertEquals("2024-01-01", result.getRows().get(0).get(0));
    }

    @Test
    void buildAuditLogExportData_shouldReturnCorrectStructure() {
        AuditLogReportRow row = AuditLogReportRow.builder()
                .id(1L)
                .username("admin")
                .action("VISITOR_CHECK_IN")
                .entityType("Visitor")
                .entityId(1L)
                .timestamp(OffsetDateTime.now())
                .build();

        ExportData result = exportService.buildAuditLogExportData(List.of(row));

        assertNotNull(result);
        assertEquals("Audit Log Report", result.getTitle());
        assertEquals(8, result.getHeaders().size());
    }

    @Test
    void buildNotificationExportData_shouldReturnCorrectStructure() {
        NotificationReportRow row = NotificationReportRow.builder()
                .id(1L)
                .recipient("test@example.com")
                .type(NotificationType.EMAIL)
                .eventType(NotificationEventType.VISITOR_CHECKIN)
                .subject("Test")
                .status(NotificationStatus.SENT)
                .createdAt(OffsetDateTime.now())
                .build();

        ExportData result = exportService.buildNotificationExportData(List.of(row));

        assertNotNull(result);
        assertEquals("Notification Report", result.getTitle());
        assertEquals(10, result.getHeaders().size());
    }

    @Test
    void buildStudentGatePassExportData_shouldReturnCorrectStructure() {
        StudentGatePassReportRow row = StudentGatePassReportRow.builder()
                .id(1L)
                .studentName("Student One")
                .studentPrn("1234567890")
                .status(PassStatus.APPROVED)
                .gateName("Main Gate")
                .build();

        ExportData result = exportService.buildStudentGatePassExportData(List.of(row));

        assertNotNull(result);
        assertEquals("Student Gate Pass Report", result.getTitle());
        assertEquals(17, result.getHeaders().size());
    }

    @Test
    void buildHostelOutpassExportData_shouldReturnCorrectStructure() {
        HostelOutpassReportRow row = HostelOutpassReportRow.builder()
                .id(1L)
                .studentName("Student Two")
                .studentPrn("0987654321")
                .studentHostel("Boys Hostel")
                .status(OutpassStatus.APPROVED)
                .isLateReturn(false)
                .build();

        ExportData result = exportService.buildHostelOutpassExportData(List.of(row));

        assertNotNull(result);
        assertEquals("Hostel Outpass Report", result.getTitle());
        assertEquals(19, result.getHeaders().size());
    }

    @Test
    void buildVendorExportData_shouldReturnCorrectStructure() {
        VendorReportRow row = VendorReportRow.builder()
                .id(1L)
                .companyName("ABC Corp")
                .contactPerson("John")
                .gateName("Main Gate")
                .entryTime(OffsetDateTime.now().minusHours(1))
                .exitTime(OffsetDateTime.now())
                .vendorBlacklisted(false)
                .durationMinutes(60L)
                .build();

        ExportData result = exportService.buildVendorExportData(List.of(row));

        assertNotNull(result);
        assertEquals("Vendor Visit Report", result.getTitle());
        assertEquals(11, result.getHeaders().size());
    }

    @Test
    void buildGuardAttendanceExportData_shouldReturnCorrectStructure() {
        GuardAttendanceReportRow row = GuardAttendanceReportRow.builder()
                .guardId(1L)
                .guardName("Guard One")
                .employeeCode("G001")
                .gateName("Main Gate")
                .date(LocalDate.now())
                .shiftStatus(ShiftStatus.COMPLETED)
                .shiftDurationMinutes(480L)
                .build();

        ExportData result = exportService.buildGuardAttendanceExportData(List.of(row));

        assertNotNull(result);
        assertEquals("Guard Attendance Report", result.getTitle());
        assertEquals(9, result.getHeaders().size());
    }

    @Test
    void buildGateActivityExportData_shouldReturnCorrectStructure() {
        GateActivityReportRow row = GateActivityReportRow.builder()
                .gateId(1L)
                .gateName("Main Gate")
                .gateLocation("Main Entrance")
                .date(LocalDate.now())
                .visitorCheckIns(50L)
                .vehicleEntries(20L)
                .vendorVisits(5L)
                .studentPasses(10L)
                .hostelOutpasses(3L)
                .totalActivity(88L)
                .build();

        ExportData result = exportService.buildGateActivityExportData(List.of(row));

        assertNotNull(result);
        assertEquals("Gate Activity Report", result.getTitle());
        assertEquals(11, result.getHeaders().size());
    }

    @Test
    void buildVisitorExportData_withEmptyList() {
        ExportData result = exportService.buildVisitorExportData(List.of());

        assertNotNull(result);
        assertEquals("Visitor Report", result.getTitle());
        assertEquals(0, result.getRows().size());
    }

    @Test
    void buildVisitorExportData_withNullValues() {
        VisitorReportRow row = VisitorReportRow.builder()
                .id(1L)
                .name("John Doe")
                .hostType(null)
                .hostDepartment(null)
                .durationMinutes(null)
                .build();

        ExportData result = exportService.buildVisitorExportData(List.of(row));

        assertNotNull(result);
        assertEquals(1, result.getRows().size());
    }
}
