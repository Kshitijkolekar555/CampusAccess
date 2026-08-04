package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.config.CacheConfig;
import com.pict.gatesecurity.dto.dashboard.*;
import com.pict.gatesecurity.dto.guard.ShiftLogResponse;
import com.pict.gatesecurity.dto.report.GuardPerformanceResponse;
import com.pict.gatesecurity.dto.report.PeakHoursResponse;
import com.pict.gatesecurity.entity.*;
import com.pict.gatesecurity.entity.enums.*;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.repository.*;
import com.pict.gatesecurity.service.DashboardService;
import com.pict.gatesecurity.util.ReportSpecifications;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.temporal.WeekFields;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final VisitorRepository visitorRepository;
    private final VehicleLogRepository vehicleLogRepository;
    private final VendorVisitRepository vendorVisitRepository;
    private final GuardRepository guardRepository;
    private final ShiftRepository shiftRepository;
    private final ShiftLogRepository shiftLogRepository;
    private final GateRepository gateRepository;
    private final StudentGatePassRepository studentGatePassRepository;
    private final HostelOutpassRepository hostelOutpassRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final CanteenEntryRepository canteenEntryRepository;
    private final CanteenStaffRepository canteenStaffRepository;
    private final UserRepository userRepository;

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    @Override
    @Cacheable(value = CacheConfig.CACHE_ADMIN_DASHBOARD, key = "'admin'")
    public AdminDashboardResponse getAdminDashboard() {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime dayStart = ReportSpecifications.toStartOfDay(now.toLocalDate());
        OffsetDateTime dayEnd = ReportSpecifications.toEndOfDay(now.toLocalDate());

        long todayVisitors = visitorRepository.countByTimeInBetween(dayStart, dayEnd);
        long visitorsInside = visitorRepository.countByTimeOutIsNull();
        long todayVehicles = vehicleLogRepository.countByEntryTimeBetween(dayStart, dayEnd);
        long vehiclesInside = vehicleLogRepository.countByExitTimeIsNull();
        long todayGatePasses = studentGatePassRepository.countByCreatedAtBetween(dayStart, dayEnd);
        long todayHostelOutpasses = hostelOutpassRepository.countByCreatedAtBetween(dayStart, dayEnd);
        long todayVendorEntries = vendorVisitRepository.countByEntryTimeBetween(dayStart, dayEnd);
        long guardsOnDuty = shiftRepository.countByStatus(ShiftStatus.ONGOING);
        long activeShifts = shiftRepository.countByStatus(ShiftStatus.ONGOING);
        long watchlistMatches = visitorRepository.countByIsBlacklistedMatchTrueAndTimeInBetween(dayStart, dayEnd);

        long pendingGatePassApprovals = studentGatePassRepository.countByStatus(PassStatus.PENDING);
        long pendingOutpassApprovals = hostelOutpassRepository.countByStatus(OutpassStatus.PENDING);
        long totalPendingApprovals = pendingGatePassApprovals + pendingOutpassApprovals;

        long canteenPresent = canteenEntryRepository.countByDateAndStatus(now.toLocalDate(), EntryStatus.PRESENT)
                + canteenEntryRepository.countByDateAndStatus(now.toLocalDate(), EntryStatus.LATE);

        OffsetDateTime threshold = now.minusHours(4);
        long overstayingVisitors = visitorRepository.findOverstaying(threshold).size();

        long pendingNotifications = notificationRepository.countByStatusAndCreatedAtBetween(
                NotificationStatus.PENDING, dayStart, dayEnd);

        return AdminDashboardResponse.builder()
                .todayVisitors(todayVisitors)
                .visitorsInside(visitorsInside)
                .todayVehicles(todayVehicles)
                .vehiclesInside(vehiclesInside)
                .todayGatePasses(todayGatePasses)
                .todayHostelOutpasses(todayHostelOutpasses)
                .todayVendorEntries(todayVendorEntries)
                .guardsOnDuty(guardsOnDuty)
                .activeShifts(activeShifts)
                .watchlistMatches(watchlistMatches)
                .pendingGatePassApprovals(pendingGatePassApprovals)
                .pendingOutpassApprovals(pendingOutpassApprovals)
                .totalPendingApprovals(totalPendingApprovals)
                .canteenStaffPresent(canteenPresent)
                .overstayingVisitors(overstayingVisitors)
                .pendingNotifications(pendingNotifications)
                .build();
    }

    @Override
    @Cacheable(value = CacheConfig.CACHE_GUARD_DASHBOARD, key = "#userId")
    public GuardSelfDashboardResponse getGuardSelfDashboard(Long userId) {
        Guard guard = guardRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
                    Guard newGuard = Guard.builder()
                            .user(user)
                            .employeeCode("G-" + user.getId())
                            .active(true)
                            .build();
                    return guardRepository.save(newGuard);
                });

        Optional<Shift> currentShiftOpt = shiftRepository.findByGuardIdAndStatus(guard.getId(), ShiftStatus.ONGOING);

        Long gateId = guard.getAssignedGate() != null ? guard.getAssignedGate().getId() : null;
        String gateName = guard.getAssignedGate() != null ? guard.getAssignedGate().getName() : "Main Gate";

        String guardName = guard.getUser() != null ? guard.getUser().getFullName() : "Guard #" + guard.getId();
        String guardCode = guard.getEmployeeCode() != null ? guard.getEmployeeCode() : "G-" + guard.getId();

        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime dayStart = ReportSpecifications.toStartOfDay(now.toLocalDate());
        OffsetDateTime dayEnd = ReportSpecifications.toEndOfDay(now.toLocalDate());

        long visitorsEnteredToday = visitorRepository.countByTimeInBetween(dayStart, dayEnd);
        long visitorsExitedToday = visitorRepository.countByTimeOutBetween(dayStart, dayEnd);
        long vehiclesEnteredToday = vehicleLogRepository.countByEntryTimeBetween(dayStart, dayEnd);
        long vehiclesExitedToday = vehicleLogRepository.countByExitTimeBetween(dayStart, dayEnd);
        long materialsProcessedToday = vendorVisitRepository.countByEntryTimeBetween(dayStart, dayEnd);
        long studentPassesProcessedToday = studentGatePassRepository.countByCreatedAtBetween(dayStart, dayEnd);
        long activeVisitorsInsideCampus = visitorRepository.countByTimeOutIsNull();

        long shiftDurationMinutes = 0;
        OffsetDateTime shiftStart = null;
        OffsetDateTime shiftEnd = null;
        String shiftStatus = "NO_SHIFT";
        String shiftName = "Morning";
        String dutyStatus = currentShiftOpt.isPresent() ? "ON DUTY" : "OFF DUTY";
        Long shiftId = null;

        int currentHour = now.getHour();
        if (currentHour >= 6 && currentHour < 14) {
            shiftName = "Morning";
        } else if (currentHour >= 14 && currentHour < 22) {
            shiftName = "Evening";
        } else {
            shiftName = "Night";
        }

        if (currentShiftOpt.isPresent()) {
            Shift shift = currentShiftOpt.get();
            shiftId = shift.getId();
            shiftStart = shift.getStartTime();
            shiftEnd = shift.getEndTime();
            shiftStatus = shift.getStatus().name();
            if (shiftStart != null) {
                OffsetDateTime end = shiftEnd != null ? shiftEnd : now;
                shiftDurationMinutes = java.time.temporal.ChronoUnit.MINUTES.between(shiftStart, end);
            }
        }

        List<ShiftLogResponse> recentLogs = new ArrayList<>();
        if (shiftId != null) {
            Page<ShiftLog> logPage = shiftLogRepository.findByShiftId(shiftId, PageRequest.of(0, 10));
            for (ShiftLog log : logPage.getContent()) {
                recentLogs.add(ShiftLogResponse.builder()
                        .id(log.getId())
                        .shiftId(shiftId)
                        .timestamp(log.getTimestamp())
                        .description(log.getDescription())
                        .logType(log.getLogType())
                        .build());
            }
        }

        return GuardSelfDashboardResponse.builder()
                .guardName(guardName)
                .guardId(guardCode)
                .shiftId(shiftId)
                .gateName(gateName)
                .gateId(gateId)
                .shiftName(shiftName)
                .shiftStartTime(shiftStart)
                .shiftEndTime(shiftEnd)
                .shiftStatus(shiftStatus)
                .dutyStatus(dutyStatus)
                .visitorsEnteredToday(visitorsEnteredToday)
                .visitorsExitedToday(visitorsExitedToday)
                .vehiclesEnteredToday(vehiclesEnteredToday)
                .vehiclesExitedToday(vehiclesExitedToday)
                .materialsProcessedToday(materialsProcessedToday)
                .studentPassesProcessedToday(studentPassesProcessedToday)
                .activeVisitorsInsideCampus(activeVisitorsInsideCampus)
                .shiftDurationMinutes(shiftDurationMinutes)
                .visitorsProcessed(visitorsEnteredToday)
                .vehiclesProcessed(vehiclesEnteredToday)
                .vendorEntries(materialsProcessedToday)
                .hostelVerifications(0)
                .recentLogs(recentLogs)
                .build();
    }

    @Override
    @Cacheable(value = CacheConfig.CACHE_WARDEN_DASHBOARD, key = "#hostel ?: 'all'")
    public WardenDashboardResponse getWardenDashboard(String hostel) {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime dayStart = ReportSpecifications.toStartOfDay(now.toLocalDate());
        OffsetDateTime dayEnd = ReportSpecifications.toEndOfDay(now.toLocalDate());

        long pending = hostelOutpassRepository.countByStatus(OutpassStatus.PENDING);
        long approved = hostelOutpassRepository.countByStatus(OutpassStatus.APPROVED);
        long rejected = hostelOutpassRepository.countByStatus(OutpassStatus.REJECTED);
        long lateReturns = hostelOutpassRepository.findOverdueExitedOutpasses(now).size();
        long activeOutpasses = hostelOutpassRepository.countByStatus(OutpassStatus.EXITED);

        long todaySubmitted = hostelOutpassRepository.countByCreatedAtBetween(dayStart, dayEnd);
        long todayApproved = hostelOutpassRepository.countByStatusAndCreatedAtBetween(
                OutpassStatus.APPROVED, dayStart, dayEnd);
        long todayRejected = hostelOutpassRepository.countByStatusAndCreatedAtBetween(
                OutpassStatus.REJECTED, dayStart, dayEnd);

        return WardenDashboardResponse.builder()
                .pendingOutpassRequests(pending)
                .approvedRequests(approved)
                .rejectedRequests(rejected)
                .lateReturns(lateReturns)
                .activeOutpasses(activeOutpasses)
                .todaySubmitted(todaySubmitted)
                .todayApproved(todayApproved)
                .todayRejected(todayRejected)
                .build();
    }

    @Override
    @Cacheable(value = CacheConfig.CACHE_DAILY_TRENDS, key = "#fromDate.toString() + '_' + #toDate.toString()")
    public DailyTrendResponse getDailyTrends(LocalDate fromDate, LocalDate toDate) {
        LocalDate from = fromDate != null ? fromDate : LocalDate.now().minusDays(30);
        LocalDate to = toDate != null ? toDate : LocalDate.now();

        OffsetDateTime start = ReportSpecifications.toStartOfDay(from);
        OffsetDateTime end = ReportSpecifications.toEndOfDay(to);

        List<Object[]> visitorData = visitorRepository.countByDateRange(start, end);

        Map<LocalDate, Long> visitorMap = new LinkedHashMap<>();
        for (Object[] row : visitorData) {
            LocalDate date = ((java.sql.Date) row[0]).toLocalDate();
            visitorMap.put(date, (Long) row[1]);
        }

        List<DailyTrendResponse.TrendPoint> visitorTrend = new ArrayList<>();
        List<DailyTrendResponse.TrendPoint> vehicleTrend = new ArrayList<>();
        List<DailyTrendResponse.TrendPoint> vendorTrend = new ArrayList<>();

        LocalDate current = from;
        while (!current.isAfter(to)) {
            long vCount = visitorMap.getOrDefault(current, 0L);
            visitorTrend.add(DailyTrendResponse.TrendPoint.builder().date(current).count(vCount).build());

            OffsetDateTime dayS = ReportSpecifications.toStartOfDay(current);
            OffsetDateTime dayE = ReportSpecifications.toEndOfDay(current);
            long vLogCount = vehicleLogRepository.countByEntryTimeBetween(dayS, dayE);
            vehicleTrend.add(DailyTrendResponse.TrendPoint.builder().date(current).count(vLogCount).build());

            long vendorCount = vendorVisitRepository.countByEntryTimeBetween(dayS, dayE);
            vendorTrend.add(DailyTrendResponse.TrendPoint.builder().date(current).count(vendorCount).build());

            current = current.plusDays(1);
        }

        return DailyTrendResponse.builder()
                .fromDate(from)
                .toDate(to)
                .visitorTrend(visitorTrend)
                .vehicleTrend(vehicleTrend)
                .vendorTrend(vendorTrend)
                .build();
    }

    @Override
    @Cacheable(value = CacheConfig.CACHE_WEEKLY_TRENDS, key = "#fromDate.toString() + '_' + #toDate.toString()")
    public List<TrendPoint> getWeeklyTrends(LocalDate fromDate, LocalDate toDate) {
        LocalDate from = fromDate != null ? fromDate : LocalDate.now().minusWeeks(12);
        LocalDate to = toDate != null ? toDate : LocalDate.now();

        OffsetDateTime start = ReportSpecifications.toStartOfDay(from);
        OffsetDateTime end = ReportSpecifications.toEndOfDay(to);

        List<Object[]> visitorData = visitorRepository.countByDateRange(start, end);

        Map<LocalDate, Long> dailyCounts = new LinkedHashMap<>();
        for (Object[] row : visitorData) {
            LocalDate date = ((java.sql.Date) row[0]).toLocalDate();
            dailyCounts.put(date, (Long) row[1]);
        }

        Map<String, Long> weeklyCounts = new LinkedHashMap<>();
        for (Map.Entry<LocalDate, Long> entry : dailyCounts.entrySet()) {
            LocalDate date = entry.getKey();
            String weekKey = date.get(WeekFields.ISO.weekOfWeekBasedYear()) + "-W" +
                    String.format("%02d", date.get(WeekFields.ISO.dayOfWeek()));
            weeklyCounts.merge(date.with(WeekFields.ISO.dayOfWeek(), 1).toString(), entry.getValue(), Long::sum);
        }

        List<TrendPoint> result = new ArrayList<>();
        for (Map.Entry<String, Long> entry : weeklyCounts.entrySet()) {
            result.add(TrendPoint.builder().label(entry.getKey()).count(entry.getValue()).build());
        }
        return result;
    }

    @Override
    @Cacheable(value = CacheConfig.CACHE_MONTHLY_TRENDS, key = "#fromDate.toString() + '_' + #toDate.toString()")
    public List<TrendPoint> getMonthlyTrends(LocalDate fromDate, LocalDate toDate) {
        LocalDate from = fromDate != null ? fromDate : LocalDate.now().minusMonths(12);
        LocalDate to = toDate != null ? toDate : LocalDate.now();

        OffsetDateTime start = ReportSpecifications.toStartOfDay(from);
        OffsetDateTime end = ReportSpecifications.toEndOfDay(to);

        List<Object[]> visitorData = visitorRepository.countByDateRange(start, end);

        Map<String, Long> monthlyCounts = new LinkedHashMap<>();
        for (Object[] row : visitorData) {
            LocalDate date = ((java.sql.Date) row[0]).toLocalDate();
            String monthKey = date.getYear() + "-" + String.format("%02d", date.getMonthValue());
            monthlyCounts.merge(monthKey, (Long) row[1], Long::sum);
        }

        List<TrendPoint> result = new ArrayList<>();
        for (Map.Entry<String, Long> entry : monthlyCounts.entrySet()) {
            result.add(TrendPoint.builder().label(entry.getKey()).count(entry.getValue()).build());
        }
        return result;
    }

    @Override
    public List<DepartmentTrendPoint> getDepartmentAnalytics(LocalDate fromDate, LocalDate toDate) {
        LocalDate from = fromDate != null ? fromDate : LocalDate.now().minusDays(30);
        LocalDate to = toDate != null ? toDate : LocalDate.now();

        OffsetDateTime start = ReportSpecifications.toStartOfDay(from);
        OffsetDateTime end = ReportSpecifications.toEndOfDay(to);

        List<DepartmentTrendPoint> result = new ArrayList<>();
        for (HostDepartment dept : HostDepartment.values()) {
            long visitorCount = visitorRepository.countByTimeInBetweenAndHostDepartment(start, end, dept.name());
            long gatePassCount = studentGatePassRepository.countByStudentDepartmentAndCreatedAtBetween(
                    dept.name(), start, end);
            result.add(DepartmentTrendPoint.builder()
                    .department(dept.name())
                    .visitorCount(visitorCount)
                    .gatePassCount(gatePassCount)
                    .build());
        }
        return result;
    }

    @Override
    public List<GateTrendPoint> getGateAnalytics(LocalDate fromDate, LocalDate toDate) {
        LocalDate from = fromDate != null ? fromDate : LocalDate.now().minusDays(30);
        LocalDate to = toDate != null ? toDate : LocalDate.now();

        OffsetDateTime start = ReportSpecifications.toStartOfDay(from);
        OffsetDateTime end = ReportSpecifications.toEndOfDay(to);

        List<Gate> gates = gateRepository.findByActiveTrue();
        List<GateTrendPoint> result = new ArrayList<>();

        for (Gate gate : gates) {
            long visitorCount = visitorRepository.countByGateIdAndTimeInBetween(gate.getId(), start, end);
            long vehicleCount = vehicleLogRepository.countByEntryTimeBetweenAndGateId(start, end, gate.getId());
            long vendorCount = vendorVisitRepository.countByEntryTimeBetweenAndGateId(start, end, gate.getId());
            long shiftCount = shiftRepository.countByGateIdAndDateBetween(gate.getId(), from, to);

            result.add(GateTrendPoint.builder()
                    .gateId(gate.getId())
                    .gateName(gate.getName())
                    .visitorCount(visitorCount)
                    .vehicleCount(vehicleCount)
                    .vendorCount(vendorCount)
                    .shiftCount(shiftCount)
                    .build());
        }
        return result;
    }

    @Override
    public List<VehicleTrendPoint> getVehicleAnalytics(LocalDate fromDate, LocalDate toDate) {
        LocalDate from = fromDate != null ? fromDate : LocalDate.now().minusDays(30);
        LocalDate to = toDate != null ? toDate : LocalDate.now();

        OffsetDateTime start = ReportSpecifications.toStartOfDay(from);
        OffsetDateTime end = ReportSpecifications.toEndOfDay(to);

        long totalEntries = vehicleLogRepository.countByEntryTimeBetween(start, end);
        long totalExits = vehicleLogRepository.countByExitTimeBetween(start, end);
        long currentlyInside = vehicleLogRepository.countByExitTimeIsNull();

        List<VehicleTrendPoint> result = new ArrayList<>();
        result.add(VehicleTrendPoint.builder()
                .category("ALL")
                .entryCount(totalEntries)
                .exitCount(totalExits)
                .insideCount(currentlyInside)
                .build());

        Object[] categoryData = vehicleLogRepository.countByVehicleCategoryBetween(start, end);
        if (categoryData != null) {
            for (Object row : categoryData) {
                Object[] arr = (Object[]) row;
                VehicleCategory cat = (VehicleCategory) arr[0];
                long count = (Long) arr[1];
                result.add(VehicleTrendPoint.builder()
                        .category(cat.name())
                        .entryCount(count)
                        .exitCount(0)
                        .insideCount(0)
                        .build());
            }
        }

        return result;
    }

    @Override
    public List<PeakHoursResponse> getVisitorAnalytics(LocalDate fromDate, LocalDate toDate) {
        LocalDate from = fromDate != null ? fromDate : LocalDate.now().minusDays(7);
        LocalDate to = toDate != null ? toDate : LocalDate.now();

        OffsetDateTime start = ReportSpecifications.toStartOfDay(from);
        OffsetDateTime end = ReportSpecifications.toEndOfDay(to);

        List<Object[]> checkInData = visitorRepository.countCheckInsByHour(start, end);
        Map<Integer, Long> checkInMap = new HashMap<>();
        for (Object[] row : checkInData) {
            int hour = ((Number) row[0]).intValue();
            checkInMap.put(hour, (Long) row[1]);
        }

        List<PeakHoursResponse> result = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            result.add(PeakHoursResponse.builder()
                    .hour(h)
                    .checkInCount(checkInMap.getOrDefault(h, 0L))
                    .build());
        }
        return result;
    }

    @Override
    public List<GuardPerformanceResponse> getGuardPerformance(LocalDate fromDate, LocalDate toDate) {
        LocalDate from = fromDate != null ? fromDate : LocalDate.now().minusDays(30);
        LocalDate to = toDate != null ? toDate : LocalDate.now();

        List<Guard> guards = guardRepository.findByActiveTrue(PageRequest.of(0, Integer.MAX_VALUE)).getContent();
        List<GuardPerformanceResponse> result = new ArrayList<>();

        for (Guard guard : guards) {
            long totalShifts = shiftRepository.countByGuardIdAndDateBetween(guard.getId(), from, to);
            long completedShifts = shiftRepository.countByGuardIdAndStatus(guard.getId(), ShiftStatus.COMPLETED);

            String gateName = guard.getAssignedGate() != null ? guard.getAssignedGate().getName() : "Unassigned";

            result.add(GuardPerformanceResponse.builder()
                    .guardId(guard.getId())
                    .guardName(guard.getUser() != null ? guard.getUser().getFullName() : "N/A")
                    .employeeCode(guard.getEmployeeCode())
                    .gateName(gateName)
                    .totalShifts(totalShifts)
                    .completedShifts(completedShifts)
                    .ongoingShifts(totalShifts - completedShifts)
                    .build());
        }
        return result;
    }

    @Override
    public List<RecentActivityRow> getRecentActivities(int limit) {
        int fetchLimit = Math.min(limit, 50);
        List<AuditLog> logs = auditLogRepository.findTop20ByOrderByTimestampDesc();
        if (logs.size() > fetchLimit) {
            logs = logs.subList(0, fetchLimit);
        }

        List<RecentActivityRow> result = new ArrayList<>();
        for (AuditLog log : logs) {
            String performedBy = "System";
            if (log.getUser() != null) {
                performedBy = log.getUser().getFullName();
            }

            result.add(RecentActivityRow.builder()
                    .id(log.getId())
                    .entityType(log.getEntityType())
                    .action(log.getAction())
                    .entityId(log.getEntityId())
                    .description(log.getAction() + " " + log.getEntityType() + " #" + log.getEntityId())
                    .performedBy(performedBy)
                    .timestamp(log.getTimestamp())
                    .build());
        }
        return result;
    }
}
