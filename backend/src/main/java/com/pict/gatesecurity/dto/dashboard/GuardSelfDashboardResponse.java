package com.pict.gatesecurity.dto.dashboard;

import com.pict.gatesecurity.dto.guard.ShiftLogResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuardSelfDashboardResponse {

    private String guardName;
    private String guardId;
    private Long shiftId;
    private String gateName;
    private Long gateId;
    private String shiftName; // Morning / Evening / Night
    private OffsetDateTime shiftStartTime; // In Time
    private OffsetDateTime shiftEndTime;   // Out Time
    private String shiftStatus;
    private String dutyStatus;             // ON DUTY / OFF DUTY

    // Today's activity cards
    private long visitorsEnteredToday;
    private long visitorsExitedToday;
    private long vehiclesEnteredToday;
    private long vehiclesExitedToday;
    private long materialsProcessedToday;
    private long studentPassesProcessedToday;
    private long activeVisitorsInsideCampus;

    // Daily statistics below guard name
    private long todayTotalVisitors;
    private long todayApprovedVisitors;
    private long todayRejectedVisitors;
    private long todayCurrentlyInside;
    private long todayCheckedOutVisitors;

    // Legacy fields for backward compatibility
    private long shiftDurationMinutes;
    private long visitorsProcessed;
    private long vehiclesProcessed;
    private long vendorEntries;
    private long hostelVerifications;

    private List<ShiftLogResponse> recentLogs;
}
