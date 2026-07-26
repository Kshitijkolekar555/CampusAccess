package com.pict.gatesecurity.dto.vendor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorVisitResponse {

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
    private String entryNote;
    private String exitNote;
    private OffsetDateTime createdAt;
    private String createdByUsername;
}
