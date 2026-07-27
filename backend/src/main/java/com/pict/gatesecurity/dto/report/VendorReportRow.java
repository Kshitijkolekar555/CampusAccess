package com.pict.gatesecurity.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorReportRow {

    private Long id;
    private Long vendorId;
    private String companyName;
    private String contactPerson;
    private String contactPhone;
    private Long gateId;
    private String gateName;
    private OffsetDateTime entryTime;
    private OffsetDateTime exitTime;
    private String purpose;
    private Boolean vendorBlacklisted;
    private String createdByUsername;
    private Long durationMinutes;
}
