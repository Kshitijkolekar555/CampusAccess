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
public class ShiftStartRequest {

    @NotNull(message = "Gate ID is required")
    private Long gateId;
}
