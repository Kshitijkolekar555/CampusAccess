package com.pict.gatesecurity.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {

    private Long guardsOnDuty;
    private Long visitorsCurrentlyInside;
    private Long canteenStaffPresent;
    private Long vehiclesCurrentlyInside;
    private Long overstayingVisitors;
    private Long todayTotalVisitors;
    private Long todayTotalVehicleEntries;
    private Long todayTotalVendorVisits;
    private Long todayStudentPassesIssued;
    private Long todayHostelOutpassesIssued;
    private Long pendingNotifications;
    private Long blacklistedMatchesToday;
}
