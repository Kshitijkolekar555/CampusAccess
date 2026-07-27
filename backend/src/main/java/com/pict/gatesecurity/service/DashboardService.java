package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.dashboard.*;
import com.pict.gatesecurity.dto.report.GuardPerformanceResponse;
import com.pict.gatesecurity.dto.report.PeakHoursResponse;

import java.time.LocalDate;
import java.util.List;

public interface DashboardService {

    AdminDashboardResponse getAdminDashboard();

    GuardSelfDashboardResponse getGuardSelfDashboard(Long userId);

    WardenDashboardResponse getWardenDashboard(String hostel);

    DailyTrendResponse getDailyTrends(LocalDate fromDate, LocalDate toDate);

    List<TrendPoint> getWeeklyTrends(LocalDate fromDate, LocalDate toDate);

    List<TrendPoint> getMonthlyTrends(LocalDate fromDate, LocalDate toDate);

    List<DepartmentTrendPoint> getDepartmentAnalytics(LocalDate fromDate, LocalDate toDate);

    List<GateTrendPoint> getGateAnalytics(LocalDate fromDate, LocalDate toDate);

    List<VehicleTrendPoint> getVehicleAnalytics(LocalDate fromDate, LocalDate toDate);

    List<PeakHoursResponse> getVisitorAnalytics(LocalDate fromDate, LocalDate toDate);

    List<GuardPerformanceResponse> getGuardPerformance(LocalDate fromDate, LocalDate toDate);

    List<RecentActivityRow> getRecentActivities(int limit);

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    class TrendPoint {
        private String label;
        private long count;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    class DepartmentTrendPoint {
        private String department;
        private long visitorCount;
        private long gatePassCount;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    class GateTrendPoint {
        private Long gateId;
        private String gateName;
        private long visitorCount;
        private long vehicleCount;
        private long vendorCount;
        private long shiftCount;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    class VehicleTrendPoint {
        private String category;
        private long entryCount;
        private long exitCount;
        private long insideCount;
    }
}
