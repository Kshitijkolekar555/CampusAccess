package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.report.*;

import java.time.LocalDate;
import java.util.List;

public interface AnalyticsService {

    List<PeakHoursResponse> getPeakEntryHours(LocalDate fromDate, LocalDate toDate);

    List<PeakHoursResponse> getPeakExitHours(LocalDate fromDate, LocalDate toDate);

    List<TrendDataPoint> getDailyVisitorTrend(LocalDate fromDate, LocalDate toDate);

    List<TrendDataPoint> getMonthlyVisitorTrend(LocalDate fromDate, LocalDate toDate);

    List<TrendDataPoint> getVehicleTrends(LocalDate fromDate, LocalDate toDate);

    List<GuardPerformanceResponse> getGuardPerformance(LocalDate fromDate, LocalDate toDate);

    List<DepartmentVisitorResponse> getDepartmentWiseVisitors(LocalDate fromDate, LocalDate toDate);

    List<VendorStatisticsResponse> getVendorStatistics(LocalDate fromDate, LocalDate toDate);

    List<GateUtilizationResponse> getGateUtilization(LocalDate fromDate, LocalDate toDate);
}
