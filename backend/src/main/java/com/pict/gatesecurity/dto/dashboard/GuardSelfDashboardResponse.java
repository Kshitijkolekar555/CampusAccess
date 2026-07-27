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

    private Long shiftId;
    private String gateName;
    private Long gateId;
    private OffsetDateTime shiftStartTime;
    private OffsetDateTime shiftEndTime;
    private String shiftStatus;
    private long shiftDurationMinutes;
    private long visitorsProcessed;
    private long vehiclesProcessed;
    private long vendorEntries;
    private long hostelVerifications;
    private List<ShiftLogResponse> recentLogs;
}
