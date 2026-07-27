package com.pict.gatesecurity.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorStatisticsResponse {

    private Long vendorId;
    private String companyName;
    private String contactPerson;
    private Long totalVisits;
    private Long activeVisits;
    private Boolean isBlacklisted;
    private Long avgDurationMinutes;
}
