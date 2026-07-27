package com.pict.gatesecurity.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponse {

    private Long todayVisitors;
    private Long visitorsInside;
    private Long todayVehicles;
    private Long vehiclesInside;
    private Long todayGatePasses;
    private Long todayHostelOutpasses;
    private Long todayVendorEntries;
    private Long guardsOnDuty;
    private Long activeShifts;
    private Long watchlistMatches;
    private Long pendingGatePassApprovals;
    private Long pendingOutpassApprovals;
    private Long totalPendingApprovals;
    private Long canteenStaffPresent;
    private Long overstayingVisitors;
    private Long pendingNotifications;
}
