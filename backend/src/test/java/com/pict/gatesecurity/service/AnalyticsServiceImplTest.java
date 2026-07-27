package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.report.*;
import com.pict.gatesecurity.entity.*;
import com.pict.gatesecurity.entity.enums.*;
import com.pict.gatesecurity.repository.*;
import com.pict.gatesecurity.service.impl.AnalyticsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceImplTest {

    @Mock private VisitorRepository visitorRepository;
    @Mock private VehicleLogRepository vehicleLogRepository;
    @Mock private VendorVisitRepository vendorVisitRepository;
    @Mock private GuardRepository guardRepository;
    @Mock private ShiftRepository shiftRepository;
    @Mock private ShiftLogRepository shiftLogRepository;
    @Mock private GateRepository gateRepository;
    @Mock private StudentGatePassRepository studentGatePassRepository;
    @Mock private HostelOutpassRepository hostelOutpassRepository;
    @Mock private VendorRepository vendorRepository;
    @Mock private CanteenEntryRepository canteenEntryRepository;
    @Mock private CanteenStaffRepository canteenStaffRepository;

    private AnalyticsServiceImpl analyticsService;

    private User testUser;
    private Gate testGate;
    private Guard testGuard;

    @BeforeEach
    void setUp() {
        analyticsService = new AnalyticsServiceImpl(
                visitorRepository, vehicleLogRepository, vendorVisitRepository,
                guardRepository, shiftRepository, shiftLogRepository,
                gateRepository, studentGatePassRepository, hostelOutpassRepository,
                vendorRepository, canteenEntryRepository, canteenStaffRepository
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
    }

    @Test
    void getPeakEntryHours_shouldReturn24Hours() {
        LocalDate fromDate = LocalDate.now().minusDays(7);
        LocalDate toDate = LocalDate.now();

        when(visitorRepository.countCheckInsByHour(any(), any())).thenReturn(List.of());

        List<PeakHoursResponse> result = analyticsService.getPeakEntryHours(fromDate, toDate);

        assertNotNull(result);
        assertEquals(24, result.size());
        assertEquals(0, result.get(0).getHour());
        assertEquals(23, result.get(23).getHour());
    }

    @Test
    void getPeakEntryHours_withNullDates() {
        when(visitorRepository.countCheckInsByHour(any(), any())).thenReturn(List.of());

        List<PeakHoursResponse> result = analyticsService.getPeakEntryHours(null, null);

        assertNotNull(result);
        assertEquals(24, result.size());
    }

    @Test
    void getPeakEntryHours_withData() {
        LocalDate fromDate = LocalDate.now().minusDays(7);
        LocalDate toDate = LocalDate.now();

        Object[] hourData = new Object[]{9, 15L};
        when(visitorRepository.countCheckInsByHour(any(), any())).thenReturn(List.<Object[]>of(hourData));

        List<PeakHoursResponse> result = analyticsService.getPeakEntryHours(fromDate, toDate);

        assertNotNull(result);
        assertEquals(24, result.size());
        assertEquals(15L, result.get(9).getCheckInCount());
    }

    @Test
    void getPeakExitHours_shouldReturn24Hours() {
        when(visitorRepository.countCheckOutsByHour(any(), any())).thenReturn(List.of());

        List<PeakHoursResponse> result = analyticsService.getPeakExitHours(null, null);

        assertNotNull(result);
        assertEquals(24, result.size());
    }

    @Test
    void getDailyVisitorTrend_shouldReturnDataPoints() {
        LocalDate fromDate = LocalDate.now().minusDays(5);
        LocalDate toDate = LocalDate.now();

        when(visitorRepository.countByDateRange(any(), any())).thenReturn(List.of());

        List<TrendDataPoint> result = analyticsService.getDailyVisitorTrend(fromDate, toDate);

        assertNotNull(result);
        assertEquals(6, result.size());
    }

    @Test
    void getDailyVisitorTrend_withNullDates() {
        when(visitorRepository.countByDateRange(any(), any())).thenReturn(List.of());

        List<TrendDataPoint> result = analyticsService.getDailyVisitorTrend(null, null);

        assertNotNull(result);
        assertEquals(31, result.size());
    }

    @Test
    void getMonthlyVisitorTrend_shouldReturnDataPoints() {
        LocalDate fromDate = LocalDate.now().minusMonths(3);
        LocalDate toDate = LocalDate.now();

        when(visitorRepository.countByTimeInBetween(any(), any())).thenReturn(50L);

        List<TrendDataPoint> result = analyticsService.getMonthlyVisitorTrend(fromDate, toDate);

        assertNotNull(result);
        assertEquals(4, result.size());
        assertEquals(50L, result.get(0).getValue());
    }

    @Test
    void getVehicleTrends_shouldReturnDataPoints() {
        LocalDate fromDate = LocalDate.now().minusDays(3);
        LocalDate toDate = LocalDate.now();

        when(vehicleLogRepository.countByEntryTimeBetween(any(), any())).thenReturn(10L);
        when(vehicleLogRepository.countByExitTimeBetween(any(), any())).thenReturn(8L);

        List<TrendDataPoint> result = analyticsService.getVehicleTrends(fromDate, toDate);

        assertNotNull(result);
        assertEquals(4, result.size());
        assertEquals(10L, result.get(0).getValue());
        assertEquals(8L, result.get(0).getSecondaryValue());
    }

    @Test
    void getGuardPerformance_shouldReturnPerformanceData() {
        LocalDate fromDate = LocalDate.now().minusMonths(1);
        LocalDate toDate = LocalDate.now();

        when(guardRepository.findByActiveTrue(any())).thenReturn(new PageImpl<>(List.of(testGuard), PageRequest.of(0, 1000), 1));
        when(shiftRepository.countByGuardIdAndDateBetween(eq(1L), any(), any())).thenReturn(10L);
        when(shiftRepository.findByGuardIdAndDateBetween(eq(1L), any(), any())).thenReturn(List.of());
        when(shiftRepository.countByGuardIdAndStatus(eq(1L), eq(ShiftStatus.ONGOING))).thenReturn(1L);

        List<GuardPerformanceResponse> result = analyticsService.getGuardPerformance(fromDate, toDate);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("G001", result.get(0).getEmployeeCode());
        assertEquals(10L, result.get(0).getTotalShifts());
    }

    @Test
    void getDepartmentWiseVisitors_shouldReturnAllDepartments() {
        LocalDate fromDate = LocalDate.now().minusMonths(1);
        LocalDate toDate = LocalDate.now();

        when(visitorRepository.countByTimeInBetweenAndHostDepartment(any(), any(), anyString())).thenReturn(5L);

        List<DepartmentVisitorResponse> result = analyticsService.getDepartmentWiseVisitors(fromDate, toDate);

        assertNotNull(result);
        assertEquals(HostDepartment.values().length, result.size());
    }

    @Test
    void getVendorStatistics_shouldReturnStats() {
        LocalDate fromDate = LocalDate.now().minusMonths(1);
        LocalDate toDate = LocalDate.now();

        Vendor vendor = Vendor.builder()
                .id(1L)
                .companyName("ABC Corp")
                .contactPerson("John")
                .contactPhone("9876543210")
                .isBlacklisted(false)
                .build();

        when(vendorRepository.findAll()).thenReturn(List.of(vendor));
        when(vendorVisitRepository.countByVendorIdAndEntryTimeBetween(eq(1L), any(), any())).thenReturn(5L);

        List<VendorStatisticsResponse> result = analyticsService.getVendorStatistics(fromDate, toDate);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("ABC Corp", result.get(0).getCompanyName());
        assertEquals(5L, result.get(0).getTotalVisits());
    }

    @Test
    void getGateUtilization_shouldReturnUtilizationData() {
        LocalDate fromDate = LocalDate.now().minusMonths(1);
        LocalDate toDate = LocalDate.now();

        when(gateRepository.findAll()).thenReturn(List.of(testGate));
        when(visitorRepository.countByGateIdAndTimeInBetween(eq(1L), any(), any())).thenReturn(100L);
        when(vehicleLogRepository.countByEntryTimeBetweenAndGateId(any(), any(), eq(1L))).thenReturn(50L);
        when(vendorVisitRepository.countByEntryTimeBetweenAndGateId(any(), any(), eq(1L))).thenReturn(20L);

        List<GateUtilizationResponse> result = analyticsService.getGateUtilization(fromDate, toDate);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Main Gate", result.get(0).getGateName());
        assertEquals(100L, result.get(0).getTotalVisitorEntries());
        assertEquals(170L, result.get(0).getTotalActivity());
        assertEquals(100.0, result.get(0).getUtilizationPercentage());
    }

    @Test
    void getGateUtilization_withMultipleGates() {
        Gate gate2 = Gate.builder()
                .id(2L)
                .name("Back Gate")
                .location("Back")
                .active(true)
                .build();

        when(gateRepository.findAll()).thenReturn(List.of(testGate, gate2));
        when(visitorRepository.countByGateIdAndTimeInBetween(eq(1L), any(), any())).thenReturn(100L);
        when(visitorRepository.countByGateIdAndTimeInBetween(eq(2L), any(), any())).thenReturn(50L);
        when(vehicleLogRepository.countByEntryTimeBetweenAndGateId(any(), any(), eq(1L))).thenReturn(0L);
        when(vehicleLogRepository.countByEntryTimeBetweenAndGateId(any(), any(), eq(2L))).thenReturn(0L);
        when(vendorVisitRepository.countByEntryTimeBetweenAndGateId(any(), any(), eq(1L))).thenReturn(0L);
        when(vendorVisitRepository.countByEntryTimeBetweenAndGateId(any(), any(), eq(2L))).thenReturn(0L);

        List<GateUtilizationResponse> result = analyticsService.getGateUtilization(null, null);

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(66.67, result.get(0).getUtilizationPercentage(), 0.01);
        assertEquals(33.33, result.get(1).getUtilizationPercentage(), 0.01);
    }
}
