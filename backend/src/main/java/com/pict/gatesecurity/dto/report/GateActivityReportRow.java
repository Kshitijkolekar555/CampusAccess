package com.pict.gatesecurity.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GateActivityReportRow {

    private Long gateId;
    private String gateName;
    private String gateLocation;
    private LocalDate date;
    private Long visitorCheckIns;
    private Long visitorCheckOuts;
    private Long vehicleEntries;
    private Long vehicleExits;
    private Long vendorVisits;
    private Long studentPasses;
    private Long hostelOutpasses;
    private Long totalActivity;
}
