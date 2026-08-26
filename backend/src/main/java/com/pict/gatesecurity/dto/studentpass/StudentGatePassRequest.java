package com.pict.gatesecurity.dto.studentpass;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentGatePassRequest {

    private Long studentUserId;

    @NotBlank(message = "Student name is required")
    @Size(min = 2, max = 150, message = "Student name must be between 2 and 150 characters")
    @jakarta.validation.constraints.Pattern(regexp = "^[a-zA-Z\\s.']{2,150}$", message = "Student name must contain letters and spaces only")
    private String studentName;

    @NotBlank(message = "Student PRN is required")
    @jakarta.validation.constraints.Pattern(regexp = "^[A-Z0-9]{8,20}$", message = "Student PRN must be 8 to 20 alphanumeric characters")
    private String studentPrn;

    @jakarta.validation.constraints.Pattern(regexp = "^([6-9][0-9]{9})?$", message = "Student mobile must be a valid 10-digit Indian mobile number")
    private String studentMobile;

    @Size(max = 50, message = "Class must be at most 50 characters")
    private String studentClass;

    @Size(max = 10, message = "Division must be at most 10 characters")
    private String studentDivision;

    @Size(max = 50, message = "Department must be at most 50 characters")
    private String studentDepartment;

    @NotBlank(message = "Purpose is required")
    @Size(min = 3, max = 255, message = "Purpose must be between 3 and 255 characters")
    private String purpose;

    @NotBlank(message = "Destination is required")
    @Size(min = 2, max = 255, message = "Destination must be between 2 and 255 characters")
    private String destination;

    @NotNull(message = "Departure time is required")
    private OffsetDateTime departureTime;

    @NotNull(message = "Expected return time is required")
    private OffsetDateTime expectedReturnTime;
}
