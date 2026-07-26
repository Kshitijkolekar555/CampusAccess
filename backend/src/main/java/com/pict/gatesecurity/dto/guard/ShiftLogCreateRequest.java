package com.pict.gatesecurity.dto.guard;

import com.pict.gatesecurity.entity.enums.LogType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftLogCreateRequest {

    @NotBlank(message = "Log description is required")
    private String description;

    @NotNull(message = "Log type is required")
    private LogType logType;
}
