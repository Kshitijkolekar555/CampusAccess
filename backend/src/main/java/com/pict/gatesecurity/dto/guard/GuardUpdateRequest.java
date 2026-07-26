package com.pict.gatesecurity.dto.guard;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuardUpdateRequest {

    private Long assignedGateId;

    @NotNull(message = "Active status is required")
    private Boolean active;
}
