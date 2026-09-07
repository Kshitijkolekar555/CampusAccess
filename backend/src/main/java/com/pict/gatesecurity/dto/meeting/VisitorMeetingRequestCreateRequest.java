package com.pict.gatesecurity.dto.meeting;

import com.pict.gatesecurity.entity.enums.HostDepartment;
import com.pict.gatesecurity.entity.enums.PurposeType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisitorMeetingRequestCreateRequest {

    @NotNull(message = "Visitor ID is required")
    private Long visitorId;

    @NotNull(message = "Purpose type is required")
    private PurposeType purposeType;

    private HostDepartment department;

    private Long facultyId;

    @NotNull(message = "Gate ID is required")
    private Long gateId;
}
