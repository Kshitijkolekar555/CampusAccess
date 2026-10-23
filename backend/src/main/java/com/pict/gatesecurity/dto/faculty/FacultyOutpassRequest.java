package com.pict.gatesecurity.dto.faculty;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultyOutpassRequest {

    @NotBlank(message = "Reason for leaving is required")
    private String reason;

    private String explanation;
}
