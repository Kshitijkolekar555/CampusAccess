package com.pict.gatesecurity.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeakHoursResponse {

    private Integer hour;
    private Long checkInCount;
    private Long checkOutCount;
    private Long vehicleEntryCount;
    private Long vehicleExitCount;
}
