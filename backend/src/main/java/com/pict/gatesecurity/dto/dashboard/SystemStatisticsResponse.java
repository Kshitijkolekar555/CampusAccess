package com.pict.gatesecurity.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemStatisticsResponse {

    private String filterType; // "LIFETIME", "TODAY", "YESTERDAY", "THIS_MONTH", "MONTH", "CUSTOM"
    private LocalDate fromDate;
    private LocalDate toDate;
    private String label;

    // Core visitor stats
    private long totalVisitors;
    private long approvedVisitors;
    private long rejectedVisitors;
    private long completedVisits;
    private long currentlyInside; // Live current occupancy

    // Additional cross-system stats
    private long totalVehicles;
    private long totalStudentPasses;
    private long totalHostelOutpasses;
    private long totalVendorVisits;
    private long pendingTokens;

    // Metadata
    private OffsetDateTime generatedAt;
    private String generatedBy;
    private String gateName;
}
