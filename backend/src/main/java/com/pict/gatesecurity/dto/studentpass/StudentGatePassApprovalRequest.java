package com.pict.gatesecurity.dto.studentpass;

import jakarta.validation.constraints.NotBlank;
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

    @NotBlank(message = "Rejection reason is required when rejecting")
    private String rejectionReason;
}
