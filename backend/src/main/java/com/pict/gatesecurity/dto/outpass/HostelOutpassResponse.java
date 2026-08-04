package com.pict.gatesecurity.dto.outpass;

import com.pict.gatesecurity.entity.enums.OutpassStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HostelOutpassResponse {

    private Long id;
    private Long studentUserId;
    private String studentUsername;
    private String studentName;
    private String studentPrn;
    private String studentMobile;
    private String studentRoom;
    private String studentHostel;
    private String studentClass;
    private String studentDivision;
    private String reason;
    private String studentNote;
    private String destination;
    private OffsetDateTime departureTime;
    private OffsetDateTime expectedReturnTime;
    private OffsetDateTime actualReturnTime;
    private String parentContact;
    private String emergencyContact;
    private OutpassStatus status;
    private Long wardenId;
    private String wardenUsername;
    private String wardenRemarks;
    private String rejectionReason;
    private OffsetDateTime wardenActedAt;
    private OffsetDateTime gateExitAt;
    private OffsetDateTime gateEntryAt;
    private Long gateId;
    private String gateName;
    private Boolean isLateReturn;
    private OffsetDateTime createdAt;
    private String createdByUsername;
}
