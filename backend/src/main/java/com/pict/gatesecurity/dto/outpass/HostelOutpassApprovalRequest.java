package com.pict.gatesecurity.dto.outpass;

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

    private String remarks;

    private String rejectionReason;
}
