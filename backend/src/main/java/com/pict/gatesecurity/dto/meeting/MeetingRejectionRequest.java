package com.pict.gatesecurity.dto.meeting;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingRejectionRequest {

    @NotBlank(message = "Rejection reason is required")
    private String reason;
}
