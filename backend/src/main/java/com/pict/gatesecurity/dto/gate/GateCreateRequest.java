package com.pict.gatesecurity.dto.gate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GateCreateRequest {

    @NotBlank(message = "Gate name is required")
    @Size(min = 2, max = 100, message = "Gate name must be between 2 and 100 characters")
    private String name;

    private String location;

    @NotNull(message = "Active status is required")
    @Builder.Default
    private Boolean active = true;
}
