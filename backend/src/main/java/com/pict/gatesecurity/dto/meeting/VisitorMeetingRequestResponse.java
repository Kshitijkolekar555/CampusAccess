package com.pict.gatesecurity.dto.meeting;

import com.pict.gatesecurity.entity.enums.HostDepartment;
import com.pict.gatesecurity.entity.enums.MeetingRequestStatus;
import com.pict.gatesecurity.entity.enums.PurposeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisitorMeetingRequestResponse {

    private Long id;
    private Long visitorId;
    private String visitorName;
    private String visitorMobile;
    private String visitorPurpose;
    private String visitorIdProofType;
    private String visitorIdProofNumber;
    private String visitorVehicleNumber;
    private PurposeType purposeType;
    private HostDepartment department;
    private Long facultyId;
    private String facultyName;
    private String facultyUsername;
    private Long gateId;
    private String gateName;
    private OffsetDateTime requestTime;
    private MeetingRequestStatus status;
    private MeetingResponseDto latestResponse;
    private OffsetDateTime createdAt;
}
