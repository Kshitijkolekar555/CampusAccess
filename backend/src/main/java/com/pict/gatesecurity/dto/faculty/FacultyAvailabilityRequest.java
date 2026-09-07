package com.pict.gatesecurity.dto.faculty;

import com.pict.gatesecurity.entity.enums.FacultyAvailabilityStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultyAvailabilityRequest {

    @NotNull(message = "Availability date is required")
    private LocalDate availabilityDate;

    @NotNull(message = "Status is required")
    private FacultyAvailabilityStatus status;

    private String note;
}
