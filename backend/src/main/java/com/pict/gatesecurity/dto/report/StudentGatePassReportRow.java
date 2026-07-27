package com.pict.gatesecurity.dto.report;

import com.pict.gatesecurity.entity.enums.PassStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentGatePassReportRow {

    private Long id;
    private String studentName;
    private String studentPrn;
    private String studentMobile;
    private String studentDepartment;
    private String studentClass;
    private String purpose;
    private String destination;
    private OffsetDateTime departureTime;
    private OffsetDateTime expectedReturnTime;
    private OffsetDateTime actualReturnTime;
    private PassStatus status;
    private String approvedByName;
    private OffsetDateTime gateExitAt;
    private OffsetDateTime gateEntryAt;
    private Long gateId;
    private String gateName;
    private OffsetDateTime createdAt;
    private String createdByUsername;
}
