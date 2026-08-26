package com.pict.gatesecurity.dto.visitor;

import com.pict.gatesecurity.entity.enums.HostDepartment;
import com.pict.gatesecurity.entity.enums.HostType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisitorResponse {

    private Long id;
    private String name;
    private String mobile;
    private String purpose;
    private String hostName;
    private HostType hostType;
    private HostDepartment hostDepartment;
    private String studentPrn;
    private Long gateId;
    private String gateName;
    private String vehicleNumber;
    private OffsetDateTime timeIn;
    private OffsetDateTime timeOut;
    private String idProofType;
    private String idProofNumber;
    private String photoUrl;
    private String faceId;
    private Boolean isBlacklistedMatch;
    private String notes;
    private OffsetDateTime createdAt;
    private String createdByUsername;
    private String passNumber;
    private String qrCodeDataUrl;
}
