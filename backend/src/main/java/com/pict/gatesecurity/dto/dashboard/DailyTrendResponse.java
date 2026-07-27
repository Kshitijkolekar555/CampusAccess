package com.pict.gatesecurity.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyTrendResponse {

    private LocalDate fromDate;
    private LocalDate toDate;
    private List<TrendPoint> visitorTrend;
    private List<TrendPoint> vehicleTrend;
    private List<TrendPoint> vendorTrend;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendPoint {
        private LocalDate date;
        private long count;
    }
}
