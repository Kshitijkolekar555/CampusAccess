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
public class StudentRosterRequest {

    @NotBlank(message = "PRN / Enrollment number is required")
    private String prn;

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String department;

    private String rollNumber;

    private String phone;

    private String division;

    private String academicYear;
}
