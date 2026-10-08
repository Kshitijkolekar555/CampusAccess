package com.pict.gatesecurity.dto.outpass;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HostelOutpassApprovalRequest {

    private boolean approved;

    private String wardenRemarks;

    @NotBlank(message = "Rejection reason is required when rejecting")
    private String rejectionReason;
}
