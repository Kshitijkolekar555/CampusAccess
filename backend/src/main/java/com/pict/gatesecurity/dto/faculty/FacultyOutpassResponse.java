package com.pict.gatesecurity.dto.faculty;

import com.pict.gatesecurity.entity.enums.FacultyOutpassStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultyOutpassResponse {
    private Long id;
    private String passNumber;
    private Long facultyUserId;
    private String facultyEmpNo;
    private String facultyName;
    private String department;
    private String reason;
    private String explanation;
    private FacultyOutpassStatus status;
    private String statusLabel;
    private OffsetDateTime generatedAt;
    private OffsetDateTime departureTime;
    private OffsetDateTime actualReturnTime;
    private Long confirmedByGuardId;
    private String confirmedByGuardName;
    private String guardNotes;
    private Long gateId;
    private String gateName;
}
