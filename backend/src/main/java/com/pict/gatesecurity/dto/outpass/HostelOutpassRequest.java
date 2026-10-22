package com.pict.gatesecurity.dto.outpass;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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
public class HostelOutpassRequest {

    private Long studentUserId;

    @NotBlank(message = "Student name is required")
    @Size(min = 2, max = 150, message = "Student name must be between 2 and 150 characters")
    @Pattern(regexp = "^[a-zA-Z0-9\\s.']{2,150}$", message = "Student name must contain letters and spaces only")
    private String studentName;

    @NotBlank(message = "Student PRN is required")
    @Pattern(regexp = "^[A-Z0-9]{8,20}$", message = "Student PRN must be 8 to 20 alphanumeric characters")
    private String studentPrn;

    @Pattern(regexp = "^([6-9][0-9]{9})?$", message = "Student mobile must be a valid 10-digit Indian mobile number")
    private String studentMobile;

    @Size(max = 20, message = "Room number must be at most 20 characters")
    private String studentRoom;

    @Size(max = 100, message = "Hostel name must be at most 100 characters")
    private String studentHostel;

    @Size(max = 50, message = "Class must be at most 50 characters")
    private String studentClass;

    @Size(max = 10, message = "Division must be at most 10 characters")
    private String studentDivision;

    @NotBlank(message = "Reason is required")
    @Size(min = 3, max = 255, message = "Reason must be between 3 and 255 characters")
    private String reason;

    private String studentNote;

    @NotBlank(message = "Destination is required")
    @Size(min = 2, max = 255, message = "Destination must be between 2 and 255 characters")
    private String destination;

    @NotNull(message = "Departure time is required")
    private OffsetDateTime departureTime;

    @NotNull(message = "Expected return time is required")
    private OffsetDateTime expectedReturnTime;

    @Pattern(regexp = "^([6-9][0-9]{9})?$", message = "Parent contact must be a valid 10-digit Indian mobile number")
    private String parentContact;

    @Pattern(regexp = "^([6-9][0-9]{9})?$", message = "Emergency contact must be a valid 10-digit Indian mobile number")
    private String emergencyContact;
}
