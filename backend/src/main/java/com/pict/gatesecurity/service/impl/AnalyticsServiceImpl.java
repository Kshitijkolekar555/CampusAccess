package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.dto.report.*;
import com.pict.gatesecurity.entity.enums.EntryStatus;
import com.pict.gatesecurity.entity.enums.ShiftStatus;
import com.pict.gatesecurity.repository.*;
import com.pict.gatesecurity.service.AnalyticsService;
import com.pict.gatesecurity.util.ReportSpecifications;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {

    private final VisitorRepository visitorRepository;
    private final VehicleLogRepository vehicleLogRepository;
    private final VendorVisitRepository vendorVisitRepository;
    private final GuardRepository guardRepository;
    private final ShiftRepository shiftRepository;
    private final ShiftLogRepository shiftLogRepository;
    private final GateRepository gateRepository;
    private final StudentGatePassRepository studentGatePassRepository;
    private final HostelOutpassRepository hostelOutpassRepository;
    private final VendorRepository vendorRepository;
    private final CanteenEntryRepository canteenEntryRepository;
    private final CanteenStaffRepository canteenStaffRepository;

    @Override
    public List<PeakHoursResponse> getPeakEntryHours(LocalDate fromDate, LocalDate toDate) {
        LocalDate from = fromDate != null ? fromDate : LocalDate.now().minusDays(30);
        LocalDate to = toDate != null ? toDate : LocalDate.now();

        OffsetDateTime start = ReportSpecifications.toStartOfDay(from);
        OffsetDateTime end = ReportSpecifications.toEndOfDay(to);

        List<Object[]> checkInData = visitorRepository.countCheckInsByHour(start, end);

        List<PeakHoursResponse> result = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            int hour = h;
            long checkInCount = checkInData.stream()
                    .filter(row -> ((Number) row[0]).intValue() == hour)
                    .mapToLong(row -> ((Number) row[1]).longValue())
                    .sum();

            result.add(PeakHoursResponse.builder()
                    .hour(hour)
                    .checkInCount(checkInCount)
                    .vehicleEntryCount(0L)
                    .build());
        }
        return result;
    }

    @Override
    public List<PeakHoursResponse> getPeakExitHours(LocalDate fromDate, LocalDate toDate) {
        LocalDate from = fromDate != null ? fromDate : LocalDate.now().minusDays(30);
        LocalDate to = toDate != null ? toDate : LocalDate.now();

        OffsetDateTime start = ReportSpecifications.toStartOfDay(from);
        OffsetDateTime end = ReportSpecifications.toEndOfDay(to);

        List<Object[]> checkOutData = visitorRepository.countCheckOutsByHour(start, end);

        List<PeakHoursResponse> result = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            int hour = h;
            long checkOutCount = checkOutData.stream()
                    .filter(row -> ((Number) row[0]).intValue() == hour)
                    .mapToLong(row -> ((Number) row[1]).longValue())
                    .sum();

            result.add(PeakHoursResponse.builder()
                    .hour(hour)
                    .checkOutCount(checkOutCount)
                    .build());
        }
        return result;
    }

    @Override
    public List<TrendDataPoint> getDailyVisitorTrend(LocalDate fromDate, LocalDate toDate) {
        LocalDate from = fromDate != null ? fromDate : LocalDate.now().minusDays(30);
        LocalDate to = toDate != null ? toDate : LocalDate.now();

        OffsetDateTime start = ReportSpecifications.toStartOfDay(from);
        OffsetDateTime end = ReportSpecifications.toEndOfDay(to);

        List<Object[]> data = visitorRepository.countByDateRange(start, end);

        List<TrendDataPoint> result = new ArrayList<>();
        LocalDate current = from;
        while (!current.isAfter(to)) {
            LocalDate finalCurrent = current;
            long count = data.stream()
                    .filter(row -> row[0] != null && row[0].toString().equals(finalCurrent.toString()))
                    .mapToLong(row -> ((Number) row[1]).longValue())
                    .sum();

            result.add(TrendDataPoint.builder()
                    .date(current)
                    .label(current.toString())
                    .value(count)
                    .build());
            current = current.plusDays(1);
        }
        return result;
    }

    @Override
    public List<TrendDataPoint> getMonthlyVisitorTrend(LocalDate fromDate, LocalDate toDate) {
        LocalDate from = fromDate != null ? fromDate : LocalDate.now().minusYears(1);
        LocalDate to = toDate != null ? toDate : LocalDate.now();

        OffsetDateTime start = ReportSpecifications.toStartOfDay(from.withDayOfMonth(1));
        OffsetDateTime end = ReportSpecifications.toEndOfDay(to.withDayOfMonth(to.lengthOfMonth()));

        List<TrendDataPoint> result = new ArrayList<>();
        LocalDate current = from.withDayOfMonth(1);
        while (!current.isAfter(to)) {
            LocalDate monthEnd = current.withDayOfMonth(current.lengthOfMonth());
            OffsetDateTime monthStart = ReportSpecifications.toStartOfDay(current);
            OffsetDateTime monthEndDt = ReportSpecifications.toEndOfDay(monthEnd);

            long count = visitorRepository.countByTimeInBetween(monthStart, monthEndDt);

            result.add(TrendDataPoint.builder()
                    .date(current)
                    .label(current.getMonth() + " " + current.getYear())
                    .value(count)
                    .build());
            current = current.plusMonths(1);
        }
        return result;
    }

    @Override
    public List<TrendDataPoint> getVehicleTrends(LocalDate fromDate, LocalDate toDate) {
        LocalDate from = fromDate != null ? fromDate : LocalDate.now().minusDays(30);
        LocalDate to = toDate != null ? toDate : LocalDate.now();

        OffsetDateTime start = ReportSpecifications.toStartOfDay(from);
        OffsetDateTime end = ReportSpecifications.toEndOfDay(to);

        List<TrendDataPoint> result = new ArrayList<>();
        LocalDate current = from;
        while (!current.isAfter(to)) {
            OffsetDateTime dayStart = ReportSpecifications.toStartOfDay(current);
            OffsetDateTime dayEnd = ReportSpecifications.toEndOfDay(current);

            long entries = vehicleLogRepository.countByEntryTimeBetween(dayStart, dayEnd);
            long exits = vehicleLogRepository.countByExitTimeBetween(dayStart, dayEnd);

            result.add(TrendDataPoint.builder()
                    .date(current)
                    .label(current.toString())
                    .value(entries)
                    .secondaryValue(exits)
                    .build());
            current = current.plusDays(1);
        }
        return result;
    }

    @Override
    public List<GuardPerformanceResponse> getGuardPerformance(LocalDate fromDate, LocalDate toDate) {
        LocalDate from = fromDate != null ? fromDate : LocalDate.now().minusMonths(1);
        LocalDate to = toDate != null ? toDate : LocalDate.now();

        List<GuardPerformanceResponse> result = new ArrayList<>();
        var guards = guardRepository.findByActiveTrue(PageRequest.of(0, 1000));

        for (var guard : guards) {
            long totalShifts = shiftRepository.countByGuardIdAndDateBetween(guard.getId(), from, to);
            long completedShifts = shiftRepository.findByGuardIdAndDateBetween(guard.getId(), from, to).stream()
                    .filter(s -> s.getStatus() == ShiftStatus.COMPLETED)
                    .count();
            long ongoingShifts = shiftRepository.countByGuardIdAndStatus(guard.getId(), ShiftStatus.ONGOING);

            var shifts = shiftRepository.findByGuardIdAndDateBetween(guard.getId(), from, to);
            long totalMinutes = shifts.stream()
                    .filter(s -> s.getEndTime() != null)
                    .mapToLong(s -> java.time.temporal.ChronoUnit.MINUTES.between(s.getStartTime(), s.getEndTime()))
                    .sum();
            long avgMinutes = totalShifts > 0 ? totalMinutes / totalShifts : 0;

            result.add(GuardPerformanceResponse.builder()
                    .guardId(guard.getId())
                    .guardName(guard.getUser() != null ? guard.getUser().getFullName() : null)
                    .employeeCode(guard.getEmployeeCode())
                    .gateName(guard.getAssignedGate() != null ? guard.getAssignedGate().getName() : null)
                    .totalShifts(totalShifts)
                    .completedShifts(completedShifts)
                    .ongoingShifts(ongoingShifts)
                    .totalShiftMinutes(totalMinutes)
                    .averageShiftMinutes(avgMinutes)
                    .build());
        }
        return result;
    }

    @Override
    public List<DepartmentVisitorResponse> getDepartmentWiseVisitors(LocalDate fromDate, LocalDate toDate) {
        LocalDate from = fromDate != null ? fromDate : LocalDate.now().minusMonths(1);
        LocalDate to = toDate != null ? toDate : LocalDate.now();

        OffsetDateTime start = ReportSpecifications.toStartOfDay(from);
        OffsetDateTime end = ReportSpecifications.toEndOfDay(to);

        List<DepartmentVisitorResponse> result = new ArrayList<>();
        for (com.pict.gatesecurity.entity.enums.HostDepartment dept :
                com.pict.gatesecurity.entity.enums.HostDepartment.values()) {
            long count = visitorRepository.countByTimeInBetweenAndHostDepartment(start, end, dept.name());
            result.add(DepartmentVisitorResponse.builder()
                    .department(dept.name())
                    .visitorCount(count)
                    .build());
        }
        return result;
    }

    @Override
    public List<VendorStatisticsResponse> getVendorStatistics(LocalDate fromDate, LocalDate toDate) {
        LocalDate from = fromDate != null ? fromDate : LocalDate.now().minusMonths(1);
        LocalDate to = toDate != null ? toDate : LocalDate.now();

        OffsetDateTime start = ReportSpecifications.toStartOfDay(from);
        OffsetDateTime end = ReportSpecifications.toEndOfDay(to);

        List<VendorStatisticsResponse> result = new ArrayList<>();
        var vendors = vendorRepository.findAll();
        for (var vendor : vendors) {
            long totalVisits = vendorVisitRepository.countByVendorIdAndEntryTimeBetween(vendor.getId(), start, end);
            result.add(VendorStatisticsResponse.builder()
                    .vendorId(vendor.getId())
                    .companyName(vendor.getCompanyName())
                    .contactPerson(vendor.getContactPerson())
                    .totalVisits(totalVisits)
                    .isBlacklisted(vendor.getIsBlacklisted())
                    .build());
        }
        return result;
    }

    @Override
    public List<GateUtilizationResponse> getGateUtilization(LocalDate fromDate, LocalDate toDate) {
        LocalDate from = fromDate != null ? fromDate : LocalDate.now().minusMonths(1);
        LocalDate to = toDate != null ? toDate : LocalDate.now();

        OffsetDateTime start = ReportSpecifications.toStartOfDay(from);
        OffsetDateTime end = ReportSpecifications.toEndOfDay(to);

        List<GateUtilizationResponse> result = new ArrayList<>();
        var gates = gateRepository.findAll();
        long grandTotal = 0;

        for (var gate : gates) {
            long visitorEntries = visitorRepository.countByGateIdAndTimeInBetween(gate.getId(), start, end);
            long vehicleEntries = vehicleLogRepository.countByEntryTimeBetweenAndGateId(start, end, gate.getId());
            long vendorVisits = vendorVisitRepository.countByEntryTimeBetweenAndGateId(start, end, gate.getId());
            long total = visitorEntries + vehicleEntries + vendorVisits;
            grandTotal += total;

            result.add(GateUtilizationResponse.builder()
                    .gateId(gate.getId())
                    .gateName(gate.getName())
                    .gateLocation(gate.getLocation())
                    .totalVisitorEntries(visitorEntries)
                    .totalVehicleEntries(vehicleEntries)
                    .totalVendorVisits(vendorVisits)
                    .totalActivity(total)
                    .build());
        }

        long finalGrandTotal = grandTotal;
        for (GateUtilizationResponse g : result) {
            if (finalGrandTotal > 0) {
                g.setUtilizationPercentage((double) g.getTotalActivity() / finalGrandTotal * 100);
            }
        }

        return result;
    }
}
