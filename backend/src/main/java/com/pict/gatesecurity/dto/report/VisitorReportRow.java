package com.pict.gatesecurity.dto.report;

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
public class VisitorReportRow {

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
    private Boolean isBlacklistedMatch;
    private String notes;
    private String createdByUsername;
    private Long durationMinutes;
}
