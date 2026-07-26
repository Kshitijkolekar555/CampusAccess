package com.pict.gatesecurity.dto.studentpass;

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
public class StudentGatePassResponse {

    private Long id;
    private Long studentUserId;
    private String studentUsername;
    private String studentName;
    private String studentPrn;
    private String studentMobile;
    private String studentClass;
    private String studentDivision;
    private String studentDepartment;
    private String purpose;
    private String destination;
    private OffsetDateTime departureTime;
    private OffsetDateTime expectedReturnTime;
    private OffsetDateTime actualReturnTime;
    private PassStatus status;
    private Long approvedById;
    private String approvedByName;
    private String approvalNotes;
    private String rejectionReason;
    private OffsetDateTime wardenApprovedAt;
    private OffsetDateTime gateExitAt;
    private OffsetDateTime gateEntryAt;
    private Long gateId;
    private String gateName;
    private OffsetDateTime createdAt;
    private String createdByUsername;
}
