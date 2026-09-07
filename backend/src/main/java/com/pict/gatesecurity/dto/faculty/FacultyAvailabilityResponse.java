package com.pict.gatesecurity.dto.faculty;

import com.pict.gatesecurity.entity.enums.FacultyAvailabilityStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultyAvailabilityResponse {

    private Long id;
    private Long facultyId;
    private String facultyName;
    private String facultyUsername;
    private LocalDate availabilityDate;
    private FacultyAvailabilityStatus status;
    private String note;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
