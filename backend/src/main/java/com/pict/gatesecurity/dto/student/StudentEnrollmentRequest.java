package com.pict.gatesecurity.dto.student;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentEnrollmentRequest {

    @NotBlank(message = "Student PRN is required")
    private String prn;

    private String rollNumber;
    private String department;
    private String academicYear;
    private String division;

    @Builder.Default
    private Boolean consentRecorded = true;
}
