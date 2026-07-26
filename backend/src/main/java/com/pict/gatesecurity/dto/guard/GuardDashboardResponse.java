package com.pict.gatesecurity.dto.guard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuardDashboardResponse {

    private long activeShiftsCount;
    private long activeGuardCount;
    private long activeVisitorsInsideCount;
    private long totalVisitorsCheckedInTodayCount;
    private List<ShiftLogResponse> recentLogs;
}
