package com.pict.gatesecurity.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuardPerformanceResponse {

    private Long guardId;
    private String guardName;
    private String employeeCode;
    private String gateName;
    private Long totalShifts;
    private Long completedShifts;
    private Long ongoingShifts;
    private Long totalShiftMinutes;
    private Long averageShiftMinutes;
    private Long totalLogs;
    private Long securityCheckLogs;
    private Long incidentLogs;
    private Long taskLogs;
}
