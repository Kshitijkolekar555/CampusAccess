package com.pict.gatesecurity.dto.guard;

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
public class GuardCreateRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Employee code is required")
    @Size(min = 2, max = 30, message = "Employee code must be between 2 and 30 characters")
    private String employeeCode;

    private Long assignedGateId;
}
