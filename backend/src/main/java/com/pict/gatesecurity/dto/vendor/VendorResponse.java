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
public class VendorResponse {

    private Long id;
    private String companyName;
    private String contactPerson;
    private String contactPhone;
    private String contactEmail;
    private String workDescription;
    private String assignedDepartment;
    private Boolean isBlacklisted;
    private String blacklistReason;
    private OffsetDateTime createdAt;
    private String createdByUsername;
}
