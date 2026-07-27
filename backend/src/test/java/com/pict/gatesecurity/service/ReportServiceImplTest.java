package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.report.*;
import com.pict.gatesecurity.entity.*;
import com.pict.gatesecurity.entity.enums.*;
import com.pict.gatesecurity.repository.*;
import com.pict.gatesecurity.service.impl.ReportServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceImplTest {

    @Mock private VisitorRepository visitorRepository;
    @Mock private VehicleLogRepository vehicleLogRepository;
    @Mock private VehicleRepository vehicleRepository;
    @Mock private StudentGatePassRepository studentGatePassRepository;
    @Mock private HostelOutpassRepository hostelOutpassRepository;
    @Mock private VendorRepository vendorRepository;
    @Mock private VendorVisitRepository vendorVisitRepository;
    @Mock private GuardRepository guardRepository;
    @Mock private ShiftRepository shiftRepository;
    @Mock private ShiftLogRepository shiftLogRepository;
    @Mock private GateRepository gateRepository;
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private CanteenEntryRepository canteenEntryRepository;
    @Mock private CanteenStaffRepository canteenStaffRepository;
    @Mock private UserRepository userRepository;

    private ReportServiceImpl reportService;

    private User testUser;
    private Gate testGate;
    private Visitor testVisitor;
    private Shift testShift;
    private Guard testGuard;

    @BeforeEach
    void setUp() {
        reportService = new ReportServiceImpl(
                visitorRepository, vehicleLogRepository, vehicleRepository,
                studentGatePassRepository, hostelOutpassRepository, vendorRepository,
                vendorVisitRepository, guardRepository, shiftRepository,
                shiftLogRepository, gateRepository, auditLogRepository,
                notificationRepository, canteenEntryRepository, canteenStaffRepository,
                userRepository
        );

        testUser = User.builder()
                .id(1L)
                .username("admin")
                .fullName("Admin User")
                .role(UserRole.ADMIN)
                .active(true)
                .build();

        testGate = Gate.builder()
                .id(1L)
                .name("Main Gate")
                .location("Main Entrance")
                .active(true)
                .build();

        testGuard = Guard.builder()
                .id(1L)
                .user(testUser)
                .employeeCode("G001")
                .assignedGate(testGate)
                .active(true)
                .build();

        testVisitor = Visitor.builder()
                .id(1L)
                .name("John Doe")
                .mobile("9876543210")
                .purpose("Meeting")
                .hostName("Dr. Smith")
                .hostType(HostType.FACULTY)
                .hostDepartment(HostDepartment.CE)
                .gate(testGate)
                .timeIn(OffsetDateTime.now().minusHours(2))
                .timeOut(null)
                .idProofType("Aadhaar")
                .idProofNumber("1234-5678-9012")
                .isBlacklistedMatch(false)
                .createdBy(testUser)
                .build();

        testShift = Shift.builder()
                .id(1L)
                .guard(testGuard)
                .gate(testGate)
                .startTime(OffsetDateTime.now().minusHours(8))
                .endTime(OffsetDateTime.now().minusHours(0))
                .date(LocalDate.now())
                .status(ShiftStatus.COMPLETED)
                .build();
    }

    @Test
    void getVisitorReport_shouldReturnPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Visitor> page = new PageImpl<>(List.of(testVisitor), pageable, 1);

        when(visitorRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        ReportFilterRequest filter = ReportFilterRequest.builder().build();
        Page<VisitorReportRow> result = reportService.getVisitorReport(filter, pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("John Doe", result.getContent().get(0).getName());
    }

    @Test
    void getVisitorReport_withDateFilter() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Visitor> page = new PageImpl<>(List.of(testVisitor), pageable, 1);

        when(visitorRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        ReportFilterRequest filter = ReportFilterRequest.builder()
                .fromDate(LocalDate.now().minusDays(7))
                .toDate(LocalDate.now())
                .build();

        Page<VisitorReportRow> result = reportService.getVisitorReport(filter, pageable);
        assertNotNull(result);
        assertFalse(result.getContent().isEmpty());
    }

    @Test
    void getVisitorReport_withGateFilter() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Visitor> page = new PageImpl<>(List.of(testVisitor), pageable, 1);

        when(visitorRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        ReportFilterRequest filter = ReportFilterRequest.builder()
                .gateId(1L)
                .build();

        Page<VisitorReportRow> result = reportService.getVisitorReport(filter, pageable);
        assertNotNull(result);
    }

    @Test
    void getVisitorReport_calculatesDuration() {
        Visitor visitorWithTimeout = Visitor.builder()
                .id(2L)
                .name("Jane Doe")
                .mobile("9876543211")
                .purpose("Visit")
                .hostName("Dr. Jones")
                .hostType(HostType.STUDENT)
                .hostDepartment(HostDepartment.IT)
                .gate(testGate)
                .timeIn(OffsetDateTime.now().minusHours(3))
                .timeOut(OffsetDateTime.now().minusHours(1))
                .idProofType("PAN")
                .idProofNumber("ABCDE1234F")
                .isBlacklistedMatch(false)
                .createdBy(testUser)
                .build();

        Pageable pageable = PageRequest.of(0, 10);
        Page<Visitor> page = new PageImpl<>(List.of(visitorWithTimeout), pageable, 1);

        when(visitorRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        ReportFilterRequest filter = ReportFilterRequest.builder().build();
        Page<VisitorReportRow> result = reportService.getVisitorReport(filter, pageable);

        assertNotNull(result);
        assertEquals(120L, result.getContent().get(0).getDurationMinutes());
    }

    @Test
    void getGuardShiftReport_shouldReturnPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Shift> page = new PageImpl<>(List.of(testShift), pageable, 1);

        when(shiftRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);
        when(shiftLogRepository.findByShiftId(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));

        ReportFilterRequest filter = ReportFilterRequest.builder().build();
        Page<GuardShiftReportRow> result = reportService.getGuardShiftReport(filter, pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(ShiftStatus.COMPLETED, result.getContent().get(0).getStatus());
    }

    @Test
    void getGateActivityReport_shouldReturnActivityPerGate() {
        when(gateRepository.findAll()).thenReturn(List.of(testGate));

        when(visitorRepository.countByGateIdAndTimeInBetween(anyLong(), any(), any())).thenReturn(10L);
        when(vehicleLogRepository.countByEntryTimeBetweenAndGateId(any(), any(), anyLong())).thenReturn(5L);
        when(vendorVisitRepository.countByEntryTimeBetweenAndGateId(any(), any(), anyLong())).thenReturn(3L);
        when(studentGatePassRepository.countByGateIdAndCreatedAtBetween(anyLong(), any(), any())).thenReturn(2L);
        when(hostelOutpassRepository.countByGateIdAndCreatedAtBetween(anyLong(), any(), any())).thenReturn(1L);

        ReportFilterRequest filter = ReportFilterRequest.builder()
                .fromDate(LocalDate.now().minusDays(30))
                .toDate(LocalDate.now())
                .build();

        Page<GateActivityReportRow> result = reportService.getGateActivityReport(filter, PageRequest.of(0, 10));

        assertNotNull(result);
        assertFalse(result.getContent().isEmpty());
        assertEquals(21L, result.getContent().get(0).getTotalActivity());
    }

    @Test
    void getAuditLogReport_shouldReturnPage() {
        AuditLog auditLog = AuditLog.builder()
                .id(1L)
                .user(testUser)
                .action("VISITOR_CHECK_IN")
                .entityType("Visitor")
                .entityId(1L)
                .timestamp(OffsetDateTime.now())
                .build();

        Pageable pageable = PageRequest.of(0, 10);
        Page<AuditLog> page = new PageImpl<>(List.of(auditLog), pageable, 1);

        when(auditLogRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        ReportFilterRequest filter = ReportFilterRequest.builder().build();
        Page<AuditLogReportRow> result = reportService.getAuditLogReport(filter, pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("VISITOR_CHECK_IN", result.getContent().get(0).getAction());
    }

    @Test
    void getDashboardSummary_shouldReturnSummary() {
        when(shiftRepository.countByStatus(ShiftStatus.ONGOING)).thenReturn(3L);
        when(visitorRepository.countByTimeOutIsNull()).thenReturn(15L);
        when(vehicleLogRepository.countByExitTimeIsNull()).thenReturn(5L);
        when(vendorVisitRepository.countByExitTimeIsNull()).thenReturn(2L);
        when(visitorRepository.findOverstaying(any())).thenReturn(List.of());

        when(visitorRepository.countByTimeInBetween(any(), any())).thenReturn(50L);
        when(vehicleLogRepository.countByEntryTimeBetween(any(), any())).thenReturn(20L);
        when(vendorVisitRepository.countByEntryTimeBetween(any(), any())).thenReturn(8L);
        when(studentGatePassRepository.countByCreatedAtBetween(any(), any())).thenReturn(5L);
        when(hostelOutpassRepository.countByCreatedAtBetween(any(), any())).thenReturn(3L);
        when(notificationRepository.countByStatusAndCreatedAtBetween(any(), any(), any())).thenReturn(0L);
        when(visitorRepository.countByIsBlacklistedMatchTrueAndTimeInBetween(any(), any())).thenReturn(1L);

        when(canteenStaffRepository.findByActiveTrue(any())).thenReturn(new PageImpl<>(List.of()));

        DashboardSummaryResponse result = reportService.getDashboardSummary();

        assertNotNull(result);
        assertEquals(3L, result.getGuardsOnDuty());
        assertEquals(15L, result.getVisitorsCurrentlyInside());
        assertEquals(50L, result.getTodayTotalVisitors());
        assertEquals(1L, result.getBlacklistedMatchesToday());
    }

    @Test
    void getNotificationReport_shouldReturnPage() {
        Notification notification = Notification.builder()
                .id(1L)
                .user(testUser)
                .recipient("test@example.com")
                .type(NotificationType.EMAIL)
                .eventType(NotificationEventType.VISITOR_CHECKIN)
                .subject("Visitor Check-In")
                .status(NotificationStatus.SENT)
                .retryCount(0)
                .createdAt(OffsetDateTime.now())
                .build();

        Pageable pageable = PageRequest.of(0, 10);
        Page<Notification> page = new PageImpl<>(List.of(notification), pageable, 1);

        when(notificationRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        ReportFilterRequest filter = ReportFilterRequest.builder().build();
        Page<NotificationReportRow> result = reportService.getNotificationReport(filter, pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("test@example.com", result.getContent().get(0).getRecipient());
    }
}
