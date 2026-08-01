package com.pict.gatesecurity.dto.studentpass;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentGatePassApprovalRequest {

    private boolean approved;

    private String notes;

    private String rejectionReason;
}
