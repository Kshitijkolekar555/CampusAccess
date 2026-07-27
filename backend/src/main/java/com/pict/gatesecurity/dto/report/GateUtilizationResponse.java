package com.pict.gatesecurity.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GateUtilizationResponse {

    private Long gateId;
    private String gateName;
    private String gateLocation;
    private Long totalVisitorEntries;
    private Long totalVisitorExits;
    private Long totalVehicleEntries;
    private Long totalVehicleExits;
    private Long totalVendorVisits;
    private Long totalGuardShifts;
    private Long totalActivity;
    private Double utilizationPercentage;
}
