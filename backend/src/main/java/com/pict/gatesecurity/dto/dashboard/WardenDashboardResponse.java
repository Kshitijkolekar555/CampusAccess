package com.pict.gatesecurity.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WardenDashboardResponse {

    private Long pendingOutpassRequests;
    private Long approvedRequests;
    private Long rejectedRequests;
    private Long lateReturns;
    private Long activeOutpasses;
    private Long todaySubmitted;
    private Long todayApproved;
    private Long todayRejected;
}
