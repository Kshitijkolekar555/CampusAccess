package com.pict.gatesecurity.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeriodicReportRow {

    private String periodLabel;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private Long visitorCheckIns;
    private Long visitorCheckOuts;
    private Long vehicleEntries;
    private Long vehicleExits;
    private Long studentPassesIssued;
    private Long studentPassesCompleted;
    private Long hostelOutpassesIssued;
    private Long hostelOutpassesReturned;
    private Long vendorVisits;
    private Long guardShiftsTotal;
    private Long notificationsSent;
    private Long totalActivity;
}
