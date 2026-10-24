package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.dashboard.*;
import com.pict.gatesecurity.dto.guard.ShiftLogResponse;
import com.pict.gatesecurity.dto.report.GuardPerformanceResponse;
import com.pict.gatesecurity.dto.report.PeakHoursResponse;
import com.pict.gatesecurity.entity.*;
import com.pict.gatesecurity.entity.enums.*;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.repository.*;
import com.pict.gatesecurity.service.impl.DashboardServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardServiceImplTest {

    @Mock private VisitorRepository visitorRepository;
    @Mock private VehicleLogRepository vehicleLogRepository;
    @Mock private VendorVisitRepository vendorVisitRepository;
    @Mock private GuardRepository guardRepository;
    @Mock private ShiftRepository shiftRepository;
    @Mock private ShiftLogRepository shiftLogRepository;
    @Mock private GateRepository gateRepository;
    @Mock private StudentGatePassRepository studentGatePassRepository;
    @Mock private HostelOutpassRepository hostelOutpassRepository;
    @Mock private FacultyOutpassRepository facultyOutpassRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private CanteenEntryRepository canteenEntryRepository;
    @Mock private CanteenStaffRepository canteenStaffRepository;
    @Mock private UserRepository userRepository;

    private DashboardServiceImpl dashboardService;

    private User testUser;
    private Gate testGate;
    private Guard testGuard;
    private Shift testShift;

    @BeforeEach
    void setUp() {
        dashboardService = new DashboardServiceImpl(
                visitorRepository, vehicleLogRepository, vendorVisitRepository,
                guardRepository, shiftRepository, shiftLogRepository,
                gateRepository, studentGatePassRepository, hostelOutpassRepository,
                facultyOutpassRepository,
                notificationRepository, auditLogRepository, canteenEntryRepository,
                canteenStaffRepository, userRepository
        );

        testUser = User.builder()
                .id(1L)
                .username("guard1")
                .fullName("Test Guard")
                .role(UserRole.SECURITY_GUARD)
                .active(true)
                .build();

        testGate = Gate.builder()
                .id(1L)
                .name("Main Gate")
                .location("Front Entrance")
                .active(true)
                .build();

        testGuard = Guard.builder()
                .id(1L)
                .user(testUser)
                .employeeCode("EMP001")
                .assignedGate(testGate)
                .active(true)
                .build();

        testShift = Shift.builder()
                .id(1L)
                .guard(testGuard)
                .gate(testGate)
                .startTime(OffsetDateTime.now().minusHours(2))
                .endTime(null)
                .date(LocalDate.now())
                .status(ShiftStatus.ONGOING)
                .build();
    }

    @Test
    void getAdminDashboard_shouldReturnAllCounts() {
        when(visitorRepository.countByTimeInBetween(any(), any())).thenReturn(25L);
        when(visitorRepository.countActiveInsideCampus()).thenReturn(10L);
        when(vehicleLogRepository.countByEntryTimeBetween(any(), any())).thenReturn(15L);
        when(vehicleLogRepository.countByExitTimeIsNull()).thenReturn(5L);
        when(studentGatePassRepository.countByCreatedAtBetween(any(), any())).thenReturn(8L);
        when(hostelOutpassRepository.countByCreatedAtBetween(any(), any())).thenReturn(3L);
        when(vendorVisitRepository.countByEntryTimeBetween(any(), any())).thenReturn(7L);
        when(shiftRepository.countByStatus(ShiftStatus.ONGOING)).thenReturn(4L);
        when(visitorRepository.countByIsBlacklistedMatchTrueAndTimeInBetween(any(), any())).thenReturn(1L);
        when(studentGatePassRepository.countByStatus(PassStatus.PENDING)).thenReturn(2L);
        when(hostelOutpassRepository.countByStatus(OutpassStatus.PENDING)).thenReturn(1L);
        when(canteenEntryRepository.countByDateAndStatus(any(), eq(EntryStatus.PRESENT))).thenReturn(5L);
        when(canteenEntryRepository.countByDateAndStatus(any(), eq(EntryStatus.LATE))).thenReturn(1L);
        when(visitorRepository.findOverstaying(any())).thenReturn(List.of());
        when(notificationRepository.countByStatusAndCreatedAtBetween(any(), any(), any())).thenReturn(0L);

        AdminDashboardResponse result = dashboardService.getAdminDashboard();

        assertNotNull(result);
        assertEquals(25L, result.getTodayVisitors());
        assertEquals(10L, result.getVisitorsInside());
        assertEquals(15L, result.getTodayVehicles());
        assertEquals(5L, result.getVehiclesInside());
        assertEquals(8L, result.getTodayGatePasses());
        assertEquals(3L, result.getTodayHostelOutpasses());
        assertEquals(7L, result.getTodayVendorEntries());
        assertEquals(4L, result.getGuardsOnDuty());
        assertEquals(3L, result.getTotalPendingApprovals());
        assertEquals(1L, result.getWatchlistMatches());
    }

    @Test
    void getGuardSelfDashboard_guardNotFound_shouldThrow() {
        when(guardRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> dashboardService.getGuardSelfDashboard(99L));
    }

    @Test
    void getGuardSelfDashboard_withActiveShift_shouldReturnDetails() {
        when(guardRepository.findByUserId(1L)).thenReturn(Optional.of(testGuard));
        when(shiftRepository.findByGuardIdAndStatus(1L, ShiftStatus.ONGOING))
                .thenReturn(Optional.of(testShift));
        when(visitorRepository.countByGateIdAndTimeInBetween(eq(1L), any(), any())).thenReturn(12L);
        when(vehicleLogRepository.countByEntryTimeBetweenAndGateId(any(), any(), eq(1L))).thenReturn(6L);
        when(vendorVisitRepository.countByEntryTimeBetweenAndGateId(any(), any(), eq(1L))).thenReturn(3L);
        when(hostelOutpassRepository.countByGateIdAndCreatedAtBetween(eq(1L), any(), any())).thenReturn(2L);

        ShiftLog log = ShiftLog.builder()
                .id(1L)
                .shift(testShift)
                .timestamp(OffsetDateTime.now())
                .description("Security check completed")
                .logType(LogType.SECURITY_CHECK)
                .build();
        Page<ShiftLog> logPage = new PageImpl<>(List.of(log), PageRequest.of(0, 10), 1);
        when(shiftLogRepository.findByShiftId(eq(1L), any(Pageable.class))).thenReturn(logPage);

        GuardSelfDashboardResponse result = dashboardService.getGuardSelfDashboard(1L);

        assertNotNull(result);
        assertEquals(testShift.getId(), result.getShiftId());
        assertEquals("Main Gate", result.getGateName());
        assertEquals(1L, result.getGateId());
        assertEquals("ONGOING", result.getShiftStatus());
        assertTrue(result.getShiftDurationMinutes() > 0);
        assertEquals(12L, result.getVisitorsProcessed());
        assertEquals(6L, result.getVehiclesProcessed());
        assertEquals(3L, result.getVendorEntries());
        assertEquals(2L, result.getHostelVerifications());
        assertFalse(result.getRecentLogs().isEmpty());
    }

    @Test
    void getGuardSelfDashboard_noActiveShift_shouldReturnDefaults() {
        Guard guardNoShift = Guard.builder()
                .id(2L)
                .user(testUser)
                .employeeCode("EMP002")
                .assignedGate(testGate)
                .active(true)
                .build();
        when(guardRepository.findByUserId(1L)).thenReturn(Optional.of(guardNoShift));
        when(shiftRepository.findByGuardIdAndStatus(2L, ShiftStatus.ONGOING))
                .thenReturn(Optional.empty());
        when(visitorRepository.countByGateIdAndTimeInBetween(eq(1L), any(), any())).thenReturn(0L);
        when(vehicleLogRepository.countByEntryTimeBetweenAndGateId(any(), any(), eq(1L))).thenReturn(0L);
        when(vendorVisitRepository.countByEntryTimeBetweenAndGateId(any(), any(), eq(1L))).thenReturn(0L);
        when(hostelOutpassRepository.countByGateIdAndCreatedAtBetween(eq(1L), any(), any())).thenReturn(0L);

        GuardSelfDashboardResponse result = dashboardService.getGuardSelfDashboard(1L);

        assertNotNull(result);
        assertNull(result.getShiftId());
        assertEquals("NO_SHIFT", result.getShiftStatus());
        assertEquals(0L, result.getShiftDurationMinutes());
    }

    @Test
    void getWardenDashboard_shouldReturnCounts() {
        when(hostelOutpassRepository.countByStatus(OutpassStatus.PENDING)).thenReturn(5L);
        when(hostelOutpassRepository.countByStatus(OutpassStatus.APPROVED)).thenReturn(10L);
        when(hostelOutpassRepository.countByStatus(OutpassStatus.REJECTED)).thenReturn(2L);
        when(hostelOutpassRepository.findOverdueExitedOutpasses(any())).thenReturn(List.of());
        when(hostelOutpassRepository.countByStatus(OutpassStatus.EXITED)).thenReturn(3L);
        when(hostelOutpassRepository.countByCreatedAtBetween(any(), any())).thenReturn(4L);
        when(hostelOutpassRepository.countByStatusAndCreatedAtBetween(eq(OutpassStatus.APPROVED), any(), any())).thenReturn(2L);
        when(hostelOutpassRepository.countByStatusAndCreatedAtBetween(eq(OutpassStatus.REJECTED), any(), any())).thenReturn(1L);

        WardenDashboardResponse result = dashboardService.getWardenDashboard("Hostel-A");

        assertNotNull(result);
        assertEquals(5L, result.getPendingOutpassRequests());
        assertEquals(10L, result.getApprovedRequests());
        assertEquals(2L, result.getRejectedRequests());
        assertEquals(0L, result.getLateReturns());
        assertEquals(3L, result.getActiveOutpasses());
        assertEquals(4L, result.getTodaySubmitted());
    }

    @Test
    void getDailyTrends_shouldReturnDataForEachDay() {
        LocalDate from = LocalDate.now().minusDays(2);
        LocalDate to = LocalDate.now();

        Object[] row1 = new Object[]{java.sql.Date.valueOf(from), 10L};
        Object[] row2 = new Object[]{java.sql.Date.valueOf(from.plusDays(1)), 15L};
        Object[] row3 = new Object[]{java.sql.Date.valueOf(to), 20L};

        when(visitorRepository.countByDateRange(any(), any())).thenReturn(List.of(row1, row2, row3));
        when(vehicleLogRepository.countByEntryTimeBetween(any(), any())).thenReturn(5L);
        when(vendorVisitRepository.countByEntryTimeBetween(any(), any())).thenReturn(2L);

        DailyTrendResponse result = dashboardService.getDailyTrends(from, to);

        assertNotNull(result);
        assertEquals(from, result.getFromDate());
        assertEquals(to, result.getToDate());
        assertEquals(3, result.getVisitorTrend().size());
        assertEquals(3, result.getVehicleTrend().size());
        assertEquals(3, result.getVendorTrend().size());
        assertEquals(10L, result.getVisitorTrend().get(0).getCount());
    }

    @Test
    void getWeeklyTrends_shouldReturnData() {
        LocalDate from = LocalDate.now().minusWeeks(2);
        LocalDate to = LocalDate.now();

        when(visitorRepository.countByDateRange(any(), any())).thenReturn(List.of());

        List<DashboardService.TrendPoint> result = dashboardService.getWeeklyTrends(from, to);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void getMonthlyTrends_shouldReturnData() {
        LocalDate from = LocalDate.now().minusMonths(2);
        LocalDate to = LocalDate.now();

        when(visitorRepository.countByDateRange(any(), any())).thenReturn(List.of());

        List<DashboardService.TrendPoint> result = dashboardService.getMonthlyTrends(from, to);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void getDepartmentAnalytics_shouldReturnAllDepartments() {
        LocalDate from = LocalDate.now().minusDays(7);
        LocalDate to = LocalDate.now();

        for (HostDepartment dept : HostDepartment.values()) {
            when(visitorRepository.countByTimeInBetweenAndHostDepartment(any(), any(), eq(dept.name())))
                    .thenReturn(5L);
            when(studentGatePassRepository.countByStudentDepartmentAndCreatedAtBetween(
                    eq(dept.name()), any(), any())).thenReturn(3L);
        }

        List<DashboardService.DepartmentTrendPoint> result = dashboardService.getDepartmentAnalytics(from, to);

        assertNotNull(result);
        assertEquals(HostDepartment.values().length, result.size());
        assertEquals("IT", result.get(0).getDepartment());
    }

    @Test
    void getGateAnalytics_shouldReturnPerGateData() {
        LocalDate from = LocalDate.now().minusDays(7);
        LocalDate to = LocalDate.now();

        when(gateRepository.findByActiveTrue()).thenReturn(List.of(testGate));
        when(visitorRepository.countByGateIdAndTimeInBetween(eq(1L), any(), any())).thenReturn(20L);
        when(vehicleLogRepository.countByEntryTimeBetweenAndGateId(any(), any(), eq(1L))).thenReturn(10L);
        when(vendorVisitRepository.countByEntryTimeBetweenAndGateId(any(), any(), eq(1L))).thenReturn(5L);
        when(shiftRepository.countByGateIdAndDateBetween(eq(1L), any(), any())).thenReturn(7L);

        List<DashboardService.GateTrendPoint> result = dashboardService.getGateAnalytics(from, to);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Main Gate", result.get(0).getGateName());
        assertEquals(20L, result.get(0).getVisitorCount());
        assertEquals(10L, result.get(0).getVehicleCount());
    }

    @Test
    void getVehicleAnalytics_shouldReturnCategoryData() {
        LocalDate from = LocalDate.now().minusDays(7);
        LocalDate to = LocalDate.now();

        when(vehicleLogRepository.countByEntryTimeBetween(any(), any())).thenReturn(50L);
        when(vehicleLogRepository.countByExitTimeBetween(any(), any())).thenReturn(45L);
        when(vehicleLogRepository.countByExitTimeIsNull()).thenReturn(5L);

        Object[] catData = new Object[]{
                new Object[]{VehicleCategory.STUDENT, 30L},
                new Object[]{VehicleCategory.FACULTY, 20L}
        };
        when(vehicleLogRepository.countByVehicleCategoryBetween(any(), any())).thenReturn(catData);

        List<DashboardService.VehicleTrendPoint> result = dashboardService.getVehicleAnalytics(from, to);

        assertNotNull(result);
        assertFalse(result.isEmpty());
        assertEquals("ALL", result.get(0).getCategory());
        assertEquals(50L, result.get(0).getEntryCount());
        assertEquals("STUDENT", result.get(1).getCategory());
    }

    @Test
    void getVisitorAnalytics_shouldReturn24Hours() {
        LocalDate from = LocalDate.now().minusDays(7);
        LocalDate to = LocalDate.now();

        Object[] hourData = new Object[]{9, 15L};
        when(visitorRepository.countCheckInsByHour(any(), any())).thenReturn(List.<Object[]>of(hourData));

        List<PeakHoursResponse> result = dashboardService.getVisitorAnalytics(from, to);

        assertNotNull(result);
        assertEquals(24, result.size());
        assertEquals(15L, result.get(9).getCheckInCount());
        assertEquals(0L, result.get(0).getCheckInCount());
    }

    @Test
    void getGuardPerformance_shouldReturnPerGuardStats() {
        LocalDate from = LocalDate.now().minusDays(30);
        LocalDate to = LocalDate.now();

        when(guardRepository.findByActiveTrue(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(testGuard), PageRequest.of(0, 100), 1));
        when(shiftRepository.countByGuardIdAndDateBetween(1L, from, to)).thenReturn(20L);
        when(shiftRepository.countByGuardIdAndStatus(1L, ShiftStatus.COMPLETED)).thenReturn(18L);

        List<GuardPerformanceResponse> result = dashboardService.getGuardPerformance(from, to);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Test Guard", result.get(0).getGuardName());
        assertEquals("EMP001", result.get(0).getEmployeeCode());
        assertEquals(20L, result.get(0).getTotalShifts());
        assertEquals(18L, result.get(0).getCompletedShifts());
    }

    @Test
    void getRecentActivities_shouldReturnAuditLogs() {
        User adminUser = User.builder()
                .id(2L)
                .fullName("Admin User")
                .username("admin")
                .role(UserRole.ADMIN)
                .active(true)
                .build();

        AuditLog auditLog = AuditLog.builder()
                .id(1L)
                .user(adminUser)
                .action("CREATE")
                .entityType("Visitor")
                .entityId(10L)
                .timestamp(OffsetDateTime.now())
                .build();

        when(auditLogRepository.findTop20ByOrderByTimestampDesc()).thenReturn(List.of(auditLog));

        List<RecentActivityRow> result = dashboardService.getRecentActivities(20);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("CREATE", result.get(0).getAction());
        assertEquals("Visitor", result.get(0).getEntityType());
        assertEquals("Admin User", result.get(0).getPerformedBy());
    }

    @Test
    void getRecentActivities_shouldRespectLimit() {
        User adminUser = User.builder().id(2L).fullName("Admin").username("admin").role(UserRole.ADMIN).active(true).build();

        AuditLog log1 = AuditLog.builder().id(1L).user(adminUser).action("CREATE").entityType("Gate").entityId(1L).timestamp(OffsetDateTime.now()).build();
        AuditLog log2 = AuditLog.builder().id(2L).user(adminUser).action("UPDATE").entityType("Guard").entityId(2L).timestamp(OffsetDateTime.now()).build();
        AuditLog log3 = AuditLog.builder().id(3L).user(adminUser).action("DELETE").entityType("Visitor").entityId(3L).timestamp(OffsetDateTime.now()).build();

        when(auditLogRepository.findTop20ByOrderByTimestampDesc()).thenReturn(List.of(log1, log2, log3));

        List<RecentActivityRow> result = dashboardService.getRecentActivities(2);

        assertNotNull(result);
        assertEquals(2, result.size());
    }

    @Test
    void getSystemStatistics_shouldReturnFacultyOutpassesCount() {
        when(visitorRepository.countTotalVisitorsBetween(any(), any())).thenReturn(10L);
        when(visitorRepository.countApprovedBetween(any(), any(), any())).thenReturn(8L);
        when(visitorRepository.countRejectedBetween(any(), any())).thenReturn(2L);
        when(visitorRepository.countCompletedBetween(any(), any())).thenReturn(5L);
        when(vehicleLogRepository.countByEntryTimeBetween(any(), any())).thenReturn(4L);
        when(studentGatePassRepository.countByCreatedAtBetween(any(), any())).thenReturn(7L);
        when(hostelOutpassRepository.countByCreatedAtBetween(any(), any())).thenReturn(3L);
        when(facultyOutpassRepository.countByCreatedAtBetween(any(), any())).thenReturn(6L);
        when(vendorVisitRepository.countByEntryTimeBetween(any(), any())).thenReturn(1L);
        when(visitorRepository.countUniqueActiveInsideCampus()).thenReturn(2L);
        when(visitorRepository.countByStatus(PassStatus.PENDING)).thenReturn(0L);

        SystemStatisticsResponse stats = dashboardService.getSystemStatistics("TODAY", null, null, null, null, null);

        assertNotNull(stats);
        assertEquals(6L, stats.getTotalFacultyOutpasses());
        assertEquals(7L, stats.getTotalStudentPasses());
        assertEquals(3L, stats.getTotalHostelOutpasses());
    }
}
